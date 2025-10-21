import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: 'Test endpoint is working!',
        status: 'ready',
        timestamp: new Date().toISOString()
    })
}

export async function POST(req: NextRequest) {
    console.log('🧪 TEST: Discord interaction received')
    try {
        const body = await req.json()
        console.log('🧪 TEST: Request body:', JSON.stringify(body, null, 2))

        // Handle PING requests (Discord verification)
        if (body.type === 1) {
            console.log('🧪 TEST: PING request - responding with pong')
            return NextResponse.json({ type: 1 })
        }

        // Handle slash commands
        if (body.type === 2) {
            console.log('🧪 TEST: Slash command received')
            return NextResponse.json({
                type: 4,
                data: { content: '🧪 Test endpoint working!', flags: 64 }
            })
        }

        return NextResponse.json({ type: 1 })
    } catch (error) {
        console.error('🧪 TEST: Error:', error)
        return NextResponse.json({
            type: 4,
            data: { content: '❌ Test endpoint error', flags: 64 }
        })
    }
}
