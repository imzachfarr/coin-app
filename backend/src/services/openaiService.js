const { OpenAI } = require('openai');

// Helper to construct a client on demand (supports runtime override)
function getOpenAIClient(apiKey) {
  const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
  if (!effectiveKey) {
    throw new Error('OPENAI_API_KEY is not configured. Set env or provide override apiKey.');
  }
  return new OpenAI({ apiKey: effectiveKey, timeout: 60000 });
}

// Scan type configurations with specific prompts and schemas
const SCAN_CONFIGS = {
  coin: {
    prompt: `You are a world-class professional numismatist with 50+ years of experience. Analyze this coin image with EXTREME attention to detail, examining every pixel for the slightest details that could affect value.

    CRITICAL ANALYSIS REQUIREMENTS - Examine EVERY detail:
    
    1. MINT MARKS: Look for tiny letters (S, D, P, O, CC, etc.) - these can multiply value by 1000x
    2. DATE ANALYSIS: Check for doubled dies, repunched dates, overdates - these are extremely valuable
    3. CONDITION GRADING: Examine every surface for:
       - Wear patterns (high points vs low points)
       - Luster quality (original vs cleaned)
       - Strike quality (weak vs strong)
       - Surface marks, scratches, or damage
       - Edge condition and reeding
    4. ERROR COINS: Look for:
       - Double strikes
       - Off-center strikes
       - Clipped planchets
       - Die cracks or breaks
       - Wrong metal composition
    5. VARIETIES: Check for:
       - Different die varieties
       - Design variations
       - Letter spacing differences
       - Size variations
    
    MARKET VALUE ANALYSIS:
    - A common circulated quarter = $0.25 (face value)
    - A 1909-S VDB penny = $500+ (rare mint mark + initials)
    - A 1933 Double Eagle = $7+ million (extremely rare)
    - A 1955 doubled die penny = $1,000+ (error coin)
    - A 1916-D Mercury dime = $1,000+ (rare mint mark)
    - A 1943 copper penny = $100,000+ (wrong metal)
    
    EXAMINE FOR:
    - Country/region of origin
    - Exact denomination and currency
    - Precise year and mint mark
    - Detailed condition/grade (Poor, Fair, Good, Very Good, Fine, Very Fine, Extremely Fine, About Uncirculated, Uncirculated, MS-60 to MS-70)
    - Material composition (copper, silver, gold, nickel, etc.)
    - Mint marks (S, D, P, O, CC, etc.) - CRITICAL for value
    - Error coins or varieties
    - Historical significance
    - Rarity factors
    - Current MARKET VALUE in USD (NOT face value)
    
    CRITICAL: The valueEstimate must be the TRUE MARKET VALUE that collectors would pay. Common coins may equal face value, but rare coins can be worth thousands or millions more than face value.
    
    If the image is unclear or doesn't show a coin, respond with a low confidence score and estimated value of 0.
    
    Respond ONLY with valid JSON matching this exact schema:`,
    
    schema: {
      type: "object",
      required: ["valueEstimate", "attributes"],
      properties: {
        valueEstimate: {
          type: "number",
          description: "Estimated market value in USD"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence level of identification (0-1)"
        },
        attributes: {
          type: "object",
          properties: {
            country: { type: "string" },
            denomination: { type: "string" },
            year: { type: "string" },
            condition: { type: "string" },
            material: { type: "string" },
            mintMark: { type: "string" },
            series: { type: "string" },
            description: { type: "string" }
          }
        }
      }
    }
  },
  
  card: {
    prompt: `You are a professional trading card expert. Analyze this trading card image and provide detailed information.
    
    Focus on identifying:
    - Card game/sport (Pokemon, Magic, Baseball, etc.)
    - Card name and set
    - Rarity level
    - Condition/grade
    - Year or edition
    - Special features (holographic, first edition, etc.)
    - Current MARKET VALUE estimate in USD (what collectors would pay)
    
    CRITICAL: The valueEstimate should be the MARKET VALUE (what collectors would pay), NOT any face value or retail price. For example:
    - A Charizard card might have a market value of $1000+ depending on condition
    - A common card might have a market value of $1-5
    - A first edition holographic might have a market value of $5000+
    
    Respond ONLY with valid JSON matching this exact schema:`,
    
    schema: {
      type: "object",
      required: ["valueEstimate", "attributes"],
      properties: {
        valueEstimate: { type: "number" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        attributes: {
          type: "object",
          properties: {
            game: { type: "string" },
            name: { type: "string" },
            set: { type: "string" },
            rarity: { type: "string" },
            condition: { type: "string" },
            year: { type: "string" },
            features: { type: "string" },
            cardNumber: { type: "string" },
            description: { type: "string" }
          }
        }
      }
    }
  },
  
  // Add more scan types as needed
  bird: {
    prompt: `You are an ornithologist (bird expert). Analyze this bird image and provide detailed information.
    
    Focus on identifying:
    - Species name (common and scientific)
    - Physical characteristics
    - Habitat and range
    - Conservation status
    - Behavior notes
    - Rarity or collectible value if applicable
    
    Respond ONLY with valid JSON matching this exact schema:`,
    
    schema: {
      type: "object",
      required: ["valueEstimate", "attributes"],
      properties: {
        valueEstimate: { type: "number" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        attributes: {
          type: "object",
          properties: {
            commonName: { type: "string" },
            scientificName: { type: "string" },
            family: { type: "string" },
            habitat: { type: "string" },
            conservationStatus: { type: "string" },
            characteristics: { type: "string" },
            description: { type: "string" }
          }
        }
      }
    }
  }
};

/**
 * Analyze image using OpenAI Vision API
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} scanType - Type of scan (coin, card, bird, etc.)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeImage(imageUrl, scanType = 'coin', maxRetries = 3, overrides = {}) {
  const client = getOpenAIClient(overrides.apiKey);
  const config = SCAN_CONFIGS[scanType.toLowerCase()];
  
  if (!config) {
    throw new Error(`Unsupported scan type: ${scanType}. Supported types: ${Object.keys(SCAN_CONFIGS).join(', ')}`);
  }

  // Allow runtime overrides from admin config (prompt and up to 4 features schema)
  const overridePrompt = overrides.main_prompt || overrides.prompt;
  const overrideFeatures = Array.isArray(overrides.features) ? overrides.features.slice(0, 4) : null;

  let schema = config.schema;
  if (overrideFeatures && overrideFeatures.length > 0) {
    // Build a schema with a generic attributes block comprised of admin-defined features
    const featureProps = {};
    overrideFeatures.forEach((f) => {
      if (f && f.key) {
        featureProps[f.key] = { type: f.type || 'string', description: f.description || f.label || f.key };
      }
    });
    schema = {
      type: 'object',
      required: ['valueEstimate', 'attributes'],
      properties: {
        valueEstimate: { type: 'number', description: 'Primary numeric score/value for the scanned item' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        attributes: { type: 'object', properties: featureProps }
      }
    };
  }

  const systemPrompt = `${overridePrompt || config.prompt}

${JSON.stringify(schema, null, 2)}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, no additional text.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Analyzing ${scanType} image (attempt ${attempt}/${maxRetries}): ${imageUrl}`);
      
      const response = await client.chat.completions.create({
        model: overrides.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
                      {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Please analyze this image of a ${scanType} with EXTREME attention to detail. Examine every pixel for mint marks, errors, varieties, condition details, and rarity factors. This is a legitimate numismatic analysis request for accurate market valuation.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
        ],
        max_tokens: 1200,
        temperature: typeof overrides.temperature === 'number' ? overrides.temperature : 0.1,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      // Clean and parse JSON response
      const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
      let parsedResult;
      
      // Check if OpenAI refused the request
      if (cleanedContent.toLowerCase().includes("i'm sorry") || 
          cleanedContent.toLowerCase().includes("i can't assist") ||
          cleanedContent.toLowerCase().includes("cannot analyze")) {
        throw new Error(`OpenAI refused to analyze image due to content policy. Please try a different image or ensure the image clearly shows a ${scanType}.`);
      }
      
      try {
        parsedResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}\nContent: ${cleanedContent}`);
      }

      // Validate required fields
      if (!parsedResult.valueEstimate && parsedResult.valueEstimate !== 0) {
        throw new Error('Missing required field: valueEstimate');
      }
      
      if (!parsedResult.attributes) {
        throw new Error('Missing required field: attributes');
      }

      // Ensure valueEstimate is a number
      if (typeof parsedResult.valueEstimate !== 'number') {
        parsedResult.valueEstimate = parseFloat(parsedResult.valueEstimate) || 0;
      }

      // Set confidence if not provided
      if (!parsedResult.confidence) {
        parsedResult.confidence = 0.8; // Default confidence
      }

      // Add metadata
      parsedResult.scanType = scanType;
      parsedResult.analyzedAt = new Date().toISOString();
      parsedResult.model = overrides.model || 'gpt-4o';

      console.log(`✅ Successfully analyzed ${scanType} image with confidence ${parsedResult.confidence}`);
      
      return parsedResult;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`OpenAI analysis failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: wait longer between retries
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Waiting ${delay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate image URL accessibility
 * @param {string} imageUrl - URL to validate
 * @returns {Promise<boolean>} Whether the image is accessible
 */
async function validateImageUrl(imageUrl) {
  try {
    // Basic URL validation
    new URL(imageUrl);
    
    // Check if URL ends with image extension or contains image-related domains
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageDomains = ['unsplash.com', 'images.unsplash.com', 'picsum.photos', 'via.placeholder.com'];
    
    const hasImageExtension = imageExtensions.some(ext => 
      imageUrl.toLowerCase().includes(ext)
    );
    
    const hasImageDomain = imageDomains.some(domain => 
      imageUrl.toLowerCase().includes(domain)
    );
    
    return hasImageExtension || hasImageDomain;
  } catch (error) {
    console.error('Invalid image URL:', error.message);
    return false;
  }
}

/**
 * Get supported scan types
 * @returns {Array<string>} List of supported scan types
 */
function getSupportedScanTypes() {
  return Object.keys(SCAN_CONFIGS);
}

/**
 * Health check for OpenAI service
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    // Simple test call to verify API key works
    const testResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    
    return { 
      healthy: true, 
      model: 'gpt-4o',
      supportedScanTypes: getSupportedScanTypes()
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message 
    };
  }
}

module.exports = {
  analyzeImage,
  validateImageUrl,
  getSupportedScanTypes,
  healthCheck,
  SCAN_CONFIGS
}; 