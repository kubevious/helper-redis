import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('string-client', () => {

    it('set', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-key');

        return Promise.resolve()
            .then(() => stringClient.delete() )
            .then(() => stringClient.set('my-value'))
            .then(() => stringClient.get() )
            .then(res => {
                should(res).be.equal('my-value');
            })
            .then(() => client.close());
    })

    it('delete', () => {
        const client = new RedisClient(logger);
        client.run();

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
        const client = new RedisClient(logger);
        client.run();

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
        const client = new RedisClient(logger);
        client.run();

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