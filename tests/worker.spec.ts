import { Worker } from '../src/worker';
import { RateLimit } from '../src/rate_limit';
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('worker class', () => { 
    it('should save callback function', () => { 
        const baseData:any = {
            sample: true
        }
        const processor:any = async (data:any) => {
            expect(data).to.equal(baseData);
        };
        const instance = new Worker(processor);
        expect(instance.getProcess()).to.equal(processor)
    });

    it('should call callback on run', () => {
        const baseData:any = true;
        const processor:any = async (data:any) => {
            expect(data).to.be.a('boolean');
            expect(data).to.equal(true);
        };
        const instance = new Worker(processor);
        instance.run(baseData);
    });

    it('should trigger rate limit', () => {
        
        const baseData:any = true;
        const processor:any = async (data:any) => {
            expect(data).to.be.a('boolean');
            expect(data).to.equal(true);
        };
        const instance = new Worker(
            processor, 
            new RateLimit({
                process_per_period: 2,
                period: 5,
            })
        );

        instance.run(baseData);
        instance.run(baseData);
        try {
            instance.run(baseData);
            expect.fail('Rate should have triggered');
        } catch (error) {
            // should pass
        }
    });
}); 