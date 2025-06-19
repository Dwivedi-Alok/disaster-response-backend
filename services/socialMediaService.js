// services/socialMediaService.js
// backend/services/socialMediaService.js (updated version)
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { setCache } from '../middleware/cache.js';
import { getIO } from '../utils/websocket.js';
import blueskyService from './blueskyService.js';

// Mock data for testing
// ... other mock data

// Rest of the file remains the same...
// Mock Twitter API data
const mockSocialMediaData = [
  {
    id: '1',
    post: '#floodrelief Need food and water in Manhattan, NYC',
    user: 'citizen1',
    timestamp: new Date().toISOString(),
    type: 'need',
    location: 'Manhattan, NYC',
    platform: 'mock'
  },
  {
    id: '2',
    post: 'We have emergency supplies available at Red Cross center #earthquake',
    user: 'reliefOrg',
    timestamp: new Date().toISOString(),
    type: 'offer',
    location: 'Brooklyn, NYC'
  },
  {
    id: '3',
    post: 'URGENT: Building collapse on 5th Avenue, people trapped #emergency',
    user: 'firstResponder',
    timestamp: new Date().toISOString(),
    type: 'alert',
    location: '5th Avenue, NYC',
    priority: 'high'
  }
];

const fetchSocialMediaReports = async (disasterId, keywords = []) => {
  try {
    const cacheKey = `social:${disasterId}:${keywords.join(',')}`;
    const allReports = [];
    
    // 1. Try Bluesky
    if (process.env.BLUESKY_USERNAME && process.env.BLUESKY_APP_PASSWORD) {
      try {
        const blueskyPosts = await blueskyService.searchDisasterPosts(
          keywords.length > 0 ? keywords : ['flood', 'earthquake', 'emergency', 'disaster'],
          disasterId
        );
        allReports.push(...blueskyPosts);
      } catch (error) {
        logger.warn('Bluesky fetch failed, continuing with other sources:', error.message);
      }
    }
    
    // 2. Try Twitter (if available)
    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        const twitterPosts = await fetchTwitterReports(keywords);
        allReports.push(...twitterPosts);
      } catch (error) {
        logger.warn('Twitter fetch failed, continuing with other sources:', error.message);
      }
    }
    
    // 3. Add mock data if no real data
    if (allReports.length === 0) {
      const filteredMock = mockSocialMediaData.filter(post => 
        keywords.length === 0 || keywords.some(keyword => 
          post.post.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      allReports.push(...filteredMock);
    }
    
    // Cache the results
    await setCache(cacheKey, allReports, 5);
    
    // Emit real-time update
    getIO().emit('social_media_updated', {
      disasterId,
      reports: allReports
    });
    
    logger.info(`Social media reports fetched: ${allReports.length} total (${disasterId})`);
    return allReports;
  } catch (error) {
    logger.error('Social media fetch error:', error);
    return mockSocialMediaData;
  }
};

// Real Twitter API integration (if available)
const fetchTwitterReports = async (keywords) => {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    return fetchSocialMediaReports('mock', keywords);
  }
  
  try {
    const response = await axios.get(
      'https://api.twitter.com/2/tweets/search/recent',
      {
        params: {
          query: keywords.join(' OR '),
          max_results: 100,
          'tweet.fields': 'created_at,author_id,geo'
        },
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    logger.error('Twitter API error:', error);
    return fetchSocialMediaReports('mock', keywords);
  }
};

// Priority alert detection
const detectPriorityAlerts = (reports) => {
  const priorityKeywords = ['urgent', 'sos', 'emergency', 'critical', 'help'];
  
  return reports.map(report => {
    const isPriority = priorityKeywords.some(keyword => 
      report.post.toLowerCase().includes(keyword)
    );
    
    return {
      ...report,
      priority: isPriority ? 'high' : 'normal'
    };
  });
};

export {
  fetchSocialMediaReports,
  fetchTwitterReports,
  detectPriorityAlerts
};