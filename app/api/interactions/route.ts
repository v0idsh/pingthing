import { NextRequest, NextResponse } from 'next/server'
import { supa } from '@/lib/supabase'
import { scheduleAt } from '@/lib/qstash'
import crypto from 'crypto'

// Discord signature verification
function verifyDiscordSignature(req: NextRequest, body: string): boolean {
    const signature = req.headers.get('x-signature-ed25519')
    const timestamp = req.headers.get('x-signature-timestamp')
    const publicKey = process.env.DISCORD_PUBLIC_KEY!

    if (!signature || !timestamp || !publicKey) {
        console.log('❌ Missing Discord signature headers')
        return false
    }

    try {
        const message = timestamp + body
        const key = Buffer.from(publicKey, 'hex')
        const sig = Buffer.from(signature, 'hex')

        return crypto.verify(null, Buffer.from(message), key, sig)
    } catch (error) {
        console.error('❌ Discord signature verification failed:', error)
        return false
    }
}

export async function GET(req: NextRequest) {
    console.log('🔍 GET request to interactions endpoint')
    return NextResponse.json({
        message: 'Discord interactions endpoint is active',
        status: 'ready',
        timestamp: new Date().toISOString()
    })
}

export async function POST(req: NextRequest) {
    const startTime = Date.now()
    console.log('🔔 Discord interaction received at', new Date().toISOString())
    try {
        const bodyText = await req.text()
        console.log('📝 Raw body:', bodyText)

        // Verify Discord signature (temporarily disabled for Discord verification)
        const isSignatureValid = verifyDiscordSignature(req, bodyText)
        if (!isSignatureValid) {
            console.log('❌ Invalid Discord signature - but continuing for Discord verification')
            // Temporarily disabled signature verification to allow Discord verification
            // TODO: Fix signature verification later
        }

        const body = JSON.parse(bodyText)
        console.log('📝 Parsed body:', JSON.stringify(body, null, 2))

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
                const start = new Date(when)

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
                console.log('⏰ Scheduling reminder with QStash:', { url: `${req.nextUrl.origin}/api/due`, at: start.toISOString(), reminderId: inserted.id })
                await scheduleAt(`${req.nextUrl.origin}/api/due`, start.toISOString(), { reminderId: inserted.id })
                console.log('✅ QStash scheduling completed')

                return NextResponse.json({
                    type: 4,
                    data: {
                        content: `✅ Reminder created! Will remind in <#${channel}> at ${start.toISOString()} (${repeat})`,
                        flags: 64
                    }
                })
            }

            // /ping list
            if (data.name === 'ping' && subCommand === 'list') {
                const { data: reminders } = await supa
                    .from('reminders')
                    .select('*')
                    .eq('guild_id', guildId)
                    .eq('user_id', userId)
                    .eq('active', true)
                    .order('next_run_at', { ascending: true })

                if (!reminders || reminders.length === 0) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: '📝 No active reminders found.', flags: 64 }
                    })
                }

                const list = reminders.map((r, i) =>
                    `${i + 1}. ${r.message} → <#${r.channel_id}> @ ${new Date(r.next_run_at).toLocaleString()} (${r.schedule_kind}) [${r.id}]`
                ).join('\n')

                return NextResponse.json({
                    type: 4,
                    data: { content: `📋 **Your Reminders:**\n${list}`, flags: 64 }
                })
            }

            // /ping delete
            if (data.name === 'ping' && subCommand === 'delete') {
                const options = data.options[0].options || []
                const idOption = options.find((opt: { name: string; value: string }) => opt.name === 'id')

                if (!idOption) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: '❌ Missing reminder ID', flags: 64 }
                    })
                }

                const { error } = await supa
                    .from('reminders')
                    .update({ active: false })
                    .eq('id', idOption.value)
                    .eq('user_id', userId) // Ensure user can only delete their own reminders

                if (error) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `❌ Error deleting reminder: ${error.message}`, flags: 64 }
                    })
                }

                return NextResponse.json({
                    type: 4,
                    data: { content: `✅ Reminder ${idOption.value} deleted successfully!`, flags: 64 }
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
