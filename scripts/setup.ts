import 'dotenv/config'

const APP_ID = process.env.DISCORD_APP_ID!
const TOKEN = process.env.DISCORD_BOT_TOKEN!

if (!APP_ID || !TOKEN) {
    console.error('❌ Missing environment variables: DISCORD_APP_ID and DISCORD_BOT_TOKEN')
    console.log('💡 Make sure you have a .env file with your Discord credentials')
    process.exit(1)
}

console.log('🚀 Setting up PingThing Discord Bot...')

// Register slash commands
async function registerCommands() {
    const cmds = [
        {
            name: 'ping',
            description: 'Create, list, or delete reminders',
            type: 1,
            options: [
                {
                    type: 1,
                    name: 'create',
                    description: 'Create a new reminder',
                    options: [
                        { type: 3, name: 'when', description: 'When to remind (ISO format or yyyy-mm-dd hh:mm)', required: true },
                        { type: 3, name: 'repeat', description: 'How often to repeat (none, daily, weekly, monthly)', required: true },
                        { type: 3, name: 'message', description: 'What to remind about', required: true },
                        { type: 7, name: 'channel', description: 'Which channel to send the reminder to', required: true }
                    ]
                },
                {
                    type: 1,
                    name: 'list',
                    description: 'List all your active reminders'
                },
                {
                    type: 1,
                    name: 'delete',
                    description: 'Delete a reminder by its ID',
                    options: [
                        { type: 3, name: 'id', description: 'The ID of the reminder to delete', required: true }
                    ]
                }
            ]
        }
    ]

    try {
        const r = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cmds)
        })

        if (!r.ok) {
            const error = await r.text()
            throw new Error(`Discord API error: ${r.status} ${error}`)
        }

        console.log('✅ Slash commands registered successfully!')
        console.log('🎉 Your bot is ready to use!')
        console.log('💡 Try using /ping create in your Discord server')

    } catch (error) {
        console.error('❌ Failed to register commands:', error)
        process.exit(1)
    }
}

registerCommands()
