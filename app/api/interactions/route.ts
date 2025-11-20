import { NextRequest, NextResponse } from 'next/server'
import { parseDate } from 'chrono-node'
import { supa } from '@/lib/supabase'
import { scheduleAt } from '@/lib/qstash'
import { verifyDiscordRequest } from '@/lib/discord'
// Verify Discord signatures using Ed25519. If verification fails,
// respond 401 so Discord can surface the error when registering the URL.

export async function GET() {
    console.log('🔍 GET request to interactions endpoint')
    return NextResponse.json({
        message: 'Discord interactions endpoint is active',
        status: 'ready',
        timestamp: new Date().toISOString()
    })
}

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const startTime = Date.now()
    console.log('🔔 Discord interaction received at', new Date().toISOString())
    try {
        const bodyText = await req.text()

        // Verify the Discord request signature
        const signature = req.headers.get('x-signature-ed25519') || ''
        const timestamp = req.headers.get('x-signature-timestamp') || ''
        const ok = await verifyDiscordRequest(Buffer.from(bodyText), signature, timestamp)
        if (!ok) {
            console.warn('🔐 Discord signature verification failed')
            return new NextResponse('invalid request signature', { status: 401 })
        }

        const body = JSON.parse(bodyText)

        // Handle PING requests (Discord verification)
        if (body.type === 1) {
            const responseTime = Date.now() - startTime
            console.log('🏓 PING request - responding with pong (took', responseTime, 'ms)')
            const response = NextResponse.json({ type: 1 })
            console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()))
            console.log('📤 Response body:', { type: 1 })
            return response
        }

        // Handle slash commands
        if (body.type === 2) {
            console.log('⚡ Slash command received')
            const guildId = body.guild_id
            const userId = body.member?.user?.id
            const data = body.data
            console.log('📊 Command data:', { guildId, userId, commandName: data?.name, subCommand: data?.options?.[0]?.name })

            if (!data) {
                return NextResponse.json({
                    type: 4,
                    data: { content: 'Missing command data', flags: 64 }
                })
            }

            const subCommand = data.options?.[0]?.name

            // /ping create
            if (data.name === 'ping' && subCommand === 'create') {
                const options = data.options[0].options || []
                const opts = options.reduce((acc: Record<string, string>, opt: { name: string; value: string }) => {
                    acc[opt.name] = opt.value
                    return acc
                }, {})

                const { when, repeat, message, channel } = opts
                const tz = process.env.DISCORD_DEFAULT_TZ || 'Europe/Madrid'
                if (!when) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: '❌ Missing time value for reminder', flags: 64 }
                    })
                }

                // Try strict ISO parse first, then fall back to natural-language parsing
                let whenMs = Date.parse(when)
                if (Number.isNaN(whenMs)) {
                    try {
                        const parsed = parseDate(when, new Date(), { forwardDate: true })
                        if (parsed) whenMs = parsed.getTime()
                    } catch (parseErr) {
                        console.error('❌ chrono parsing error:', parseErr)
                    }
                }

                if (Number.isNaN(whenMs)) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `❌ Could not understand the time: "${when}"`, flags: 64 }
                    })
                }

                const start = new Date(whenMs)
                if (start.getTime() <= Date.now()) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `❌ Provided time must be in the future: ${start.toISOString()}`, flags: 64 }
                    })
                }

                // Save reminder to database
                console.log('💾 Saving reminder to database:', { guildId, channel, userId, message, repeat, startTime: start.toISOString() })
                const { data: inserted, error } = await supa
                    .from('reminders')
                    .insert({
                        guild_id: guildId,
                        channel_id: channel,
                        user_id: userId,
                        message,
                        timezone: tz,
                        schedule_kind: repeat,
                        next_run_at: start.toISOString(),
                        active: true
                    })
                    .select('*')
                    .single()

                console.log('💾 Database result:', { inserted, error })

                if (error) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `Error creating reminder: ${error.message}`, flags: 64 }
                    })
                }

                // Schedule first reminder
                const siteUrl = process.env.SITE_URL || req.nextUrl?.origin || `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
                const dueUrl = `${siteUrl.replace(/\/$/, '')}/api/due`
                console.log('⏰ Scheduling reminder with QStash:', { url: dueUrl, at: start.toISOString(), reminderId: inserted.id })
                try {
                    await scheduleAt(dueUrl, start.toISOString(), { reminderId: inserted.id })
                    console.log('✅ QStash scheduling completed')

                    // Produce a human-friendly time phrase
                    const deltaSec = Math.max(0, Math.round((start.getTime() - Date.now()) / 1000))
                    let timePhrase = ''
                    if (deltaSec < 10) {
                        timePhrase = 'in a few seconds'
                    } else if (deltaSec < 60) {
                        timePhrase = `in ${deltaSec} seconds`
                    } else if (deltaSec < 3600) {
                        const mins = Math.round(deltaSec / 60)
                        timePhrase = `in ${mins} minute${mins === 1 ? '' : 's'}`
                    } else if (deltaSec < 86400) {
                        const hours = Math.round(deltaSec / 3600)
                        timePhrase = `in ${hours} hour${hours === 1 ? '' : 's'}`
                    } else {
                        // Use a readable date for longer waits
                        timePhrase = start.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }

                    const repeatText = repeat && repeat !== 'none' ? `${repeat} starting ${timePhrase}` : `on ${timePhrase}`

                    return NextResponse.json({
                        type: 4,
                        data: {
                            content: `✅ Reminder created! Will remind in <#${channel}> ${repeat === 'none' ? '' : ''}${repeatText}`.replace(/ +/g, ' ').trim(),
                            flags: 64
                        }
                    })
                } catch (err) {
                    console.error('⚠️ Scheduling failed, cleaning up reminder:', err)
                    // Attempt to remove the inserted reminder to avoid orphaned rows
                    try {
                        await supa.from('reminders').delete().eq('id', inserted.id)
                    } catch (cleanupErr) {
                        console.error('❌ Failed to clean up reminder after scheduling error:', cleanupErr)
                    }

                    const msg = err instanceof Error ? err.message : String(err)
                    return NextResponse.json({
                        type: 4,
                        data: { content: `❌ Failed to schedule reminder: ${msg}`, flags: 64 }
                    })
                }
            }

            // /ping list
            if (data.name === 'ping' && subCommand === 'list') {
                // Only show active reminders whose next_run_at is in the future
                const nowISO = new Date().toISOString()
                const { data: reminders } = await supa
                    .from('reminders')
                    .select('*')
                    .eq('guild_id', guildId)
                    .eq('user_id', userId)
                    .eq('active', true)
                    .gt('next_run_at', nowISO)
                    .order('next_run_at', { ascending: true })

                if (!reminders || reminders.length === 0) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: '📝 No active upcoming reminders found.', flags: 64 }
                    })
                }

                const list = reminders.map((r, i) => {
                    const idx = i + 1
                    const shortId = String(r.id).slice(0, 8)
                    const whenStr = new Date(r.next_run_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    const repeatText = r.schedule_kind && r.schedule_kind !== 'none' ? r.schedule_kind : 'none'
                    return `${idx}. ${r.message} → <#${r.channel_id}> on ${whenStr} (${repeatText}) [#${idx} / ${shortId}]`
                }).join('\n')

                return NextResponse.json({
                    type: 4,
                    data: { content: `📋 **Your Upcoming Reminders:**\n${list}\n\nTo delete: /ping delete id:<number from list>`, flags: 64 }
                })
            }

            // /ping delete
            if (data.name === 'ping' && subCommand === 'delete') {
                const options = data.options[0].options || []
                const idOption = options.find((opt: { name: string; value: string }) => opt.name === 'id')

                if (!idOption) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: '❌ Missing reminder ID/index', flags: 64 }
                    })
                }

                let targetId: string | null = null
                const val = String(idOption.value).trim()

                // If numeric, treat as list index shown in `/ping list` (1-based)
                if (/^\d+$/.test(val)) {
                    const idx = Number(val)
                    if (idx < 1) {
                        return NextResponse.json({ type: 4, data: { content: '❌ Invalid index', flags: 64 } })
                    }

                    // Fetch the same list used by `/ping list` to resolve index
                    const nowISO = new Date().toISOString()
                    const { data: reminders } = await supa
                        .from('reminders')
                        .select('*')
                        .eq('guild_id', guildId)
                        .eq('user_id', userId)
                        .eq('active', true)
                        .gt('next_run_at', nowISO)
                        .order('next_run_at', { ascending: true })

                    if (!reminders || reminders.length < idx) {
                        return NextResponse.json({ type: 4, data: { content: `❌ No reminder found at index ${idx}`, flags: 64 } })
                    }

                    targetId = reminders[idx - 1].id
                } else {
                    // If value looks like a full id, use it directly
                    targetId = val
                }

                if (!targetId) {
                    return NextResponse.json({ type: 4, data: { content: '❌ Could not resolve reminder to delete', flags: 64 } })
                }

                const { error } = await supa
                    .from('reminders')
                    .update({ active: false })
                    .eq('id', targetId)
                    .eq('user_id', userId) // Ensure user can only delete their own reminders

                if (error) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `❌ Error deleting reminder: ${error.message}`, flags: 64 }
                    })
                }

                return NextResponse.json({
                    type: 4,
                    data: { content: `✅ Reminder deleted successfully!`, flags: 64 }
                })
            }
        }

        return NextResponse.json({ type: 1 })
    } catch (error) {
        console.error('Interactions error:', error)
        return NextResponse.json({
            type: 4,
            data: { content: '❌ An error occurred processing your request', flags: 64 }
        })
    }
}
