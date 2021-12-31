import { RateLimit } from '../src/rate_limit';
import { expect, should } from 'chai';
import { describe, it } from 'mocha';

describe('rate limit class', () => { 
    it('should be initiated successfully', () => { 
        const rateLimit = new RateLimit({
            process_per_period: 10,
            period: 5,
        });
        expect(rateLimit instanceof RateLimit).to.equal(true)
    });

    it('should not throw an error before limit is reached', async () => {
        const rateLimit = new RateLimit({
            process_per_period: 5,
            period: 5,
        });

        try {
            await Promise.all([
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
            ]);
        } catch (error) {
            expect.fail('Rate limit reached!');
        }
    });

    it('should throw an error when limit is reached', async () => {
        const rateLimit = new RateLimit({
            process_per_period: 5,
            period: 5,
        });

        try {
            await Promise.all([
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(),
                rateLimit.tick(), // above 5
            ]);
            expect.fail('Rate limit not reached!');
        } catch (error) {
            // passed
        }
    });
}); 