# Queue Processor
Built on NodeJS. This application will process queue messages.

## Features
- Use different queues
- Rate limit work process

## Supported Queues
- Google Pub/Sub
- Redis ***soon**

# Sample
```js
const { Manager, Worker, RateLimit } = require('node-queue-processor');
const config = require('../config');
const Queue = new PubsubQueue(
    config.projectId,
    config.keyfile,
    config.subscription,
    config.topic
);

async function main() {
    
    const manager = new Manager(Queue);
    const worker = new Worker(async (data) => {
        console.log(data);
        return 'done';
    }, new RateLimit({
        process_per_period: 5, // 5 requests
        period: 60, // per 60 seconds
    }, {
        id: 'test',
        redisConnection: {
            host: '127.0.0.1',
            port: 6379
        }
    }));

    // attach handlers
    manager.attachWorker('sample-handler', worker);

    manager.start();
}

main();
```