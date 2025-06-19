import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../utils/websocket.js';
import { geocodeLocation } from '../services/geocodingService.js'; // Changed from '../utils/geocoding.js'

export const getNearbyResources = async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { lat, lon, radius = 10 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    // Geospatial query using PostGIS functions
    const { data, error } = await supabase.rpc('get_nearby_resources', {
      disaster_id: disasterId,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      radius_km: parseFloat(radius)
    });
    
    if (error) throw error;
    
    // Emit real-time update
    getIO().emit('resources_updated', {
      disasterId,
      resources: data
    });
    
    logger.info(`Resources mapped: ${data.length} resources found near ${lat}, ${lon}`);
    res.json(data);
  } catch (error) {
    logger.error('Get nearby resources error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createResource = async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { name, location_name, type } = req.body;
    
    // Geocode location
    const coordinates = await geocodeLocation(location_name);
    
    const { data, error } = await supabase
      .from('resources')
      .insert({
        disaster_id: disasterId,
        name,
        location_name,
        location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
        type
      })
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Resource created: ${data.name} at ${location_name}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Create resource error:', error);
    res.status(500).json({ error: error.message });
  }
};