import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';


describe('list-client', () => {

    it('push', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item1']);
            })
            .then(() => client.close());
    })

    it('push-2', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => listClient.push(['item2', 'item3']) )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item3', 'item2', 'item1']);
            })
            .then(() => client.close());
    })

    it('push-right', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => listClient.pushRight('item2') )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item1', 'item2']);
            })
            .then(() => client.close());
    })

    it('set', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.set(1, 'item4') )
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item3', 'item4', 'item1']);
            })
            .then(() => client.close());
    })

    it('pop', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.pop() )
            .then(res => {
                should(res).be.equal('item3');
            })
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item2', 'item1']);
            })
            .then(() => client.close());
    })

    it('pop-right', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item1') )
            .then(() => listClient.push('item2') )
            .then(() => listClient.push('item3') )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => listClient.popRight() )
            .then(res => {
                should(res).be.equal('item1');
            })
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => listClient.range(0, 100))
            .then(res => {
                should(res).be.eql(['item3', 'item2']);
            })
            .then(() => client.close());
    })

    it('range', () => {
        const client = new RedisClient(logger);
        client.run();

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
                should(res).be.equal(200);
            })
            .then(() => listClient.range(0, 4))
            .then(res => {
                should(res).be.eql(['item200', 'item199', 'item198', 'item197', 'item196']);
            })
            .then(() => listClient.range(-5, -1))
            .then(res => {
                should(res).be.eql(['item5', 'item4', 'item3', 'item2', 'item1']);
            })
            .then(() => listClient.range(0, -1))
            .then(res => {
                should(res.length).be.equal(200);
            })
            .then(() => listClient.range())
            .then(res => {
                should(res.length).be.equal(200);
            })
            .then(() => client.close());
    })


    it('non-existent-count', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.count() )
            .then(res => {
                should(res).be.equal(0);
            })
            .then(() => client.close());
    })


    it('non-existent-range', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');

        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.range(0, 100) )
            .then(res => {
                should(res).be.eql([]);
            })
            .then(() => client.close());
    })


    it('ttl-no-expiration', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list');
        
        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item-1') )
            .then(() => listClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(false);
                should(res.ttlSeconds).be.equal(0);
            })
            .then(() => client.close())
    })


    it('ttl-expiration', () => {
        const client = new RedisClient(logger);
        client.run();

        const listClient = client.list('my-list-exp');
        
        return Promise.resolve()
            .then(() => listClient.delete() )
            .then(() => listClient.push('item-1') )
            .then(() => listClient.expire(22) )
            .then(() => listClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(true);
                should(res.ttlSeconds).be.Number().and.greaterThanOrEqual(20).and.lessThanOrEqual(22);
            })
            .then(() => listClient.push('item-2') )
            .then(() => listClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(true);
                should(res.ttlSeconds).be.Number().and.greaterThanOrEqual(20).and.lessThanOrEqual(22);
            })
            .then(() => client.close())
    })

})