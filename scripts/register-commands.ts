import 'dotenv/config'

const APP_ID = process.env.DISCORD_APP_ID!
const TOKEN = process.env.DISCORD_BOT_TOKEN!

if (!APP_ID || !TOKEN) {
    console.error('Missing environment variables: DISCORD_APP_ID and DISCORD_BOT_TOKEN')
    process.exit(1)
}


const cmds = [
    {
        name: 'ping',
        description: 'Create, list, or delete reminders',
        type: 1, // CHAT_INPUT
        options: [
            {
                type: 1, // SUB_COMMAND
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
                type: 1, // SUB_COMMAND
                name: 'list',
                description: 'List all your active reminders'
            },
            {
                type: 1, // SUB_COMMAND
                name: 'delete',
                description: 'Delete a reminder by its ID',
                options: [
                    { type: 3, name: 'id', description: 'The ID of the reminder to delete', required: true }
                ]
            }
        ]
    }
]


async function upsert() {
    const r = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmds)
    })
    if (!r.ok) throw new Error(await r.text())
    console.log('Commands registered.')
}


upsert()
