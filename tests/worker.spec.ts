import { Worker } from '../src/worker';
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
}); 