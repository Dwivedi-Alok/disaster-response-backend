import { extractLocation } from '../services/geminiService.js';
import { geocodeLocation } from '../services/geocodingService.js';
import { logger } from '../utils/logger.js';

export const geocodeFromDescription = async (req, res) => {
  try {
    const { description, location_name } = req.body;
    
    let locationToGeocode = location_name;
    
    // Extract location from description if not provided
    if (!location_name && description) {
      locationToGeocode = await extractLocation(description);
    }
    
    if (!locationToGeocode || locationToGeocode === 'Unknown') {
      return res.status(400).json({ error: 'No location to geocode' });
    }
    
    // Geocode the location
    const coordinates = await geocodeLocation(locationToGeocode);
    
    if (!coordinates) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    logger.info(`Geocoded location: ${locationToGeocode} -> ${coordinates.lat}, ${coordinates.lng}`);
    
    res.json({
      location_name: locationToGeocode,
      coordinates,
      display_name: coordinates.display_name
    });
  } catch (error) {
    logger.error('Geocoding error:', error);
    res.status(500).json({ error: error.message });
  }
};