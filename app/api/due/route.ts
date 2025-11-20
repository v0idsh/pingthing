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
    const siteUrl = process.env.SITE_URL || req.nextUrl?.origin || `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
    const dueUrl = `${siteUrl.replace(/\/$/, '')}/api/due`
    await scheduleAt(dueUrl, nextISO, { reminderId: r.id })


    return NextResponse.json({ ok: true })
}
export const runtime = 'nodejs'
