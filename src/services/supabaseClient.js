import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aovnhhiyvkbpenoeqayd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IZeJE5pp6eDy3W-VfBpaBg_BJhCGL_y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check connectivity to Supabase
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('events').select('*').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
