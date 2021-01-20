import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';


describe('hash-set-client', () => {

    it('set', () => {
        const client = new RedisClient(logger)
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
                should(res).be.eql({
                    name: 'car',
                    kind: 'mb'
                });
            })
            .then(() => client.close());
    })

    it('get-field', () => {
        const client = new RedisClient(logger)
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
                should(res).be.equal('mb');
            })
            .then(() => client.close());
    })

    it('remove-field', () => {
        const client = new RedisClient(logger)
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
                should(res).be.eql({
                    name: 'car'
                });
            })
            .then(() => client.close());
    })

    it('keys', () => {
        const client = new RedisClient(logger)
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
                should(res).be.eql(['name', 'kind']);
            })
            .then(() => client.close());
    })

    it('key-count', () => {
        const client = new RedisClient(logger);
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
                should(res).be.equal(2);
            })
            .then(() => client.close());
    })

})