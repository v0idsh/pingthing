// Minimal worker scaffold for PingThing
// Purpose: provide a simple, always-on process that Render can run as a Background Worker.
// - This file intentionally does not import project TypeScript code to keep it independent and simple.
// - Add your worker logic here (polling, gateway, scheduled jobs, etc.) when needed.

const INTERVAL_SECONDS = process.env.WORKER_POLL_INTERVAL || 60

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🔧 PingThing worker starting...')
  console.log('🔧 WORKER MODE:', process.env.WORKER_MODE || 'idle')
  console.log('🔧 Poll interval (s):', INTERVAL_SECONDS)

  // Idle loop. Replace with your worker tasks when ready.
  while (true) {
    try {
      if (process.env.WORKER_MODE === 'poll') {
        console.log(new Date().toISOString(), '• Worker poll tick — implement polling logic here')
        // Example: query Supabase for due reminders and POST to Discord
        // Implement using @supabase/supabase-js and your project's logic if you switch to TypeScript worker.
      } else {
        // No-op idle heartbeat so Render shows worker is alive
        console.log(new Date().toISOString(), '• Worker idle heartbeat')
      }
    } catch (err) {
      console.error('Worker error:', err)
    }

    await sleep(Number(INTERVAL_SECONDS) * 1000)
  }
}

main().catch((err) => {
  console.error('Worker failed to start:', err)
  process.exit(1)
})
