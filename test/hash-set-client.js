const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('hash-set-client', () => {

    it('set', () => {
        const client = new RedisClient(logger, null)
        client.run();

        const hashSetClient = client.hashSet('my-obj');

        return Promise.resolve()
            .then(() => hashSetClient.delete() )
            .then(() => hashSetClient.set({
                name: 'car',
                kind: 'mb'
            }))
            .then(() => hashSetClient.get() )
            .then(res => {
                (res).should.be.eql({
                    name: 'car',
                    kind: 'mb'
                });
            })
            .then(() => client.close());
    })

    it('get-field', () => {
        const client = new RedisClient(logger, null)
        client.run();

        const hashSetClient = client.hashSet('my-obj');

        return Promise.resolve()
            .then(() => hashSetClient.delete() )
            .then(() => hashSetClient.set({
                name: 'car',
                kind: 'mb'
            }))
            .then(() => hashSetClient.getField('kind') )
            .then(res => {
                (res).should.be.equal('mb');
            })
            .then(() => client.close());
    })

    it('remove-field', () => {
        const client = new RedisClient(logger, null)
        client.run();

        const hashSetClient = client.hashSet('my-obj');

        return Promise.resolve()
            .then(() => hashSetClient.delete() )
            .then(() => hashSetClient.set({
                name: 'car',
                kind: 'mb'
            }))
            .then(() => hashSetClient.removeField('kind') )
            .then(() => hashSetClient.get() )
            .then(res => {
                (res).should.be.eql({
                    name: 'car'
                });
            })
            .then(() => client.close());
    })

    it('keys', () => {
        const client = new RedisClient(logger, null)
        client.run();

        const hashSetClient = client.hashSet('my-obj');

        return Promise.resolve()
            .then(() => hashSetClient.delete() )
            .then(() => hashSetClient.set({
                name: 'car',
                kind: 'mb'
            }))
            .then(() => hashSetClient.keys() )
            .then(res => {
                (res).should.be.eql(['name', 'kind']);
            })
            .then(() => client.close());
    })

    it('key-count', () => {
        const client = new RedisClient(logger, null);
        client.run();

        const hashSetClient = client.hashSet('my-obj');

        return Promise.resolve()
            .then(() => hashSetClient.delete() )
            .then(() => hashSetClient.set({
                name: 'car',
                kind: 'mb'
            }))
            .then(() => hashSetClient.keyCount() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => client.close());
    })

})