import 'mocha';
import should from 'should';
import _ from 'the-lodash';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';
import { MyPromise } from 'the-promise';

describe('Redis client', () => {

    it('Constructor', () => {
        const client = new RedisClient(logger);
        client.run();

        client.close()
    })

    it('HandleConnect', () => {
        const client = new RedisClient(logger);

        let isConnected : boolean = false;
        let isMarkedConnected : boolean = false;
        client.handleConnect(() => {
            isConnected = true;
            isMarkedConnected = client.isConnected;
        })

        client.run();
        should(isConnected).be.false();

        return client.waitConnect()
            .then(() => {
                should(isConnected).be.true();
                should(isMarkedConnected).be.true();
                should(client.isConnected).be.true();
            })
            .then(() => client.close())
    });


    it('HandleDisconnect', () => {
        const client = new RedisClient(logger);

        client.run();

        return client.waitConnect()
            .then(() => {
                should(client.isConnected).be.true();
            })
            .then(() => client.close())
            .then(() => MyPromise.delay(1000))
            .then(() => {
                should(client.isConnected).be.false();
            })
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

        return client.waitConnect()
            .then(() => client.setValue('city:nyc', 'NYC'))
            .then(() => client.setValue('city:la', 'LA'))
            .then(() => client.setValue('city:moscow', 'Moscow'))
            .then(() => client.setValue('town:rostov', 'Rostov'))
            .then(() => MyPromise.delay(1000))
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

        return client.waitConnect()
            .then(() => {
                return MyPromise.serial(_.keys(expectedValues), x => {
                    return client.setValue(x, expectedValues[x]);
                })
            })
            .then(() => MyPromise.delay(1000))
            .then(() => client.filterValues('filter:*'))
            .then((keys) => {
                should(keys).be.an.Array()
                should((keys).length).be.equal(500)
            })
            .then(() => client.close())
    })
    .timeout(5000)

})
