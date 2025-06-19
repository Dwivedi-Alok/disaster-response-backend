import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';

dotenv.config();

const agent = new BskyAgent({ service: 'https://bsky.social' });

async function testBluesky() {
  try {
    console.log('Testing Bluesky integration...');
    
    // Debug: Check if environment variables are loaded
    console.log('Username:', process.env.BLUESKY_USERNAME);
    console.log('Password exists:', !!process.env.BLUESKY_APP_PASSWORD);
    
    // Make sure the variables exist
    if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_APP_PASSWORD) {
      throw new Error('Missing required environment variables: BLUESKY_USERNAME or BLUESKY_APP_PASSWORD');
    }
    
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME,
      password: process.env.BLUESKY_APP_PASSWORD
    });

    const profile = await agent.getProfile({ actor: process.env.BLUESKY_USERNAME });
    console.log('✅ Success:', profile);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBluesky();