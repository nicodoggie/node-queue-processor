import { Manager } from '../src/manager';
import { QueueModel } from '../src/queue/abstract_queue';
import { Worker } from '../src/worker';
import { RateLimit } from '../src/rate_limit';
import { Message } from '../src/message';
import { expect } from 'chai';
import { describe, it } from 'mocha';

class DummyQueue extends QueueModel {
    pull() {
        return new Promise((res, rej) => {
            res(true);
        });
    }
    
    push() {
        return new Promise((res, rej) => {
            res(true);
        });
    }
}

describe('manager class', () => { 
    it('should save details from creation', () => { 
        const instance = new Manager(new DummyQueue(), true);
        expect(instance.getQueue() instanceof DummyQueue).to.equal(true);
        expect(instance.canRunMultiple()).to.equal(true);
    });

    it('should save details from creation', () => { 
        const instance = new Manager(new DummyQueue(), true);
        expect(instance.getQueue() instanceof DummyQueue).to.equal(true);
        expect(instance.canRunMultiple()).to.equal(true);
    });

    it('should attach a worker successfully', () => {
        const processor:any = async (data:any) => {
            return true;
        };
        const worker = new Worker(processor);
        const instance = new Manager(new DummyQueue(), true);
        instance.attachWorker('test', worker);

        expect(instance.retrieveWorker('test') instanceof Worker).to.equal(true);
    });

    it('should run a worker successfully', () => {
        const messageData = { sample: true };
        class TestQueue extends QueueModel {
            pull() {
                return new Promise((res, rej) => {
                    res(new Message('test', messageData));
                });
            }
            push() {
                return new Promise((res, rej) => {
                    res(new Message('test', messageData));
                });
            }
        }

        const processor:any = async (data:any) => {
            expect(data).to.equal(messageData);
        };
        const worker = new Worker(processor);
        const instance = new Manager(new TestQueue());
        instance.attachWorker('test', worker);
        instance.start(2);
    });

    it('should retry failed processing', () => {
        const messageData = { sample: true };
        class TestQueue extends QueueModel {
            pull() {
                return new Promise((res, rej) => {
                    res(new Message('test-retry', messageData));
                });
            }
            push(type:string, data:object) {
                return new Promise((res, rej) => {
                    expect(type).to.equal('test-retry');
                    expect(data).to.equal({ sample: true });
                    res(true);
                });
            }
        }

        const processor:any = async (data:any) => {
            expect(data).to.equal(messageData);
        };
        const worker = new Worker(processor);
        const instance = new Manager(new TestQueue());
        instance.attachWorker('test-retry', worker);
        instance.start(1);
    });

    it('should trigger rate limit', () => {
        const messageData = { sample: true };
        class TestQueue extends QueueModel {
            pull() {
                return new Promise((res, rej) => {
                    res(new Message('test-retry', messageData));
                });
            }
            push(type:string, data:object) {
                return new Promise((res, rej) => {
                    res(true);
                });
            }
        }

        const processor:any = async (data:any) => {
            expect(data).to.equal(messageData);
        };
        const worker = new Worker(
            processor,
            new RateLimit({
                process_per_period: 2,
                period: 5,
            })
        );
        const instance = new Manager(new TestQueue());
        instance.attachWorker('test-retry', worker);
        instance.start(5);
    });

    it('should trigger rate limit from redis', () => {
        const messageData = { sample: true };
        class TestQueue extends QueueModel {
            pull() {
                return new Promise((res, rej) => {
                    res(new Message('test-retry', messageData));
                });
            }
            push(type:string, data:object) {
                return new Promise((res, rej) => {
                    res(true);
                });
            }
        }

        const processor:any = async (data:any) => {
            expect(data).to.equal(messageData);
        };
        const worker = new Worker(
            processor,
            new RateLimit({
                process_per_period: 3,
                period: 5,
            })
        );
        const instance = new Manager(new TestQueue());
        instance.attachWorker('test-retry', worker);
        instance.start(5);
    });
});