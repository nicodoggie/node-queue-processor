import * as Redis from 'ioredis';
import { logger } from './logger';

class RateLimitReached extends Error {
    constructor () {
        super('Rate limit reached');
    }
}

interface RedisConfig {
    id:string;
    redisConnection:Redis.RedisOptions
}

interface RateLimitOptions {
    process_per_period: number;
    period: number;
}

abstract class Counter {
    protected counter:number;
    protected expiry:number;

    constructor (count:number = 0, expiry:number = null) {
        this.counter = count;
        this.expiry = expiry;
    }

    abstract tick():Promise<{}>;
}

/**
 * LocalCounter
 * Description:
 *   Resets counter after expiry
 */

class LocalCounter extends Counter {
    constructor(count:number = 0, expiry:number = null) {
        super(count, expiry);
        setInterval(this.reset, expiry * 1000)
    }

    async tick() {
        logger.trace(`event:local:tick`);
        return ++this.counter;
    }

    reset() {
        this.counter=0;
    }
}

/**
 * RedisCounter
 * Description:
 *   On initial create of key, set expiry, so it would automatically be removed after TTL
 */

class RedisCounter extends Counter {
    private key:string;
    private config:RedisConfig;
    private redisClient:any;
    constructor(config:RedisConfig, expiry:number, count:number = 0) {
        super(count, expiry);
        this.config = config;
        this.redisClient = new Redis(config.redisConnection);
        this.key = `rate_limit.counter.${this.config.id}`;

        this.redisClient.defineCommand('expireNX', {
            numberOfKeys: 1,
            lua: `if(redis.call("TTL", KEYS[1]) == -1) then return redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1])) else return nil end`
        })
    }
    
    async tick() {
        logger.trace(`event:redis:tick`);
        try {
            const [ [ err, value ] ] = await this.redisClient
                .pipeline()
                .incr(this.key)
                .expireNX(this.key, this.expiry)
                .exec();
            logger.trace(`increment`, value);
            return value;
        } catch (error) {
            logger.error(error);
        }
    }
}

class RateLimit {
    private options:RateLimitOptions = null;
    private config:RedisConfig = null;

    private counter:Counter;
    private lastCount:number;

    constructor (options:RateLimitOptions, config:RedisConfig = null) {
        this.options = options;
        this.config = config;
        // default local counter
        this.counter = new LocalCounter();
        if (config !== null) {
            this.counter = new RedisCounter(this.config, this.options.period);
        }
    }

    async tick() {
        this.lastCount = 0; //(await this.counter.tick());
        logger.trace(`event:rate_limit:tick`, { count: this.lastCount });
        if (this.lastCount > this.options.process_per_period) {
            throw new RateLimitReached();
        }
        return this.lastCount;
    }

    getLastCount() {
        return this.lastCount;
    }
}

export { RateLimit, RedisCounter, LocalCounter };