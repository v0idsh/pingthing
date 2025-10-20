import { RRule } from 'rrule'


export function computeNextRun(opts: {
    start: Date,
    timezone: string,
    kind: 'none' | 'daily' | 'weekly' | 'monthly' | 'first_friday' | 'cron',
    cron?: string
}) {
    const start = opts.start
    switch (opts.kind) {
        case 'none':
            return start
        case 'daily':
            return addDays(start, 1)
        case 'weekly':
            return addDays(start, 7)
        case 'monthly':
            return addMonths(start, 1)
        case 'first_friday': {
            const rule = new RRule({ freq: RRule.MONTHLY, byweekday: [RRule.FR], bysetpos: 1, dtstart: start })
            return rule.after(start, true)!
        }
        case 'cron':
            // For brevity, not parsing cron here; recommend later using cron-parser.
            return addDays(start, 1)
    }
}


function addDays(d: Date, n: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x }
