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
        guild_id: '', channel_id: '', user_id: '', message: '',
        timezone: 'Europe/Madrid', schedule_kind: 'daily', next_run_at: ''
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
                    <input placeholder="next_run_at (ISO)" className="p-2 rounded" value={form.next_run_at} onChange={e => setForm(f => ({ ...f, next_run_at: e.target.value }))} />
                    <textarea placeholder="message" className="p-2 rounded col-span-2" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button className="px-3 py-2 bg-white text-black rounded" onClick={create}>Create</button>
            </section>


            <section className="space-y-2">
                {items.map((r) => (
                    <div key={r.id} className="bg-neutral-900 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="font-medium">{r.message}</div>
                            <div className="text-sm opacity-70">→ #{r.channel_id} • next: {new Date(r.next_run_at).toLocaleString()} • {r.schedule_kind} • {r.id}</div>
                        </div>
                        <button className="px-3 py-2 bg-red-500 text-white rounded" onClick={() => del(r.id)}>Delete</button>
                    </div>
                ))}
            </section>
        </div>
    );
}