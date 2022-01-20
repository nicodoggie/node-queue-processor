import { randomUUID } from 'crypto';
import { logger } from './logger';
import { RateLimit, RateLimitReached } from './rate_limit';
import { EventEmitter } from 'events';

class Worker extends EventEmitter {
    private process: (arg: any) => Promise<string>;
    private rateLimit: RateLimit;
    private retry: boolean;
    private id: string;

    constructor(process: (arg: any) => Promise<string>, rateLimit:RateLimit = null, retry: boolean = true) {
        super();

        this.id = randomUUID();
        logger.child({ id: this.id }).trace(`worker created`);

        this.rateLimit = rateLimit;
        this.process = process;
        this.on('error', (error) => {
            logger.child({ id: this.id }).error(error);
        });
        this.retry = retry;
    }

    getProcess() {
        return this.process;
    }

    async run(data: object) {
        try {
            logger.child({ id: this.id }).trace(`worker running`);
            // check if rate limit reached
            if (this.rateLimit) {
                await this.rateLimit.tick();
            }
            // should return true for success
            return await this.process(data);
        } catch (error) {
            if (error instanceof RateLimitReached) {
                logger.child({ id: this.id }).trace(`rate limit triggered`);
            } else {
                this.emit('error', new Error(error.message));
            }
            // failed
            return false;
        }
    }

    shouldRetry() {
        return this.retry;
    }
}

export { Worker };