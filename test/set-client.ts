import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('set-client', () => {

    it('add', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => setClient.members())
            .then(res => {
                should(res).be.eql(['item1']);
            })
            .then(() => client.close());
    })

    it('add-2', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(() => setClient.add(['item3', 'item2']))
            .then(() => setClient.add(['item2', 'item4']))
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(4);
            })
            .then(() => setClient.members())
            .then(res => {
                should(res.sort()).be.eql(['item1', 'item2', 'item3', 'item4']);
            })
            .then(() => client.close());
    })

    it('pop', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add('item1') )
            .then(() => setClient.add('item2') )
            .then(() => setClient.add('item3') )
            .then(() => setClient.pop() )
            .then(res => {
                should(res).startWith('item');
            })
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => client.close());
    })

    it('remove', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.add(['item1', 'item2', 'item3', 'item4']) )
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(4);
            })
            .then(() => setClient.remove('item3') )
            .then(() => setClient.remove(['item4', 'item1']) )
            .then(() => setClient.members())
            .then(res => {
                should(res.sort()).be.eql(['item2']);
            })
            .then(() => client.close());
    })

    it('non-existent-count', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.set('my-set');

        return Promise.resolve()
            .then(() => setClient.delete() )
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(0);
            })
            .then(() => client.close());
    })

    it('non-existent-members', () => {
        const client = new RedisClient(logger);
        client.run();

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