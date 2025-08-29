/**
 * Schema validation script
 * Validates all JSON-LD schemas against Schema.org standards
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize validator
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Schema.org basic validation schema
const schemaOrgValidation = {
  type: 'object',
  required: ['@context'],
  properties: {
    '@context': {
      oneOf: [
        { const: 'https://schema.org' },
        { const: 'http://schema.org' }
      ]
    },
    '@type': { type: 'string' },
    '@graph': { type: 'array' }
  }
};

const validate = ajv.compile(schemaOrgValidation);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

// Validate all schemas
function validateSchemas() {
  const schemasDir = path.join(__dirname, 'schemas');
  const files = fs.readdirSync(schemasDir).filter(file => file.endsWith('.json'));
  
  let hasErrors = false;
  
  console.log('🔍 Validating Schema Files...\n');
  
  files.forEach(file => {
    const filePath = path.join(schemasDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
      const schema = JSON.parse(content);
      const valid = validate(schema);
      
      if (valid) {
        console.log(`${colors.green}✓${colors.reset} ${file}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${file}`);
        console.log(`  ${colors.yellow}${validate.errors.map(e => e.message).join(', ')}${colors.reset}`);
        hasErrors = true;
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${file}`);
      console.log(`  ${colors.yellow}Invalid JSON: ${error.message}${colors.reset}`);
      hasErrors = true;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log(`${colors.red}Validation failed!${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}All schemas are valid!${colors.reset}`);
  }
}

// Run validation
validateSchemas();