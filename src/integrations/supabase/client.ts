// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/db_types'; // Path to your regenerated Supabase types

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'cache-control': 'no-cache', // Force bypass of schema cache
    },
  },
});
