// controllers/disasterController.js
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../utils/websocket.js';
import { extractLocation } from '../services/geminiService.js';
import { geocodeLocation } from '../services/geocodingService.js';

const createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags } = req.body;
    const userId = req.user.id;
    
    // Extract location if not provided
    let finalLocationName = location_name;
    if (!location_name && description) {
      finalLocationName = await extractLocation(description);
    }
    
    // Geocode location
    const coordinates = await geocodeLocation(finalLocationName);
    
    // Create disaster record
    const { data, error } = await supabase
      .from('disasters')
      .insert({
        title,
        location_name: finalLocationName,
        location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
        description,
        tags,
        owner_id: userId,
        audit_trail: [{
          action: 'create',
          user_id: userId,
          timestamp: new Date().toISOString()
        }]
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    getIO().emit('disaster_updated', { action: 'create', disaster: data });
    
    logger.info(`Disaster created: ${data.id} by ${userId}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Create disaster error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getDisasters = async (req, res) => {
  try {
    const { tag, lat, lon, radius = 10 } = req.query;
    
    let query = supabase.from('disasters').select('*');
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (lat && lon) {
      // Geospatial query
      const { data, error } = await supabase.rpc('get_nearby_disasters', {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius_km: parseFloat(radius)
      });
      
      if (error) throw error;
      return res.json(data);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Get disasters error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    
    // Get current disaster
    const { data: current } = await supabase
      .from('disasters')
      .select('audit_trail')
      .eq('id', id)
      .single();
    
    // Update with audit trail
    const { data, error } = await supabase
      .from('disasters')
      .update({
        ...updates,
        audit_trail: [
          ...current.audit_trail,
          {
            action: 'update',
            user_id: userId,
            timestamp: new Date().toISOString(),
            changes: updates
          }
        ]
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    getIO().emit('disaster_updated', { action: 'update', disaster: data });
    
    logger.info(`Disaster updated: ${id} by ${userId}`);
    res.json(data);
  } catch (error) {
    logger.error('Update disaster error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);
    
    if (error) throw error;
    
    // Emit real-time update
    getIO().emit('disaster_updated', { action: 'delete', disasterId: id });
    
    logger.info(`Disaster deleted: ${id} by ${userId}`);
    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    logger.error('Delete disaster error:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster
};