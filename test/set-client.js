const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('set-client', () => {

    it('add', () => {
        const client = new RedisClient(logger, null)

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => setClient.count() )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => setClient.members())
            .then(res => {
                should(res).be.eql(['item1']);
            })
            .then(() => client.close());
    })

    it('add-2', () => {
        const client = new RedisClient(logger, null)

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(() => setClient.add(['item3', 'item2']))
            .then(() => setClient.add(['item2', 'item4']))
            .then(() => setClient.count() )
            .then(res => {
                (res).should.be.equal(4);
            })
            .then(() => setClient.members())
            .then(res => {
                should(res.sort()).be.eql(['item1', 'item2', 'item3', 'item4']);
            })
            .then(() => client.close());
    })

    it('pop', () => {
        const client = new RedisClient(logger, null)

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(() => setClient.add('item2') )
            .then(() => setClient.add('item3') )
            .then(() => setClient.pop() )
            .then(res => {
                (res).should.startWith('item');
            })
            .then(() => setClient.count() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => client.close());
    })

    it('non-existent-count', () => {
        const client = new RedisClient(logger, null)

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.count() )
            .then(res => {
                (res).should.be.equal(0);
            })
            .then(() => client.close());
    })

    it('non-existent-range', () => {
        const client = new RedisClient(logger, null)

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.members())
            .then(res => {
                should(res).be.eql([]);
            })
            .then(() => client.close());
    })

})