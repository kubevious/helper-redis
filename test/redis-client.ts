import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('Redis client', () => {

    it('Constructor', () => {
        const client = new RedisClient(logger);
        client.run();

        client.close()
    })

    it('set value', () => {
        const client = new RedisClient(logger);
        client.run();

        return client.setValue('client', 'Danny')
            .then(res => should(res).be.equal('OK'))
            .then(() => client.close())
    })

    it('get value', () => {
        const client = new RedisClient(logger);
        client.run();

        return client.setValue('client', 'Danny')
            .then(() => client.getValue('client'))
            .then(result => should(result).be.equal('Danny'))
            .then(() => client.close())
    })

    it('delete value', () => {
        const client = new RedisClient(logger);
        client.run();

        return client.setValue('town', 'NYC')
            .then(() => client.deleteValue('town'))
            .then(() => client.getValue('town'))
            .then(res => should.equal(res, null))
            .then(() => client.close())
    })

    it('filter values keys', () => {
        const client = new RedisClient(logger);
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
                should(keys).be.an.Array()
                should((<any[]>keys).length).be.equal(3)
            })
            .then(() => client.close())
    })

})
