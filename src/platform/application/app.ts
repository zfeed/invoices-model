import Fastify, {
    FastifyInstance,
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyError,
    FastifyReply,
    FastifyRequest,
} from 'fastify';
import { Logger as PinoInstance } from 'pino';

type LifecycleCallback = () => void | Promise<void>;

type ErrorHandler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => unknown;

type AppOptions = {
    logger: PinoInstance;
    errorHandler: ErrorHandler;
};

export class App {
    readonly http: FastifyInstance<
        RawServerDefault,
        RawRequestDefaultExpression,
        RawReplyDefaultExpression,
        PinoInstance
    >;

    private onBootstrapCallbacks: LifecycleCallback[] = [];
    private onShutdownCallbacks: LifecycleCallback[] = [];
    private stopping?: Promise<void>;
    private signalHandlers: Array<[NodeJS.Signals, () => void]> = [];

    constructor({ logger, errorHandler }: AppOptions) {
        this.http = Fastify({ loggerInstance: logger });
        this.http.setErrorHandler(errorHandler);

        this.onShutdown(() => this.http.close());
    }

    onBootstrap(cb: LifecycleCallback): this {
        this.onBootstrapCallbacks.push(cb);
        return this;
    }

    onShutdown(cb: LifecycleCallback): this {
        this.onShutdownCallbacks.push(cb);
        return this;
    }

    async start(port: number): Promise<void> {
        for (const cb of this.onBootstrapCallbacks) {
            await cb();
        }
        await this.http.listen({ port });
        this.listenForSignals();
    }

    stop(): Promise<void> {
        if (this.stopping) return this.stopping;
        this.removeSignalListeners();
        this.stopping = this.runShutdownCallbacks();
        return this.stopping;
    }

    private async runShutdownCallbacks(): Promise<void> {
        for (const cb of this.onShutdownCallbacks) {
            await cb();
        }
    }

    private listenForSignals(): void {
        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
        for (const signal of signals) {
            const handler = () => {
                void this.stop();
            };
            this.signalHandlers.push([signal, handler]);
            process.on(signal, handler);
        }
    }

    private removeSignalListeners(): void {
        for (const [signal, handler] of this.signalHandlers) {
            process.removeListener(signal, handler);
        }
        this.signalHandlers = [];
    }
}
