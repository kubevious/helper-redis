const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('pub-sub', () => {
    
    it('test-1', () => {
        const publishClient = new RedisClient(logger, null);
        publishClient.run();
        const subscribeClient = new RedisClient(logger, null);
        subscribeClient.run();

        var subscription = null;
        var messages = [];

        return Promise.resolve()
            .then(() => {
                subscription = subscribeClient.subscribe('channel_one', (message) => {
                    messages.push(message);
                })
            })

            .then(() => Promise.timeout(100))
            .then(() => publishClient.publishMessage('channel_one', '1'))
            .then(() => publishClient.publishMessage('channel_two', '2'))
            .then(() => publishClient.publishMessage('channel_one', '3'))
            .then(() => Promise.timeout(100))

            .then(() => {
                (messages.length).should.be.equal(2)
                should(messages.sort()).be.eql(['1', '3'].sort())
            })
            
            .then(() => subscription.close())

            .then(() => Promise.timeout(100))
            .then(() => publishClient.publishMessage('channel_one', '4'))
            .then(() => publishClient.publishMessage('channel_one', '5'))
            .then(() => Promise.timeout(100))

            .then(() => {
                (messages.length).should.be.equal(2)
                should(messages.sort()).be.eql(['1', '3'].sort())
            })

            .then(() => publishClient.close())
            .then(() => subscribeClient.close())
    })
})
