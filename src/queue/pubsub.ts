const { PubSub } = require('@google-cloud/pubsub');

import { get } from 'lodash';
import { QueueModel } from './abstract_queue';
import { Message } from '../message';

import { logger } from '../logger';

class PubsubQueue extends QueueModel {
    private client:any;
    private subscription:any;
    private topic:any;
    private messageParser: (attributes:object, data:any) => Message; 

    constructor (
        projectId: string,
        keyfile: string,
        subscription: string,
        topic: string,
        messageParser: (attributes:object, data:any) => Message = (attributes:object, data:any) => {
            return new Message(get(attributes,'type'), JSON.parse(data));
        }
    ) {
        super();
        this.client = new PubSub({
            projectId,
            keyFilename: keyfile
        });
        this.topic = this.client.topic(topic);
        this.subscription = this.topic.subscription(subscription);
        this.subscription.on('error', (error:Error) => { 
            logger.child('pubsub' as any).error(error)
        });
        this.messageParser = messageParser
    }

    pull() {
        const messageParser = this.messageParser;
        return new Promise((res:any, rej:any) => {
            this.subscription.on('message', (message:any) => {
                try {
                    // remove from queue
                    message.ack();
                    res(messageParser(message.attributes, message.data));
                } catch (error) {
                    // return error
                    rej(error);
                }
            });
        });
    }

    push(type:string, data:object) {
        return new Promise((res:any, rej:any) => {
            this.topic.publish(Buffer.from(JSON.stringify(data)), { type }).then(res).catch(rej);
        });
    }
}

export {
    PubsubQueue
}