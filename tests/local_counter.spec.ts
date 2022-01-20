import { RateLimit, LocalCounter } from '../src/rate_limit';
import { expect, should } from 'chai';
import { describe, it } from 'mocha';

function sleep(ms:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('local counter', () => {
    it('should reset after set period', (done) => {
        const counter = new LocalCounter(1);
        counter.tick().then(val => {
            expect(val).to.be.equal(1);
            sleep(2000).then(() => {
                counter.tick().then(val => {
                    expect(val).to.be.equal(1);
                    done();
                })
            });
        })
    }).timeout(5000);
})