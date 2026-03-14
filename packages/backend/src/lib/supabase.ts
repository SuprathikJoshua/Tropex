import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — for server-side operations
// Never expose this on the frontend
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
