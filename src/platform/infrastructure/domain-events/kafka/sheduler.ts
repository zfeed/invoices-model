import { setTimeout } from 'node:timers/promises';
import { Duration } from '../../../../lib/dayjs/dayjs.ts';
import { Logger } from '../../../../core/building-blocks/logger/logger.ts';

type Job = () => Promise<void>;

export class Scheduler {
    private interval: Duration;
    private job: Job;
    private logger: Logger;
    private abortController: AbortController | null = null;
    private running = false;

    constructor(config: { job: Job; interval: Duration; logger: Logger }) {
        this.job = config.job;
        this.interval = config.interval;
        this.logger = config.logger;
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

            try {
                await this.job();
            } catch (error) {
                this.logger.error('scheduler job failed', { error });
            }
        }
    }

    async stop(): Promise<void> {
        this.running = false;
        this.abortController?.abort();
        this.abortController = null;
    }
}
