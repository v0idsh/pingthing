import { NextRequest, NextResponse } from 'next/server'
import { supa } from '@/lib/supabase'
import { postChannelMessage } from '@/lib/discord'
import { computeNextRun } from '@/lib/schedule'
import { scheduleAt } from '@/lib/qstash'


export async function POST(req: NextRequest) {
    const { reminderId } = await req.json()
    const { data: r } = await supa.from('reminders').select('*').eq('id', reminderId).single()
    if (!r || !r.active) return NextResponse.json({ ok: true })


    await postChannelMessage(r.channel_id, r.message)


    // compute and schedule next
    const next = computeNextRun({
        start: new Date(r.next_run_at),
        timezone: r.timezone,
        kind: r.schedule_kind as 'none' | 'daily' | 'weekly' | 'monthly' | 'cron',
        cron: r.cron ?? undefined
    })
    const nextISO = next.toISOString()
    await supa.from('reminders').update({ next_run_at: nextISO }).eq('id', r.id)
    await scheduleAt(`${req.nextUrl.origin}/api/due`, nextISO, { reminderId: r.id })


    return NextResponse.json({ ok: true })
}
