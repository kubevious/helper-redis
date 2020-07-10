const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('Redis client', () => {

    it('Constructor', () => {
        const client = new RedisClient(logger, null);
        client.run();

        client.close()
    })

    it('set value', () => {
        const client = new RedisClient(logger, null);
        client.run();

        return client.setValue('client', 'Danny')
            .then(res => res.should.be.equal('OK'))
            .then(() => client.close())
    })

    it('get value', () => {
        const client = new RedisClient(logger, null);
        client.run();

        return client.setValue('client', 'Danny')
            .then(() => client.getValue('client'))
            .then(result => result.should.be.equal('Danny'))
            .then(() => client.close())
    })

    it('delete value', () => {
        const client = new RedisClient(logger, null);
        client.run();

        return client.setValue('town', 'NYC')
            .then(() => client.deleteValue('town'))
            .then(() => client.getValue('town'))
            .then(res => should.equal(res, null))
            .then(() => client.close())
    })

    it('filter values keys', () => {
        const client = new RedisClient(logger, null);
        client.run();

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

})
