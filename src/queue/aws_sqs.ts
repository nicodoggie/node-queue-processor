import * as AWS from 'aws-sdk';

import { get } from 'lodash';
import { QueueModel } from './abstract_queue';
import { Message } from '../message';

import { logger } from '../logger';

import { PublishMessage, PublishMessageType } from './publish_message';

interface AWSCredentials {
    access_key: string,
    secret_access_key: string,
}

class AwsSqsQueue extends QueueModel {
    private sqsClient:any;
    private queueUrl:string;
    private messageParser: (type:PublishMessageType, data:Buffer) => Message; 

    constructor (
        credentials: AWSCredentials,
        queueUrl: string,
        region: string,
        version: string = '2012-11-05',
        messageParser: (type:PublishMessageType, data:Buffer) => Message = (type:PublishMessageType, data:Buffer) => {
            return new Message(get(type,'type'), JSON.parse(data.toString()));
        },
    ) {
        super();
        this.queueUrl = queueUrl;
        this.sqsClient = new AWS.SQS({
            accessKeyId: credentials.access_key,
            secretAccessKey: credentials.secret_access_key,
            region: region,
            apiVersion: version,
        })
        this.messageParser = messageParser;
    }

    async pull() {
        logger.child({ name: 'sqs' }).trace('pulling from aws sqs');
        const request = this.sqsClient.receiveMessage({
            QueueUrl: this.queueUrl,
            AttributeNames: [ 'All' ],
            MessageAttributeNames: [ 'All' ],
            MaxNumberOfMessages: '1', // one message at a time
            WaitTimeSeconds: 20, // enable long polling
        });
        const response = await request.promise();

        logger.child({ name: 'sqs' }).trace('pull response', response);
        const { Messages: receivedMessages = [] } = response;

        if (receivedMessages.length == 0) {
            logger.child({ name: 'sqs' }).trace('messages empty'); 
            return null;
        }
        
        logger.child({ name: 'sqs' }).trace(receivedMessages);

        const [ { ReceiptHandle, Body: data, MessageAttributes: attributes = {} } ] = receivedMessages;

        // remove from queue
        await this.sqsClient.deleteMessage({
            QueueUrl: this.queueUrl,
            ReceiptHandle
        }).promise();
        
        return this.messageParser({ type: get(attributes,'type.StringValue', '') as string }, Buffer.from(data));
    }

    async push(type:string, data:object) {
        const request = this.sqsClient.sendMessage({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(data),
            MessageAttributes: {
                type: {
                    DataType: "String",
                    StringValue: type,
                }
            }
        });
        return await request.promise();
    }
}

export {
    AwsSqsQueue
}