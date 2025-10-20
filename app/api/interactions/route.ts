import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscordRequest } from '@/lib/discord'
import { supa } from '@/lib/supabase'
import { scheduleAt } from '@/lib/qstash'

type DiscordOption = {
    name: string
    value: string | number
}

type DiscordData = {
    name: string
    options?: Array<{
        name: string
        options?: DiscordOption[]
    }>
}

type DiscordInteraction = {
    type: number
    guild_id?: string
    member?: {
        user?: {
            id: string
        }
    }
    data?: DiscordData
}


export const runtime = 'edge'


async function readBody(req: NextRequest) {
    const arrayBuffer = await req.arrayBuffer()
    return Buffer.from(arrayBuffer)
}


export async function POST(req: NextRequest) {
    try {
        const raw = await readBody(req)
        const body: DiscordInteraction = JSON.parse(raw.toString())

        // PING - Discord verification request (no signature verification needed)
        if (body.type === 1) {
            console.log('Discord PING received, responding with type 1')
            return NextResponse.json({ type: 1 })
        }

        // For all other requests, verify signature
        const sig = req.headers.get('x-signature-ed25519') || ''
        const ts = req.headers.get('x-signature-timestamp') || ''
        console.log('Verifying signature:', { sig: sig.substring(0, 10) + '...', ts, bodyType: body.type })
        const ok = verifyDiscordRequest(raw, sig, ts)
        console.log('Signature verification result:', ok)
        if (!ok) return new NextResponse('bad signature', { status: 401 })


        if (body.type === 2) {
            const guildId = body.guild_id
            const userId = body.member?.user?.id
            const data = body.data
            if (!data) return new NextResponse('missing data', { status: 400 })

            const sub = data.options?.[0]?.name


            if (data.name === 'remind' && sub === 'create') {
                const opts = data.options?.[0]?.options?.reduce((acc: Record<string, string | number>, o: DiscordOption) => {
                    acc[o.name] = o.value
                    return acc
                }, {}) || {}
                const { when, repeat, message, channel } = opts
                const tz = process.env.DISCORD_DEFAULT_TZ || 'Europe/Madrid'
                const start = new Date(when)


                // Save reminder
                const { data: inserted, error } = await supa.from('reminders').insert({
                    guild_id: guildId,
                    channel_id: channel,
                    user_id: userId,
                    message,
                    timezone: tz,
                    schedule_kind: repeat,
                    next_run_at: start.toISOString(),
                    active: true
                }).select('*').single()
                if (error) throw error


                // Schedule first fire
                await scheduleAt(`${req.nextUrl.origin}/api/due`, start.toISOString(), { reminderId: inserted.id })


                return NextResponse.json({
                    type: 4,
                    data: { flags: 64, content: `Reminder set for <#${channel}> at ${start.toISOString()} (${repeat}).` }
                })
            }


            if (data.name === 'remind' && sub === 'list') {
                const { data: rows } = await supa.from('reminders').select('*').eq('guild_id', guildId).eq('user_id', userId).eq('active', true).order('next_run_at', { ascending: true })
                const lines = (rows || []).map((r, i) => `${i + 1}. ${r.message} → <#${r.channel_id}> @ ${r.next_run_at} (${r.schedule_kind}) [${r.id}]`)
                return NextResponse.json({ type: 4, data: { flags: 64, content: lines.join('\n') || 'No active reminders.' } })
            }


            if (data.name === 'remind' && sub === 'delete') {
                const id = data.options?.[0]?.options?.find((o: DiscordOption) => o.name === 'id')?.value
                if (!id) return NextResponse.json({ type: 4, data: { flags: 64, content: 'Missing reminder ID' } })
                await supa.from('reminders').update({ active: false }).eq('id', id)
                return NextResponse.json({ type: 4, data: { flags: 64, content: `Deleted reminder ${id}` } })
            }
        }


        return new NextResponse('ok')
    } catch (error) {
        console.error('Error in interactions endpoint:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
