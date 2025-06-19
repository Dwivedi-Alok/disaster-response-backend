// backend/services/blueskyService.js
import { BskyAgent } from '@atproto/api';
import { logger } from '../utils/logger.js';

class BlueskyService {
  constructor() {
    this.agent = new BskyAgent({ service: 'https://bsky.social' });
    this.isAuthenticated = false;
  }

  async authenticate() {
    if (this.isAuthenticated) return;
    
    try {
      await this.agent.login({
        identifier: process.env.BLUESKY_USERNAME,
        password: process.env.BLUESKY_APP_PASSWORD
      });
      this.isAuthenticated = true;
      logger.info('Bluesky authentication successful');
    } catch (error) {
      logger.error('Bluesky authentication failed:', error);
      throw error;
    }
  }

  async searchDisasterPosts(keywords = [], disasterId) {
    try {
      await this.authenticate();
      
      // Search for posts (Bluesky doesn't have direct search API yet, so we'll use timeline)
      const timeline = await this.agent.getTimeline({ limit: 100 });
      
      // Filter posts based on keywords
      const disasterPosts = timeline.data.feed
        .filter(item => {
          const text = item.post.record.text.toLowerCase();
          return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        })
        .map(item => ({
          id: item.post.uri,
          post: item.post.record.text,
          user: item.post.author.handle,
          timestamp: item.post.record.createdAt,
          type: this.categorizePost(item.post.record.text),
          platform: 'bluesky'
        }));
      
      logger.info(`Fetched ${disasterPosts.length} Bluesky posts for disaster: ${disasterId}`);
      return disasterPosts;
    } catch (error) {
      logger.error('Bluesky search error:', error);
      return [];
    }
  }

  categorizePost(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('need') || lowerText.includes('help')) return 'need';
    if (lowerText.includes('offer') || lowerText.includes('available')) return 'offer';
    if (lowerText.includes('urgent') || lowerText.includes('emergency')) return 'alert';
    return 'info';
  }

  async createPost(text) {
    try {
      await this.authenticate();
      
      const post = await this.agent.post({
        text: text,
        createdAt: new Date().toISOString()
      });
      
      logger.info('Created Bluesky post:', post.uri);
      return post;
    } catch (error) {
      logger.error('Bluesky post creation error:', error);
      throw error;
    }
  }
}

export default new BlueskyService();