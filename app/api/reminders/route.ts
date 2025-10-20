import { NextRequest, NextResponse } from 'next/server'
import { supa } from '@/lib/supabase'


function checkAuth(req: NextRequest) {
    const pwd = req.headers.get('x-admin-password')
    return pwd && pwd === process.env.ADMIN_PASSWORD
}


export async function GET(req: NextRequest) {
    if (!checkAuth(req)) return new NextResponse('forbidden', { status: 403 })
    const { searchParams } = new URL(req.url)
    const guild = searchParams.get('guild_id')
    const query = supa.from('reminders').select('*').eq('active', true)
    const { data } = guild ? await query.eq('guild_id', guild) : await query
    return NextResponse.json({ data })
}


export async function POST(req: NextRequest) {
    if (!checkAuth(req)) return new NextResponse('forbidden', { status: 403 })
    const body = await req.json()
    const { data, error } = await supa.from('reminders').insert(body).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
}


export async function DELETE(req: NextRequest) {
    if (!checkAuth(req)) return new NextResponse('forbidden', { status: 403 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await supa.from('reminders').update({ active: false }).eq('id', id)
    return NextResponse.json({ ok: true })
}
