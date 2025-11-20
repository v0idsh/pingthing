import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[24px] row-start-2 items-center sm:items-start text-center sm:text-left max-w-2xl">
        <Image
          className="rounded-2xl shadow-lg"
          src="/icon@500px.png"
          alt="PingThing icon"
          width={120}
          height={120}
          priority
        />
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            PingThing lives on Railway
          </h1>
          <p className="text-base text-black/70 dark:text-white/70 leading-6">
            Slash-command reminders, a Supabase-backed queue, and Upstash QStash
            scheduling all packaged inside a Next.js app. Deploy the bot, wire
            up your Discord interactions URL, and manage reminders from the
            dashboard.
          </p>
        </div>
        <ol className="font-mono list-inside list-decimal text-sm/6 space-y-2">
          <li>Install dependencies with pnpm and run the setup script.</li>
          <li>Provision Supabase + QStash and drop the env vars into Railway.</li>
          <li>Point Discord’s interactions endpoint at your Railway URL.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://railway.app/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deploy on Railway
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://github.com/v0idsh/pingthing/wiki"
            target="_blank"
            rel="noopener noreferrer"
          >
            Setup wiki
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm">
        <Link className="hover:underline hover:underline-offset-4" href="/dashboard">
          Dashboard preview
        </Link>
        <a
          className="hover:underline hover:underline-offset-4"
          href="https://nextjs.org/docs/app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js docs
        </a>
        <a
          className="hover:underline hover:underline-offset-4"
          href="https://railway.app/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Railway docs
        </a>
      </footer>
    </div>
  );
}
