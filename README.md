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
    <img src="https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=black&labelColor=white&color=%23000000">
    <img src="https://img.shields.io/badge/Supabase-black?logo=supabase&logoColor=%233FCF8E&labelColor=grey&color=grey">
    <img src="https://img.shields.io/badge/QStash-black?logo=upstash&logoColor=%2300E9A3&labelColor=grey&color=grey">
    <img src="https://img.shields.io/badge/Discord-black?logo=discord&logoColor=white&labelColor=%235865F2&color=%235865F2">
</div>
<br>
<p align="center"><b>PingThing</b> is a simple and minimal Discord reminder bot with a user-friendly dashboard. It's built with Next.js and Typescript and hosted on Vercel. Everything is made to be straightforward and free to host and run with the given platforms.</p>

> [!NOTE]
> This is a hobby project where I wanted to learn how to create a simple reminder bot with typescript and host it for free. Right now the project is finished and won't be updated anymore, but feel free to use it for yourself.

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
<div align="center">
<a href="https://github.com/user-attachments/assets/ae232745-2a57-4498-b22e-c1de022e6ec6" target="_blank" rel="noopener">
<img width="500" alt="Using PingThing with slash commands" src="https://github.com/user-attachments/assets/ae232745-2a57-4498-b22e-c1de022e6ec6" />
</a></div>

You can use the bot with **slash commands** directly from Discord.
* Create a reminder with `/ping create` and the included parameters.
* List active reminders with `/ping list`.
* Delete a reminder with `/ping delete` and its index ID.

Examples:
```
    /ping create when:tomorrow 9pm repeat:daily message:Work out before bed! channel:#general
    /ping delete 1
```
> [!IMPORTANT]
> You can also use the simple dashboard at https://yourapp.vercel.app/dashboard to delete and create reminders. Use the password from your .env file to access it.
>
> Detailed usage instructions can be found in the [**Wiki**](https://github.com/v0idsh/pingthing/wiki/)

# License

This project is licensed under the ⚖ **MIT License** - see [**LICENSE**](https://github.com/v0idsh/pingthing/blob/main/LICENSE) for more.
