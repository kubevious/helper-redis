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

    it('delete-value', () => {
        const client = new RedisClient(logger);
        client.run();

        return client.setValue('town', 'NYC')
            .then(() => client.deleteValue('town'))
            .then(() => client.getValue('town'))
            .then(res => should.equal(res, null))
            .then(() => client.close())
    })

    it('filter-values-keys-small', () => {
        const client = new RedisClient(logger);
        client.run();

        return Promise.resolve()
            .then(() => client.setValue('city:nyc', 'NYC'))
            .then(() => client.setValue('city:la', 'LA'))
            .then(() => client.setValue('city:moscow', 'Moscow'))
            .then(() => client.setValue('town:rostov', 'Rostov'))
            .then(() => Promise.timeout(1000))
            .then(() => client.filterValues('city:*'))
            .then((keys) => {
                console.log(keys);
                should(keys).be.an.Array()
                should((<any[]>keys).length).be.equal(3)
            })
            .then(() => client.close())
    })
    .timeout(5000)

    it('filter-values-keys-big', () => {
        const client = new RedisClient(logger);
        client.run();

        const expectedValues : Record<string, string> = {};
        for(let i = 1; i <= 500; i++) {
            expectedValues['filter:mykey' + i] = 'myvalue' + i;
        }

        return Promise.resolve()
            .then(() => {
                return Promise.serial(_.keys(expectedValues), x => {
                    return client.setValue(x, expectedValues[x]);
                })
            })
            .then(() => Promise.timeout(1000))
            .then(() => client.filterValues('filter:*'))
            .then((keys) => {
                should(keys).be.an.Array()
                should((keys).length).be.equal(500)
            })
            .then(() => client.close())
    })
    .timeout(5000)

})
