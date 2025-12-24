
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oejckhyycdritydsotgh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A5jeVbg8r-JM0Jlsm2DEbA_C2DQ8EFZ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
