
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqvfwnxfsswbggkzetre.supabase.co';
const supabaseAnonKey = 'sb_publishable_Pt9h_cYQn3138JBcpcWRVg_9X8UvBAP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
