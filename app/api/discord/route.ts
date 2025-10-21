import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscordRequest } from '@/lib/discord'

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('x-signature-ed25519') || ''
        const timestamp = req.headers.get('x-signature-timestamp') || ''

        // Handle PING without signature verification
        if (body.includes('"type":1')) {
            return NextResponse.json({ type: 1 })
        }

        // Verify signature for other requests
        const isValid = verifyDiscordRequest(Buffer.from(body), signature, timestamp)
        if (!isValid) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = JSON.parse(body)

        // Handle slash commands
        if (data.type === 2) {
            return NextResponse.json({
                type: 4,
                data: {
                    content: 'Hello! This is a test response.',
                    flags: 64
                }
            })
        }

        return NextResponse.json({ type: 1 })
    } catch (error) {
        console.error('Discord endpoint error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
