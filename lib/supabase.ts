import { createClient } from '@supabase/supabase-js'


// We only use the service role key server-side
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!


export const supa = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
})


export type Reminder = {
    id: string
    guild_id: string
    channel_id: string
    user_id: string
    message: string
    timezone: string
    schedule_kind: 'none' | 'daily' | 'weekly' | 'monthly' | 'first_friday' | 'cron'
    cron: string | null
    rrule: string | null
    next_run_at: string
    active: boolean
    created_at: string
}
