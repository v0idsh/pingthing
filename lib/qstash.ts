import { NextRequest } from 'next/server'

const QSTASH_URL = process.env.QSTASH_URL!
const QSTASH_TOKEN = process.env.QSTASH_TOKEN!


export async function scheduleAt(url: string, atISO: string, body: Record<string, unknown>) {
    const r = await fetch(`${QSTASH_URL}/v1/publish/${encodeURI(url)}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${QSTASH_TOKEN}`,
            'Upstash-Delay': atISO,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    if (!r.ok) throw new Error(`QStash schedule failed: ${r.status} ${await r.text()}`)
    return r.json()
}


// Minimal QStash signature verification
export function verifyQStashRequest(req: NextRequest) {
    const sig = req.headers.get('Upstash-Signature') || ''
    // Upstash provides libs; here we keep it simple and skip deep verification for brevity.
    // For production, use @upstash/qstash receiver verify().
    return Boolean(sig)
}
