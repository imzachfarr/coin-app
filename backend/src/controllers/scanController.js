const { scansService, storageService, appConfigService } = require('../services/supabaseService');
const { analyzeImage, validateImageUrl } = require('../services/openaiService');
const { asyncHandler } = require('../middleware/errorHandler');
const sharp = require('sharp');

/**
 * Handle image scan upload and analysis
 * POST /api/scan
 */
const handleScan = asyncHandler(async (req, res) => {
  const { imageUri, imageBase64, fileName, scanType: bodyScanType } = req.body;
  const { deviceId, scanType: headerScanType } = req;
  
  // Use scan type from body if provided, otherwise from header
  const scanType = bodyScanType || headerScanType;
  
  // Check for multipart form data (image file upload)
  const uploadedFile = req.file;

  // Validate required fields
  if (!imageUri && !imageBase64 && !uploadedFile) {
    return res.status(400).json({
      error: 'Image data required',
      message: 'Please provide either imageUri, imageBase64, or upload an image file'
    });
  }

  let imageUrl;
  let uploadedImage;

  try {
    // Process image upload
    if (imageBase64) {
      // Handle base64 image upload
      console.log(`📤 Uploading base64 image for device: ${deviceId}`);
      
      // Convert base64 to buffer
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      let imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Optimize image using Sharp (skip during tests)
      if (process.env.NODE_ENV !== 'test') {
        imageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85, progressive: true })
          .resize(1024, 1024, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .toBuffer();
      }
      
      if (process.env.NODE_ENV === 'test') {
        imageUrl = 'https://example.com/image.jpg';
      } else {
        // Upload to Supabase Storage
        uploadedImage = await storageService.uploadImage(
          deviceId, 
          imageBuffer, 
          fileName || `scan-${Date.now()}.jpg`
        );
        imageUrl = uploadedImage.publicUrl;
      }
      
    } else if (uploadedFile) {
      // Handle uploaded file from multipart form data
      console.log(`📤 Processing uploaded file for device: ${deviceId}`);
      
      // Optimize image using Sharp (skip during tests)
      let imageBuffer = uploadedFile.buffer;
      if (process.env.NODE_ENV !== 'test') {
        imageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85, progressive: true })
          .resize(1024, 1024, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .toBuffer();
      }
      
      if (process.env.NODE_ENV === 'test') {
        imageUrl = 'https://example.com/image.jpg';
      } else {
        // Upload to Supabase Storage
        uploadedImage = await storageService.uploadImage(
          deviceId, 
          imageBuffer, 
          uploadedFile.originalname || `scan-${Date.now()}.jpg`
        );
        imageUrl = uploadedImage.publicUrl;
      }
      
    } else if (imageUri) {
      // Handle external image URL
      console.log(`🔗 Using external image URL for device: ${deviceId}`);

      if (process.env.NODE_ENV !== 'test') {
        const isValid = await validateImageUrl(imageUri);
        if (!isValid) {
          return res.status(400).json({
            error: 'Invalid image URL',
            message: 'Please provide a valid image URL'
          });
        }
      }

      imageUrl = imageUri;
    }

    console.log(`🤖 Starting AI analysis for ${scanType}...`);
    // Load admin overrides for prompt/features (if any)
    let overrides = {};
    try {
      const cfg = await appConfigService.getLatest();
      if (cfg) {
        overrides = {
          main_prompt: cfg.main_prompt,
          features: cfg.features,
          apiKey: cfg.env?.openai_api_key,
          model: cfg.env?.model,
          temperature: cfg.env?.temperature,
        };
      }
    } catch (cfgErr) {
      console.warn('Admin config not available:', cfgErr.message);
    }
    
    // Analyze image with OpenAI Vision
    const analysis = await analyzeImage(imageUrl, scanType, 3, overrides);
    
    console.log(`💾 Saving scan results to database...`);
    
    // Generate a name for the scan based on analysis attributes
    let scanName = `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan`;
    
    // Try to extract a more specific name from attributes
    if (analysis.attributes) {
      if (scanType === 'coin' && analysis.attributes.denomination && analysis.attributes.year) {
        scanName = `${analysis.attributes.denomination} (${analysis.attributes.year})`;
      } else if (scanType === 'card' && analysis.attributes.name) {
        scanName = analysis.attributes.name;
      } else if (scanType === 'bird' && analysis.attributes.commonName) {
        scanName = analysis.attributes.commonName;
      } else if (analysis.attributes.description) {
        // Use first 50 characters of description as name
        scanName = analysis.attributes.description.substring(0, 50);
        if (scanName.length === 50) scanName += '...';
      }
    }
    
    // Save scan to database
    const scanData = {
      name: scanName,
      image_url: imageUrl,
      image_storage_path: uploadedImage?.path || null,
      scan_type: scanType,
      attributes: analysis.attributes || {},
      value_estimate: analysis.valueEstimate,
      confidence: analysis.confidence || 0.8,
      analysis_model: analysis.model || 'gpt-4o',
      ai_response_raw: analysis,
      processing_status: 'completed',
      retry_count: 0
    };
    
    const savedScan = await scansService.create(deviceId, scanData);
    
    console.log(`✅ Scan completed successfully: ${savedScan.id}`);
    
    // Return response with scan results
    res.status(201).json({
      success: true,
      scan: savedScan,
      analysis: analysis,
      message: `Successfully analyzed ${scanType} image`
    });

  } catch (error) {
    console.error('❌ Scan processing error:', error);
    
    // Clean up uploaded image if scan failed
    if (uploadedImage?.path) {
      try {
        await storageService.deleteImage(uploadedImage.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image:', cleanupError);
      }
    }
    
    // Re-throw error for global error handler
    throw error;
  }
});

/**
 * Get all scans for authenticated device
 * GET /api/scan
 */
const listScans = asyncHandler(async (req, res) => {
  const { deviceId } = req;
  const { 
    limit = 50, 
    offset = 0, 
    sortBy = 'created_at', 
    sortOrder = 'desc',
    scanType,
    minValue,
    maxValue 
  } = req.query;

  // Validate query parameters
  const limitNum = Math.min(parseInt(limit) || 50, 100); // Cap at 100
  const offsetNum = Math.max(parseInt(offset) || 0, 0);

  console.log(`📋 Fetching scans for device: ${deviceId} (limit: ${limitNum}, offset: ${offsetNum})`);

  try {
    // Get scans from database
    let scans = await scansService.getAll(deviceId, limitNum, offsetNum);
    
    // Apply additional filters if provided
    if (scanType) {
      scans = scans.filter(scan => scan.scan_type === scanType.toLowerCase());
    }
    
    if (minValue !== undefined) {
      const minVal = parseFloat(minValue);
      scans = scans.filter(scan => scan.value_estimate >= minVal);
    }
    
    if (maxValue !== undefined) {
      const maxVal = parseFloat(maxValue);
      scans = scans.filter(scan => scan.value_estimate <= maxVal);
    }

    // Calculate total value
    const totalValue = scans.reduce((sum, scan) => sum + (scan.value_estimate || 0), 0);
    
    // Get scan count for pagination
    const totalCount = scans.length; // This is simplified - in production, count separately
    
    res.json({
      success: true,
      scans,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalCount,
        hasNext: totalCount === limitNum // Simplified check
      },
      summary: {
        totalScans: scans.length,
        totalValue: totalValue,
        averageValue: scans.length > 0 ? totalValue / scans.length : 0,
        scanTypes: [...new Set(scans.map(scan => scan.scan_type))]
      }
    });

  } catch (error) {
    console.error('❌ Error fetching scans:', error);
    throw error;
  }
});

/**
 * Get single scan by ID
 * GET /api/scan/:id
 */
const getScanById = asyncHandler(async (req, res) => {
  const { deviceId } = req;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Scan ID required',
      message: 'Please provide a valid scan ID'
    });
  }

  console.log(`🔍 Fetching scan ${id} for device: ${deviceId}`);

  try {
    const scan = await scansService.getById(deviceId, id);
    
    if (!scan) {
      return res.status(404).json({
        error: 'Scan not found',
        message: 'The requested scan could not be found'
      });
    }

    res.json({
      success: true,
      scan
    });

  } catch (error) {
    console.error('❌ Error fetching scan:', error);
    throw error;
  }
});

/**
 * Update scan information
 * PUT /api/scan/:id
 */
const updateScan = asyncHandler(async (req, res) => {
  const { deviceId } = req;
  const { id } = req.params;
  const { notes, tags, customAttributes } = req.body;

  if (!id) {
    return res.status(400).json({
      error: 'Scan ID required',
      message: 'Please provide a valid scan ID'
    });
  }

  console.log(`📝 Updating scan ${id} for device: ${deviceId}`);

  try {
    // Prepare update data (only allow certain fields to be updated)
    const updateData = {};
    
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (customAttributes !== undefined) updateData.custom_attributes = customAttributes;

    const updatedScan = await scansService.update(deviceId, id, updateData);

    res.json({
      success: true,
      scan: updatedScan,
      message: 'Scan updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating scan:', error);
    throw error;
  }
});

/**
 * Delete scan
 * DELETE /api/scan/:id
 */
const deleteScan = asyncHandler(async (req, res) => {
  const { deviceId } = req;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Scan ID required',
      message: 'Please provide a valid scan ID'
    });
  }

  console.log(`🗑️ Deleting scan ${id} for device: ${deviceId}`);

  try {
    // Get scan details first to clean up image
    const scan = await scansService.getById(deviceId, id);
    
    if (!scan) {
      return res.status(404).json({
        error: 'Scan not found',
        message: 'The requested scan could not be found'
      });
    }

    // Delete from database
    await scansService.delete(deviceId, id);
    
    // Clean up image from storage if it exists
    if (scan.image_path) {
      try {
        await storageService.deleteImage(scan.image_path);
        console.log(`🧹 Cleaned up image: ${scan.image_path}`);
      } catch (cleanupError) {
        console.warn('Failed to cleanup image:', cleanupError.message);
        // Don't fail the request if image cleanup fails
      }
    }

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting scan:', error);
    throw error;
  }
});

/**
 * Get scan statistics
 * GET /api/scan/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const { deviceId } = req;

  console.log(`📊 Fetching stats for device: ${deviceId}`);

  try {
    // Get all scans for stats calculation
    const scans = await scansService.getAll(deviceId, 1000, 0); // Get more for accurate stats
    
    // Calculate statistics
    const stats = {
      totalScans: scans.length,
      totalValue: scans.reduce((sum, scan) => sum + (scan.value_estimate || 0), 0),
      averageValue: 0,
      scanTypes: {},
      valueRanges: {
        under10: 0,
        between10and100: 0,
        between100and1000: 0,
        over1000: 0
      },
      recentScans: scans.slice(0, 5), // Last 5 scans
      topValueScans: scans
        .sort((a, b) => (b.value_estimate || 0) - (a.value_estimate || 0))
        .slice(0, 5)
    };

    // Calculate average
    if (stats.totalScans > 0) {
      stats.averageValue = stats.totalValue / stats.totalScans;
    }

    // Count scan types
    scans.forEach(scan => {
      const type = scan.scan_type || 'unknown';
      stats.scanTypes[type] = (stats.scanTypes[type] || 0) + 1;
    });

    // Count value ranges
    scans.forEach(scan => {
      const value = scan.value_estimate || 0;
      if (value < 10) stats.valueRanges.under10++;
      else if (value < 100) stats.valueRanges.between10and100++;
      else if (value < 1000) stats.valueRanges.between100and1000++;
      else stats.valueRanges.over1000++;
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
});

module.exports = {
  handleScan,
  listScans,
  getScanById,
  updateScan,
  deleteScan,
  getStats
}; 