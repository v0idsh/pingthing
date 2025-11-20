import { verifyKey } from 'discord-interactions'


export const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || ''
export const DISCORD_APP_ID = process.env.DISCORD_APP_ID || ''
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''

export async function verifyDiscordRequest(body: Buffer, signature: string, timestamp: string) {
    if (!DISCORD_PUBLIC_KEY) {
        console.warn('🔐 Missing DISCORD_PUBLIC_KEY — cannot verify Discord request signatures')
        return false
    }
    try {
        // verifyKey may be sync or async depending on the environment/library version.
        // Awaiting it covers both cases.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const res = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY)
        return Boolean(res)
    } catch (err) {
        console.error('🔐 verifyDiscordRequest error:', err)
        return false
    }
}


export async function postChannelMessage(channelId: string, content: string) {
    const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
    })
    if (!r.ok) {
        const txt = await r.text()
        throw new Error(`Discord message failed: ${r.status} ${txt}`)
    }
}


export type Interaction = {
    type: number
    data?: {
        name: string
        options?: Array<{
            name: string
            options?: Array<{
                name: string
                value: string | number
            }>
        }>
    }
    member?: { user?: { id: string } }
    guild_id?: string
}
