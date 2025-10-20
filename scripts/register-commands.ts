import 'dotenv/config'


const APP_ID = process.env.DISCORD_APP_ID!
const TOKEN = process.env.DISCORD_BOT_TOKEN!


const cmds = [
    {
        name: 'greetings', description: 'Greetings to the user',
        options: [
            {
                type: 1, name: 'create', description: 'Create a reminder', options: [
                    { type: 3, name: 'when', description: 'ISO time or yyyy-mm-dd hh:mm', required: true },
                    { type: 3, name: 'repeat', description: 'none|daily|weekly|monthly|first_friday', required: true },
                    { type: 3, name: 'message', description: 'Reminder content', required: true },
                    { type: 7, name: 'channel', description: 'Target channel', required: true }
                ]
            },
            { type: 1, name: 'list', description: 'List your reminders' },
            {
                type: 1, name: 'delete', description: 'Delete by id', options: [
                    { type: 3, name: 'id', description: 'Reminder id', required: true }
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
