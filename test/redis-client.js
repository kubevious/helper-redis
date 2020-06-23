const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('Redis client', () => {
    it('Constructor', () => {
        const client = new RedisClient(logger, null)

        client.closeConnection()
    })

    it('set value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('client', 'Danny')
            .then(res => res.should.be.equal('OK'))
            .then(() => client.closeConnection())
    })

    it('get value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('client', 'Danny')
            .then(() => client.getValue('client'))
            .then(result => result.should.be.equal('Danny'))
            .then(() => client.closeConnection())
    })

    it('delete value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('town', 'NYC')
            .then(() => client.deleteValue('town'))
            .then(() => client.getValue('town'))
            .then(res => should.equal(res, null))
            .then(() => client.closeConnection())
    })

    it('filter values keys', () => {
        const client = new RedisClient(logger, null)

        client.setValue('city:nyc', 'NYC')
        client.setValue('city:la', 'LA')
        client.setValue('city:moscow', 'Moscow')
        client.setValue('town:rostov', 'Rostov')

        client.filterValues('city:*', (keys) => {
            return keys
        })
            .then((keys) => {
                keys.should.be.an.Array()
                keys.length.should.be.equal(3)
            })
            .then(() => client.closeConnection())
    })

    it('pub-sub-test-1', () => {
        const publishClient = new RedisClient(logger, null)
        const subscribeClient = new RedisClient(logger, null)

        subscribeClient.subscribe('channel_one')
            .then(() => publishClient.publishMessage('channel_one', '1'))
            .then(() => publishClient.publishMessage('channel_two', '2'))
            .then(() => publishClient.publishMessage('channel_one', '3'))
            .then(() => Promise.timeout(1000))

            .then(() => subscribeClient.getMessageList())
            .then(list => (list.length).should.be.equal(2))
            .then(() => subscribeClient.unsubscribe('channel_one'))

            .then(() => publishClient.publishMessage('channel_one', '4'))
            .then(() => publishClient.publishMessage('channel_one', '5'))

            .then(() => subscribeClient.getMessageList())
            .then((list) => (list.length).should.be.equal(2))

            .then(() => publishClient.closeConnection())
            .then(() => subscribeClient.closeConnection())

            .catch(err => console.error(err))
    })
})
