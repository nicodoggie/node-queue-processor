import { v1 } from '@google-cloud/pubsub';
const { SubscriberClient, PublisherClient } = v1;

import { get } from 'lodash';
import { QueueModel } from './abstract_queue';
import { Message } from '../message';

import { logger } from '../logger';

interface PublishMessageType {
    type: string;
}

interface PublishMessage {
    data: Buffer,
    attributes: PublishMessageType
}

class GooglePubsubQueue extends QueueModel {
    private subClient:any;
    private pubClient:any;
    private subscription:any;
    private topic:any;
    private messageParser: (type:PublishMessageType, data:Buffer) => Message; 
    private messageFormatter: (type:PublishMessageType, data:Buffer) => PublishMessage;

    constructor (
        projectId: string,
        keyfile: string,
        subscription: string,
        topic: string,
        messageParser: (type:PublishMessageType, data:Buffer) => Message = (type:PublishMessageType, data:Buffer) => {
            return new Message(get(type,'type'), JSON.parse(data.toString()));
        },
        messageFormatter: (type:PublishMessageType, data:Buffer) => PublishMessage = (type:PublishMessageType, data:Buffer) => {
            return {
                data: data,
                attributes: type,
            };
        },
    ) {
        super();
        this.subClient = new SubscriberClient({
            projectId,
            keyFilename: keyfile
        });
        this.pubClient = new PublisherClient({
            projectId,
            keyFilename: keyfile
        });
        this.subscription = this.subClient.subscriptionPath(projectId, subscription);
        this.topic = this.pubClient.projectTopicPath(projectId, topic);
        this.messageParser = messageParser;
        this.messageFormatter = messageFormatter;
    }

    async ack(id:string) {
        logger.child({ name: 'pubsub' }).trace('acknowledge', { id });
        return await this.subClient.acknowledge({
            subscription: this.subscription,
            ackIds: [ id ],
        });
    }

    async pull() {
        logger.child({ name: 'pubsub' }).trace('pulling from google subscription');
        const [ response ] = await this.subClient.pull({
            subscription: this.subscription,
            maxMessages: 1,
        });

        logger.child({ name: 'pubsub' }).trace('pull response', response);
        const { receivedMessages } = response;

        if (receivedMessages.length == 0) {
            logger.child({ name: 'pubsub' }).trace('messages empty');
            return null;
        }

        const [ { ackId, message: { attributes, data } } ] = receivedMessages;
        await this.ack(ackId);

        return this.messageParser(attributes, data);
    }

    async push(type:string, data:object) {
        logger.child({ name: 'pubsub' }).trace('republish data');
        return await this.pubClient.publish({
            topic: this.topic,
            messages: [
                this.messageFormatter(
                    { type }, 
                    Buffer.from(JSON.stringify(data))
                )
            ]
        });
    }
}

export {
    GooglePubsubQueue
}