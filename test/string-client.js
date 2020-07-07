const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('string-client', () => {

    it('set', () => {
        const client = new RedisClient(logger, null)

        const stringClient = client.string('my-key');

        return Promise.resolve()
            .then(() => stringClient.delete() )
            .then(() => stringClient.set('my-value'))
            .then(() => stringClient.get() )
            .then(res => {
                (res).should.be.equal('my-value');
            })
            .then(() => client.close());
    })

    it('delete', () => {
        const client = new RedisClient(logger, null)

        const stringClient = client.string('my-key');

        return Promise.resolve()
            .then(() => stringClient.delete() )
            .then(() => stringClient.set('my-value'))
            .then(() => stringClient.delete() )
            .then(() => stringClient.get() )
            .then(res => {
                should(res).be.null();
            })
            .then(() => client.close());
    })


    it('exists-1', () => {
        const client = new RedisClient(logger, null)

        const stringClient = client.string('my-key');

        return Promise.resolve()
            .then(() => stringClient.delete() )
            .then(() => stringClient.set('my-value'))
            .then(() => stringClient.exists() )
            .then(res => {
                (res).should.be.true();
            })
            .then(() => client.close());
    })

    it('exists-2', () => {
        const client = new RedisClient(logger, null)

        const stringClient = client.string('my-key');

        return Promise.resolve()
            .then(() => stringClient.delete() )
            .then(() => stringClient.exists() )
            .then(res => {
                (res).should.be.false();
            })
            .then(() => client.close());
    })

})