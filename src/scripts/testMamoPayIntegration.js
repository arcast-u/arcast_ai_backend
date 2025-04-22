import dotenv from 'dotenv';
import { createMamoClient } from '../utils/payment.utils.js';
import { MAMO_ENDPOINTS } from '../config/mamo.config.js';

// Load environment variables
dotenv.config();

/**
 * Test MamoPay API connection and configuration
 */
async function testMamoIntegration() {
  try {
    console.log('🔍 Testing MamoPay integration...');
    
    // Create MamoPay client
    const client = createMamoClient();
    
    // Test API connection by fetching business details
    console.log('✨ Fetching business details from MamoPay...');
    const response = await client.get(MAMO_ENDPOINTS.BUSINESS);
    
    if (response.status === 200) {
      console.log('✅ Successfully connected to MamoPay API!');
      console.log('📋 Business details:');
      console.log(`   Name: ${response.data.name}`);
      console.log(`   Email: ${response.data.email}`);
      console.log(`   Status: ${response.data.status}`);
    } else {
      console.log('❌ Failed to connect to MamoPay API');
      console.log('Response:', response.status, response.statusText);
    }
    
    // Test creating a payment link
    console.log('\n✨ Testing payment link creation...');
    
    const paymentLinkPayload = {
      title: 'Test Payment',
      description: 'This is a test payment link',
      amount: 1, // Minimal amount for testing
      amount_currency: 'AED',
      return_url: process.env.MAMO_RETURN_URL || 'https://arcast.ai/booking/confirmation',
      enable_customer_details: true
    };
    
    const paymentLinkResponse = await client.post(MAMO_ENDPOINTS.PAYMENT_LINKS, paymentLinkPayload);
    
    if (paymentLinkResponse.status === 200) {
      console.log('✅ Successfully created a test payment link!');
      console.log('📋 Payment link details:');
      console.log(`   ID: ${paymentLinkResponse.data.id}`);
      console.log(`   URL: ${paymentLinkResponse.data.payment_url}`);
      console.log(`   Amount: ${paymentLinkResponse.data.amount} ${paymentLinkResponse.data.amount_currency}`);
    } else {
      console.log('❌ Failed to create a test payment link');
      console.log('Response:', paymentLinkResponse.status, paymentLinkResponse.statusText);
    }
    
    console.log('\n🎉 MamoPay integration test completed!');
    console.log('🔗 Documentation: https://mamopay.readme.io/reference/getting-started-2');
    
  } catch (error) {
    console.error('❌ MamoPay integration test failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data)}`);
      
      // Handle common error cases
      if (error.response.status === 401) {
        console.error('\n⚠️  Authentication failed. Check your MAMO_API_KEY in .env file.');
        console.error('   Make sure you are using the right key for the environment (sandbox/production).');
      } else if (error.response.status === 403) {
        console.error('\n⚠️  Permission denied. Your API key may not have the required permissions.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('   No response received from MamoPay API. Check your internet connection.');
      console.error('   Also verify that MAMO_ENVIRONMENT in .env is set correctly (sandbox/production).');
    } else {
      // Something happened in setting up the request
      console.error(`   Error message: ${error.message}`);
    }
    
    // Detailed suggestions for fixing the issue
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Verify your MAMO_API_KEY is correct');
    console.error('2. Confirm MAMO_ENVIRONMENT is set to "sandbox" for testing');
    console.error('3. Ensure all required environment variables are set in .env');
    console.error('4. Check that you have the necessary packages installed (axios)');
  }
}

// Run the test
testMamoIntegration(); 