<h1 align="center">PingThing</h1>
<div aling="center">
    <img align="center" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=%233178C6&labelColor=white&color=%233178C6">
    <img align="center" src="https://img.shields.io/badge/Next.js-black?logo=nextdotjs&logoColor=%23000000&labelColor=white&color=%23000000">
    <img align="center" src="https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=%23000000&labelColor=white&color=%23000000">
    <img align="center" src="https://img.shields.io/badge/supabase-black?logo=supabase&logoColor=%233FCF8E&labelColor=grey&color=grey">
    <img align="center" src="https://img.shields.io/badge/QStash-black?logo=upstash&logoColor=%2300E9A3&labelColor=grey&color=grey">
    <img align="center" src="https://img.shields.io/badge/Discord-black?logo=discord&logoColor=white&labelColor=%235865F2&color=%235865F2">
</div>
<br>
<p align="center">PingThing is a simple and self-hosted Discord bot. It's built with Next.js and Typescript and hosted on Vercel.</p>

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Requirements

- Next.js
- Discord and access to the Discord dev portal
- Vercel account, where the app will be hosted
- Supabase for storage
- QStash for scheduling

## Setup

1. Clone repository
2. Set up your Discord bot, Supabase and QStash
3. Make a copy of [.env.example]() and populate the `.env` file with your Environment Variables
4. `npm install`
5. `npm run dev` to test locally
6. Deploy on Vercel

### Discord bot setup

1. Go to https://discord.com/developers/applications
2. Create New Application 
3. Inside of the `Bot` tab -> Leave **Server Members Intent** and **Message Content Intent** unchecked!
4. Check the following scopes in OAuth -> URL Generator:
    - [x] bot
    - [x] applications.command
5. Check the following permissions under the scopes:
    - [x] Send Messages
    - [x] Embed Links
    - [x] Attach Files
    - [x] Read Message History
    - [x] Use Slash Commands

    At the bottom you'll see a URL. **This is the bot invite link.** Open it in your browser, select your server name, and click 
    Authorize.
5. Copy all the needed tokens and add them to Vercel or your `.env` file.
    ```ini
        DISCORD_PUBLIC_KEY= # you'll find it in the General Information page
        DISCORD_APP_ID= # you'll find it in the General Information page
        DISCORD_BOT_TOKEN= # you'll find it in the Bot page
    ```
### Supabase table setup

You can setup the table on supabase with the following sql snippet.

```sql
    create table if not exists reminders (
        id uuid primary key default gen_random_uuid(),
        guild_id text not null,
        channel_id text not null,
        user_id text not null,
        message text not null,
        timezone text not null default 'Europe/Madrid',
        schedule_kind text not null check (schedule_kind in ('none','daily','weekly','monthly','first_friday','cron')),
        cron text null,
        rrule text null,
        next_run_at timestamptz not null,
        active boolean not null default true,
        created_at timestamptz not null default now()
);


create index if not exists reminders_next_run_idx on reminders (next_run_at) where active = true;
```

>[!NOTE] Then make sure to activate RLS on your table, since we'll only be accessing it through the Service Role Key, bypassing RLS.

### Environment Variables

You can find the example file in [.env.example](), just make sure to populate it with your keys.

```ini
    # Discord bot keys, you can get them from the Discord Dev Portal
    DISCORD_PUBLIC_KEY=
    DISCORD_APP_ID=
    DISCORD_BOT_TOKEN=
    DISCORD_DEFAULT_TZ=Europe/Madrid # your default timezone for scheduling

    # Grab from your QStash project once created
    QSTASH_URL=https://qstash.upstash.io
    QSTASH_TOKEN=
    QSTASH_CURRENT_SIGNING_KEY=
    QSTASH_NEXT_SIGNING_KEY=

    # You can get the Project URL from the main page
    SUPABASE_URL=
    # You can get the Service Role Key from PROJECT SETTINGS -> API KEYS
    SUPABASE_SERVICE_ROLE_KEY=

    # Create a strong password for your dashboard
    ADMIN_PASSWORD=
```