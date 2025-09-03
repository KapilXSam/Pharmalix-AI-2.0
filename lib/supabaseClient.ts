import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = 'https://welneiigymeieljclpxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbG5laWlneW1laWVsamNscHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzE4NTQsImV4cCI6MjA3MDk0Nzg1NH0.fw5GIPDby5ylIQc4_kTwA12d8pnq9VWCwMxtQ7Fdy5M';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);