import { Message } from '../src/message';
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('message class', () => { 
    it('should save details from creation', () => { 
        const name = 'sample-name';
        const data = { test: true };
        const instance = new Message(name, data);
        expect(instance.getName()).to.equal(name);
        expect(instance.getData()).to.equal(data);
    });
});