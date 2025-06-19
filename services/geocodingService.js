// services/geocodingService.js
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

// Inline cache setter to avoid circular dependency
const setCacheLocal = async (key, value, ttlMinutes = 60) => {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  
  try {
    await supabase
      .from('cache')
      .upsert({
        key,
        value,
        expires_at: expiresAt
      });
    logger.info(`Cache set: ${key}`);
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

// Using OpenStreetMap Nominatim as default
const geocodeLocation = async (locationName) => {
  try {
    const cacheKey = `geocode:${locationName}`;
    
    // Check cache first
    const { data: cached } = await supabase
      .from('cache')
      .select('value')
      .eq('key', cacheKey)
      .single();
    
    if (cached) {
      return cached.value;
    }
    
    // Geocode using Nominatim
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'DisasterResponsePlatform/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
      
      // Cache the result
      await setCacheLocal(cacheKey, result, 1440); // 24 hours cache
      
      logger.info(`Geocoded location: ${locationName} -> ${result.lat}, ${result.lng}`);
      return result;
    }
    
    return null;
  } catch (error) {
    logger.error('Geocoding error:', error);
    return null;
  }
};

// Alternative: Google Maps Geocoding (if API key is available)
const geocodeLocationGoogle = async (locationName) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return geocodeLocation(locationName); // Fallback to Nominatim
  }
  
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: locationName,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        display_name: response.data.results[0].formatted_address
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Google geocoding error:', error);
    return geocodeLocation(locationName); // Fallback to Nominatim
  }
};

export { geocodeLocation, geocodeLocationGoogle };