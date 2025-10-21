<h1 align="center">
    <br>
    <img width="3301" height="721" alt="PingThing" src="https://github.com/v0idsh/pingthing/blob/main/app/banner&icon@3x.png">
    <br>
    <b>PingThing</b>
    <br>
</h1>
<div align="center">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=%233178C6&labelColor=white&color=%233178C6">
    <img src="https://img.shields.io/badge/Next.js-black?logo=nextdotjs&logoColor=%23000000&labelColor=white&color=%23000000">
    <img src="https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=%23000000&labelColor=white&color=%23000000">
    <img src="https://img.shields.io/badge/Supabase-black?logo=supabase&logoColor=%233FCF8E&labelColor=grey&color=grey">
    <img src="https://img.shields.io/badge/QStash-black?logo=upstash&logoColor=%2300E9A3&labelColor=grey&color=grey">
    <img src="https://img.shields.io/badge/Discord-black?logo=discord&logoColor=white&labelColor=%235865F2&color=%235865F2">
</div>
<br>
<p align="center"><b>PingThing</b> is a simple and minimal Discord reminder bot with a user-friendly dashboard. It's built with Next.js and Typescript and hosted on Vercel. Everything is made to be straightforward and free to host and run with the given platforms.</p>

> [!IMPORTANT]
> WIP, finishing coding

# Requirements

* [**Discord Dev Portal**](https://discord.com/developers/applications) to configure the bot
* [**Vercel**](https://vercel.com/), where the app will be hosted
* [**Supabase**](https://supabase.com/) for storage
* [**QStash**](https://console.upstash.com/qstash) for scheduling

# Quickstart

1. Set up your Discord bot and connect it to your server
2. Set up Supabase and QStash
3. Clone/fork this repo
4. `npm install`
5. Make a copy of [**.env.example**](https://github.com/v0idsh/pingthing/blob/main/.env.example) and populate the `.env` file with your environment variables.
6. Register Discord commands with `npx tsx scripts/setup.ts`
7. `npm run dev` to test locally
8. Deploy on Vercel

> [!NOTE]
> Detailed instructions on how to set up the project and configure all platforms can be found in the [**Wiki**](https://github.com/v0idsh/pingthing/wiki/).


# Usage

The bot allows you to create reminders that will be sent in a specific channel in your server.

To create a reminder, run `/ping create` and attach the following parameters:

- `when` *(required)*: When to send the reminder
    - Format: ISO or `yyyy-mm-dd hh:mm`
- `repeat` *(required)*: How often to repeat the reminder
    - Options: `none`, `daily`, `weekly`, `monthly`
- `message` *(required)*: The reminder content
- `channel` *(required)*: Which channel to send the reminder in

Example:
```
/ping create when:2025-10-22 20:00 repeat:daily message:Work out before going to bed! channel:#general
```

To list all active reminders in the current server, run `/ping list`.

To delete a reminder, run `/ping delete` followed by its specific ID.

# License

This project is licensed under the ⚖ **MIT License** - see [**LICENSE**](https://github.com/v0idsh/pingthing/blob/main/LICENSE) for more.
