const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('list-client', () => {

    it('push', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item1']);
            })
            .then(() => client.close());
    })

    it('push-2', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => listClient.push('item2') )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item2', 'item1']);
            })
            .then(() => client.close());
    })

    it('push-right', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                (res).should.be.equal(1);
            })
            .then(() => listClient.pushRight('item2') )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item1', 'item2']);
            })
            .then(() => client.close());
    })

    it('set', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                (res).should.be.equal(3);
            })
            .then(() => listClient.set(1, 'item4') )
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(3);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item3', 'item4', 'item1']);
            })
            .then(() => client.close());
    })

    it('pop', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                (res).should.be.equal(3);
            })
            .then(() => listClient.pop() )
            .then(res => {
                (res).should.be.equal('item3');
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item2', 'item1']);
            })
            .then(() => client.close());
    })

    it('pop-right', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                (res).should.be.equal(3);
            })
            .then(() => listClient.popRight() )
            .then(res => {
                (res).should.be.equal('item1');
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item3', 'item2']);
            })
            .then(() => client.close());
    })

    it('range', () => {
        const client = new RedisClient(logger, null)

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => {
                return Promise.serial(Array.from({length: 200}, (x, i) => i), x => {
                    listClient.push('item' + (x+1));
                })
            })
            .then(() => listClient.count() )
            .then(res => {
                (res).should.be.equal(200);
            })
            .then(() => listClient.range(0, 4))
            .then(res => {
                should(res).be.eql(['item200', 'item199', 'item198', 'item197', 'item196']);
            })
            .then(() => listClient.range(-5, -1))
            .then(res => {
                should(res).be.eql(['item5', 'item4', 'item3', 'item2', 'item1']);
            })
            .then(() => client.close());
    })


})