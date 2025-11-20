import { NextRequest } from 'next/server'

const QSTASH_URL = process.env.QSTASH_URL || ''
const QSTASH_TOKEN = process.env.QSTASH_TOKEN || ''

console.log('🔧 QStash config:', {
    url: QSTASH_URL ? '✅ Set' : '❌ Missing',
    token: QSTASH_TOKEN ? '✅ Set' : '❌ Missing'
})


export async function scheduleAt(url: string, atISO: string, body: Record<string, unknown>) {
    console.log('🚀 QStash request:', { url, atISO, body })
    if (!QSTASH_URL || !QSTASH_TOKEN) {
        const msg = 'QStash configuration missing (QSTASH_URL/QSTASH_TOKEN)'
        console.error('❌ QStash error:', msg)
        throw new Error(msg)
    }

    // Try v2 endpoint first (Upstash migrated away from V1). If that fails,
    // fall back to v1 for compatibility, but log the situation so the user
    // can update their credentials/URL.
    const endpoints = [`${QSTASH_URL.replace(/\/$/, '')}/v2/publish/${encodeURI(url)}`,
        `${QSTASH_URL.replace(/\/$/, '')}/v1/publish/${encodeURI(url)}`]

    let lastError: any = null
    for (const endpoint of endpoints) {
        try {
            const r = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${QSTASH_TOKEN}`,
                    'Upstash-Delay': atISO,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            console.log('📡 QStash response status for', endpoint, ':', r.status)

            if (!r.ok) {
                const errorText = await r.text()
                console.error('❌ QStash error for', endpoint, ':', errorText)
                lastError = new Error(`QStash schedule failed: ${r.status} ${errorText}`)
                // If this was a 410 indicating V1 removal, continue to next endpoint.
                continue
            }

            const result = await r.json()
            console.log('✅ QStash success:', result)
            return result
        } catch (error) {
            console.error('💥 QStash scheduling error for', endpoint, error)
            lastError = error
        }
    }

    throw lastError || new Error('QStash scheduling failed for all endpoints')
}


// Minimal QStash signature verification
export function verifyQStashRequest(req: NextRequest) {
    const sig = req.headers.get('Upstash-Signature') || ''
    // Upstash provides libs; here we keep it simple and skip deep verification for brevity.
    // For production, use @upstash/qstash receiver verify().
    return Boolean(sig)
}
