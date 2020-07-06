const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('Redis client', () => {
    it('Constructor', () => {
        const client = new RedisClient(logger, null)

        client.close()
    })

    it('set value', () => {
        const client = new RedisClient(logger, null)

        return client.setValue('client', 'Danny')
            .then(res => res.should.be.equal('OK'))
            .then(() => client.close())
    })

    it('get value', () => {
        const client = new RedisClient(logger, null)

        return client.setValue('client', 'Danny')
            .then(() => client.getValue('client'))
            .then(result => result.should.be.equal('Danny'))
            .then(() => client.close())
    })

    it('delete value', () => {
        const client = new RedisClient(logger, null)

        return client.setValue('town', 'NYC')
            .then(() => client.deleteValue('town'))
            .then(() => client.getValue('town'))
            .then(res => should.equal(res, null))
            .then(() => client.close())
    })

    it('filter values keys', () => {
        const client = new RedisClient(logger, null)

        return Promise.resolve()
            .then(() => client.setValue('city:nyc', 'NYC'))
            .then(() => client.setValue('city:la', 'LA'))
            .then(() => client.setValue('city:moscow', 'Moscow'))
            .then(() => client.setValue('town:rostov', 'Rostov'))
            .then(() => client.filterValues('city:*', (keys) => {
                return keys
            }))
            .then((keys) => {
                keys.should.be.an.Array()
                keys.length.should.be.equal(3)
            })
            .then(() => client.close())
    })

    it('pub-sub-test-1', () => {
        const publishClient = new RedisClient(logger, null)
        const subscribeClient = new RedisClient(logger, null)

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
