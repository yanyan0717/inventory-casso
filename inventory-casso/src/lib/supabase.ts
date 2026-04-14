import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rdcvhakfsiftkgqvtxmu.supabase.co'
const supabaseAnonKey = 'sb_publishable_31515Z0qZI2IX6mq56HVMA_8XwaNYyn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)