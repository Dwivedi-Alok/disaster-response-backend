// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create disasters table
    await supabase.rpc('create_disasters_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS disasters (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          location_name TEXT,
          location GEOGRAPHY(POINT),
          description TEXT,
          tags TEXT[],
          owner_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          audit_trail JSONB DEFAULT '[]'::jsonb
        );
        CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
        CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
        CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters (owner_id);
      `
    });

    // Create reports table
    await supabase.rpc('create_reports_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
          user_id VARCHAR(255),
          content TEXT,
          image_url TEXT,
          verification_status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create resources table
    await supabase.rpc('create_resources_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS resources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
          name VARCHAR(255),
          location_name TEXT,
          location GEOGRAPHY(POINT),
          type VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);
      `
    });

    // Create cache table
    await supabase.rpc('create_cache_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS cache (
          key VARCHAR(255) PRIMARY KEY,
          value JSONB,
          expires_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX IF NOT EXISTS cache_expires_idx ON cache (expires_at);
      `
    });

  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Run initialization
initializeDatabase();