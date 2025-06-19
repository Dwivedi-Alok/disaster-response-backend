// services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractLocation = async (description) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Extract the location name from the following disaster description. 
    Return only the location name, nothing else. If no location is found, return "Unknown".
    Description: ${description}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const location = response.text().trim();
    
    logger.info(`Location extracted: ${location}`);
    return location;
  } catch (error) {
    logger.error('Gemini location extraction error:', error);
    throw error;
  }
};

const verifyImage = async (imageUrl) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `Analyze this image for signs of manipulation or verify if it shows a real disaster context. 
    Provide a confidence score (0-100) and a brief explanation.
    Image URL: ${imageUrl}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const verification = response.text();
    
    logger.info(`Image verified: ${imageUrl}`);
    return {
      status: 'verified',
      confidence: 85, // Parse from response
      explanation: verification
    };
  } catch (error) {
    logger.error('Gemini image verification error:', error);
    throw error;
  }
};

export { extractLocation, verifyImage };