import { NextRequest, NextResponse } from 'next/server'
import { supa } from '@/lib/supabase'
import { scheduleAt } from '@/lib/qstash'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Handle PING requests (Discord verification)
        if (body.type === 1) {
            return NextResponse.json({ type: 1 })
        }

        // Handle slash commands
        if (body.type === 2) {
            const guildId = body.guild_id
            const userId = body.member?.user?.id
            const data = body.data

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

                if (error) {
                    return NextResponse.json({
                        type: 4,
                        data: { content: `Error creating reminder: ${error.message}`, flags: 64 }
                    })
                }

                // Schedule first reminder
                await scheduleAt(`${req.nextUrl.origin}/api/due`, start.toISOString(), { reminderId: inserted.id })

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
