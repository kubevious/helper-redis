const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require("../lib/redis-client")

describe('Redis client', () => {
    it('Constructor', () => {
        const redisClient = new RedisClient(logger, null)
    })

    it('set and get values', () => {
        const client = new RedisClient(logger, null)

        client.setValue('client', 'Danny')

        const result = client.getValue('client')

        result.then(data => {
            (data).should.be.equal('Danny');
        })
    })

    it('delete value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('town', 'NYC')

        client.deleteValue('town')

        const result = client.getValue('town')

        result.then((data) => {
            should.equal(data, null)
        })
    })

    it('subsribe client', () => {
        const subsriber = new RedisClient(logger, null)

        subsriber.subscribe('subscriber')

        subsriber.subscribersList()
    })
})