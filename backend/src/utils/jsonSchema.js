const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * JSON Schemas for API validation
 */

// Scan request schema
const scanRequestSchema = {
  type: 'object',
  properties: {
    imageUri: {
      type: 'string',
      format: 'uri',
      description: 'External image URL'
    },
    imageBase64: {
      type: 'string',
      pattern: '^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$',
      description: 'Base64 encoded image data'
    },
    fileName: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Optional filename for the image'
    }
  },
  anyOf: [
    { required: ['imageUri'] },
    { required: ['imageBase64'] }
  ],
  additionalProperties: false
};

// Scan update schema
const scanUpdateSchema = {
  type: 'object',
  properties: {
    notes: {
      type: 'string',
      maxLength: 1000,
      description: 'User notes about the scan'
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 50
      },
      maxItems: 10,
      description: 'Tags for categorizing the scan'
    },
    customAttributes: {
      type: 'object',
      additionalProperties: {
        type: ['string', 'number', 'boolean']
      },
      description: 'Custom user-defined attributes'
    }
  },
  additionalProperties: false,
  minProperties: 1
};

// Purchase restore schema
const purchaseRestoreSchema = {
  type: 'object',
  properties: {
    receipt_data: {
      type: 'string',
      minLength: 1,
      description: 'Receipt data from App Store or Play Store'
    },
    product_ids: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['free_trial_7_day', 'monthly_2_99', 'yearly_39_99']
      },
      minItems: 1,
      description: 'Product IDs to restore'
    }
  },
  anyOf: [
    { required: ['receipt_data'] },
    { required: ['product_ids'] }
  ],
  additionalProperties: false
};

// RevenueCat webhook event schema
const revenueCatWebhookSchema = {
  type: 'object',
  required: ['event'],
  properties: {
    event: {
      type: 'object',
      required: ['type', 'app_user_id'],
      properties: {
        type: {
          type: 'string',
          enum: [
            'INITIAL_PURCHASE',
            'RENEWAL',
            'CANCELLATION',
            'EXPIRATION',
            'BILLING_ISSUE',
            'PRODUCT_CHANGE',
            'TRIAL_STARTED',
            'TRIAL_CANCELLED'
          ]
        },
        app_user_id: {
          type: 'string',
          minLength: 10,
          maxLength: 50,
          description: 'Device ID in our system'
        },
        product_id: {
          type: 'string',
          enum: ['free_trial_7_day', 'monthly_2_99', 'yearly_39_99']
        },
        purchased_at: {
          type: 'string',
          format: 'date-time'
        },
        expiration_at: {
          type: 'string',
          format: 'date-time'
        }
      },
      additionalProperties: true
    }
  },
  additionalProperties: true
};

// OpenAI analysis response schema (for validation)
const openAIAnalysisSchema = {
  type: 'object',
  required: ['valueEstimate', 'attributes'],
  properties: {
    valueEstimate: {
      type: 'number',
      minimum: 0,
      description: 'Estimated market value in USD'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence level of the analysis'
    },
    attributes: {
      type: 'object',
      minProperties: 1,
      description: 'Parsed attributes specific to scan type'
    },
    scanType: {
      type: 'string',
      enum: ['coin', 'card', 'bird', 'stamp', 'art', 'jewelry']
    },
    analyzedAt: {
      type: 'string',
      format: 'date-time'
    },
    model: {
      type: 'string',
      description: 'AI model used for analysis'
    }
  },
  additionalProperties: false
};

// Query parameters schema for scan listing
const scanListQuerySchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'string',
      pattern: '^[1-9][0-9]?$|^100$', // 1-100
      description: 'Number of results to return (1-100)'
    },
    offset: {
      type: 'string',
      pattern: '^[0-9]+$',
      description: 'Number of results to skip'
    },
    sortBy: {
      type: 'string',
      enum: ['created_at', 'value_estimate', 'confidence_score'],
      description: 'Field to sort by'
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      description: 'Sort order'
    },
    scanType: {
      type: 'string',
      enum: ['coin', 'card', 'bird', 'stamp', 'art', 'jewelry'],
      description: 'Filter by scan type'
    },
    minValue: {
      type: 'string',
      pattern: '^[0-9]+(\\.[0-9]+)?$',
      description: 'Minimum value filter'
    },
    maxValue: {
      type: 'string',
      pattern: '^[0-9]+(\\.[0-9]+)?$',
      description: 'Maximum value filter'
    }
  },
  additionalProperties: false
};

/**
 * Compile validators
 */
const validators = {
  scanRequest: ajv.compile(scanRequestSchema),
  scanUpdate: ajv.compile(scanUpdateSchema),
  purchaseRestore: ajv.compile(purchaseRestoreSchema),
  revenueCatWebhook: ajv.compile(revenueCatWebhookSchema),
  openAIAnalysis: ajv.compile(openAIAnalysisSchema),
  scanListQuery: ajv.compile(scanListQuerySchema)
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @param {string} target - What to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
function validateSchema(schemaName, target = 'body') {
  return (req, res, next) => {
    const validator = validators[schemaName];
    
    if (!validator) {
      console.error(`❌ Unknown schema: ${schemaName}`);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Schema validation configuration error'
      });
    }

    const dataToValidate = req[target];
    const isValid = validator(dataToValidate);

    if (!isValid) {
      const errors = validator.errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      }));

      console.log(`❌ Validation failed for ${schemaName}:`, errors);

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request data does not match required format',
        details: errors
      });
    }

    next();
  };
}

/**
 * Validate data against schema (non-middleware version)
 * @param {string} schemaName - Name of the schema
 * @param {any} data - Data to validate
 * @returns {Object} { valid: boolean, errors?: Array }
 */
function validate(schemaName, data) {
  const validator = validators[schemaName];
  
  if (!validator) {
    return {
      valid: false,
      errors: [{ message: `Unknown schema: ${schemaName}` }]
    };
  }

  const isValid = validator(data);
  
  return {
    valid: isValid,
    errors: isValid ? [] : validator.errors
  };
}

/**
 * Clean and format validation errors for API response
 * @param {Array} errors - AJV validation errors
 * @returns {Array} Formatted error messages
 */
function formatValidationErrors(errors) {
  return errors.map(error => {
    let field = error.instancePath?.replace('/', '') || 'root';
    if (field === 'root' && error.schemaPath) {
      field = error.schemaPath.split('/').pop();
    }

    return {
      field,
      message: error.message,
      value: error.data,
      allowedValues: error.schema?.enum || undefined
    };
  });
}

/**
 * Device ID validation
 * @param {string} deviceId - Device ID to validate
 * @returns {boolean} Whether device ID is valid
 */
function isValidDeviceId(deviceId) {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  
  // Device ID should be 10-50 characters, alphanumeric with dashes/underscores
  const deviceIdRegex = /^[a-zA-Z0-9\-_]{10,50}$/;
  return deviceIdRegex.test(deviceId);
}

/**
 * Scan type validation
 * @param {string} scanType - Scan type to validate
 * @returns {boolean} Whether scan type is valid
 */
function isValidScanType(scanType) {
  const validScanTypes = ['coin', 'card', 'bird', 'stamp', 'art', 'jewelry'];
  return validScanTypes.includes(scanType?.toLowerCase());
}

module.exports = {
  schemas: {
    scanRequestSchema,
    scanUpdateSchema,
    purchaseRestoreSchema,
    revenueCatWebhookSchema,
    openAIAnalysisSchema,
    scanListQuerySchema
  },
  validators,
  validateSchema,
  validate,
  formatValidationErrors,
  isValidDeviceId,
  isValidScanType
}; 