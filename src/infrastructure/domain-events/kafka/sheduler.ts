import { setTimeout } from 'node:timers/promises';
import { Duration } from '../../../lib/dayjs';

type Job = () => Promise<void>;

export class Scheduler {
    private interval: Duration;
    private job: Job;
    private abortController: AbortController | null = null;
    private running = false;

    constructor(config: { job: Job; interval: Duration }) {
        this.job = config.job;
        this.interval = config.interval;
    }

    async start(): Promise<void> {
        if (this.running) {
            return;
        }

        this.running = true;

        this.run();
    }

    private async run(): Promise<void> {
        this.abortController = new AbortController();

        while (true) {
            if (!this.running) {
                return;
            }

            try {
                await setTimeout(this.interval.asMilliseconds(), undefined, {
                    signal: this.abortController.signal,
                });
            } catch {
                return;
            }

            await this.job();
        }
    }

    async stop(): Promise<void> {
        this.running = false;
        this.abortController?.abort();
        this.abortController = null;
    }
}
