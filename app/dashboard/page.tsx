'use client'
import { useEffect, useState, useCallback } from 'react'

function useAdminPassword() {
    const [pwd, setPwd] = useState('')
    useEffect(() => {
        const p = localStorage.getItem('admin_pwd')
        if (p) setPwd(p)
    }, [])
    return { pwd, setPwd }
}

function shortId(id: string) {
    return String(id).slice(0, 8)
}

function relativeTime(dateStr: string) {
    const diff = Date.parse(dateStr) - Date.now()
    const sec = Math.round(diff / 1000)
    if (Math.abs(sec) < 10) return 'in a few seconds'
    if (sec < 60) return `in ${sec} second${sec === 1 ? '' : 's'}`
    if (sec < 3600) return `in ${Math.round(sec / 60)} minute${Math.round(sec / 60) === 1 ? '' : 's'}`
    if (sec < 86400) return `in ${Math.round(sec / 3600)} hour${Math.round(sec / 3600) === 1 ? '' : 's'}`
    return new Date(dateStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
    const { pwd, setPwd } = useAdminPassword()
    const [items, setItems] = useState<Array<{
        id: string
        message: string
        channel_id: string
        next_run_at: string
        schedule_kind: string
    }>>([])
    const [form, setForm] = useState({
        guild_id: '',
        channel_id: '',
        user_id: '',
        message: '',
        timezone: 'Europe/Madrid',
        schedule_kind: 'daily',
        next_run_at: ''
    })


    const load = useCallback(async () => {
        const r = await fetch('/api/reminders', { headers: { 'x-admin-password': pwd } })
        if (r.ok) {
            const j = await r.json(); setItems(j.data || [])
        } else { setItems([]) }
    }, [pwd])
    useEffect(() => { if (pwd) load() }, [pwd, load])


    async function create() {
        const r = await fetch('/api/reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': pwd },
            body: JSON.stringify({ ...form, active: true })
        })
        if (r.ok) { setForm({ ...form, message: '' }); load() }
    }
    async function del(id: string) {
        if (!confirm('Delete this reminder?')) return
        await fetch(`/api/reminders?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': pwd } })
        load()
    }


    if (!pwd) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Dashboard Login</h1>
                <input placeholder="Admin password" className="p-2 rounded w-full" type="password"
                    onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { localStorage.setItem('admin_pwd', (e.target as HTMLInputElement).value); location.reload() } }} />
                <p className="text-sm opacity-70">Press Enter to continue.</p>
            </div>
        )
    }


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Reminders</h1>


            <section className="bg-neutral-900 p-4 rounded-xl space-y-3">
                <h2 className="font-medium">Create</h2>
                <div className="grid grid-cols-2 gap-3">
                    <input placeholder="guild_id" className="p-2 rounded" value={form.guild_id} onChange={e => setForm(f => ({ ...f, guild_id: e.target.value }))} />
                    <input placeholder="channel_id" className="p-2 rounded" value={form.channel_id} onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))} />
                    <input placeholder="user_id" className="p-2 rounded" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} />
                    <input placeholder="timezone" className="p-2 rounded" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} />
                    <select className="p-2 rounded" value={form.schedule_kind} onChange={e => setForm(f => ({ ...f, schedule_kind: e.target.value }))}>
                        <option value="none">none</option>
                        <option value="daily">daily</option>
                        <option value="weekly">weekly</option>
                        <option value="monthly">monthly</option>
                        <option value="first_friday">first_friday</option>
                    </select>
                    <input placeholder="next_run_at (ISO or natural)" className="p-2 rounded" value={form.next_run_at} onChange={e => setForm(f => ({ ...f, next_run_at: e.target.value }))} />
                    <textarea placeholder="message" className="p-2 rounded col-span-2" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-2 bg-white text-black rounded" onClick={create}>Create</button>
                    <button className="px-3 py-2 bg-zinc-700 text-white rounded" onClick={() => { setForm({ guild_id: '', channel_id: '', user_id: '', message: '', timezone: 'Europe/Madrid', schedule_kind: 'daily', next_run_at: '' }) }}>Clear</button>
                </div>
            </section>


            <section className="space-y-2">
                {items.map((r, idx) => (
                    <div key={r.id} className="bg-neutral-900 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="font-medium">{r.message}</div>
                            <div className="text-sm opacity-70">→ <span className="font-medium">#{r.channel_id}</span> • next: {relativeTime(r.next_run_at)} • {r.schedule_kind} • <span className="font-mono text-xs">{shortId(r.id)}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm opacity-70 mr-2">#{idx + 1}</div>
                            <button className="px-3 py-2 bg-red-500 text-white rounded" onClick={() => del(r.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}