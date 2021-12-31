import { randomUUID } from 'crypto';
import { logger } from './logger';
import { RateLimit } from './rate_limit';

class Worker {
    private process: (arg: any) => Promise<string>;
    private errorHandler: (error:Error) => any;
    private rateLimit: RateLimit;
    private retry: boolean;
    private id: string;

    constructor(process: (arg: any) => Promise<string>, rateLimit:RateLimit = null, retry: boolean = true) {
        this.id = randomUUID();
        logger.child({ id: this.id }).trace(`worker created`);

        this.rateLimit = rateLimit;
        this.process = process;
        this.errorHandler = (error) => {
            logger.child({ id: this.id }).error(error);
        }
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
            this.errorHandler(new Error(error.message));
            // failed
            return false;
        }
    }

    shouldRetry() {
        return this.retry;
    }
}

export { Worker };