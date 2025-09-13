// Test script for the filter system
import { validateAwsConfig, getAwsConfigDebug } from './utils/aws.js';

console.log('🧪 Testing Filter System...\n');

// Test configuration validation
console.log('1. Testing AWS Configuration:');
const configValidation = validateAwsConfig();
console.log('   Valid:', configValidation.isValid);
if (!configValidation.isValid) {
  console.log('   Errors:', configValidation.errors);
}

// Test debug information
console.log('\n2. Configuration Debug Info:');
const debugInfo = getAwsConfigDebug();
console.log('   Region:', debugInfo.region);
console.log('   S3 Bucket:', debugInfo.s3Bucket);
console.log('   DynamoDB Table:', debugInfo.dynamodbTable);
console.log('   Presign URL:', debugInfo.presignUrl);
console.log('   Has Credentials:', debugInfo.hasCredentials);
console.log('   Is Configured:', debugInfo.isConfigured);

// Test API endpoints
console.log('\n3. Testing API Endpoints:');
const endpoints = [
  'http://localhost:4000/',
  'http://localhost:4000/health',
  'http://localhost:4000/presigned-url'
];

endpoints.forEach(async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`   ${endpoint}: Error - ${error.message}`);
  }
});

console.log('\n✅ Filter system test completed!');
console.log('\nTo start the server, run: npm start');
console.log('To test the Lambda function, run: cd checkDuplicate && node test.js');
