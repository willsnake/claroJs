# Message Queueing

Using a message queueing solution with Redis (without any kind of message protocol), we are simulating the operation of a *Message Queueing* service as AWS SQS, ActiveMQ or RabbitMQ.

## Justification

Redis natively supports implementations of `Pub/Sub` messaging pattern. We had a message queueing and message filtering problems, that's is why we use a messaging pattern like `fanout` without using `Pub/Sub`. We using a module that uses `lpush` method to add a message to a list (i.e. push a message to a queue) and creates a worker to listen a queue using `brpop` to get a message and delete it after has been received by an event listener. It's a simple queue solution.

## Usage

`store.js`

```js
const Queue = require('../lib/simple-queue')
const queue = new Queue({
  prefix: 'store1',
  redis: {}
})

queue.pull('product.create', function * (queue) {
  // Do something
  console.log(queue.data)

  return { message: 'OK' }
})
.on('completed', console.log)
.on('failed', console.error)
```

`core.js`

```js
const Queue = require('../lib/simple-queue')
const queue = new Queue({
  prefix: 'core',
  redis: {}
})

queue.push('product.create', {
  prefix: 'store1',
  model: {}
})

// Responses
queue.pull('product.create.done', function * (queue) {
  console.log(queue.data.message) // OK
})
queue.pull('product.create.fail', function * () {})
```
