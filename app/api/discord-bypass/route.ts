import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    // Always return PING response - bypasses all verification
    return NextResponse.json({ type: 1 })
}
