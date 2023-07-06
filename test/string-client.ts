import 'mocha';
import should from 'should';
import _ from 'the-lodash';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';
import { MyPromise } from 'the-promise';

describe('string-client', () => {

    it('set', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-key');

        return client.waitConnect()
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

        return client.waitConnect()
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

        return client.waitConnect()
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

        return client.waitConnect()
            .then(() => stringClient.delete() )
            .then(() => stringClient.exists() )
            .then(res => {
                (res).should.be.false();
            })
            .then(() => client.close());
    })


    it('ttl-no-expiration', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-str-key-2');

        return stringClient.set('test-1234')
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(false);
                should(res.ttlSeconds).be.equal(0);
            })
            .then(() => client.close())
    })

    it('ttl-expiration-with-expire', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-str-key-3');

        return stringClient.set('test-1234')
            .then(() => stringClient.expire(10) )
            .then(res => {
                should(res).be.equal(true);
            })
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(true);
                should(res.ttlSeconds).be.Number().and.greaterThanOrEqual(8).and.lessThanOrEqual(10);
            })
            .then(() => MyPromise.delay(3 * 1000))
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(true);
                should(res.ttlSeconds).be.Number().and.greaterThanOrEqual(5).and.lessThanOrEqual(7);
            })
            .then(() => {
                logger.info("Waiting key to expire...");
                return MyPromise.delay(9 * 1000)
            })
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(false);
                should(res.hasExpiration).be.equal(false);
                should(res.ttlSeconds).be.equal(0);
            })
            .then(() => client.close())
    }).timeout(15 * 1000)

    it('ttl-create-with-expiration', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-str-key-4');

        return stringClient.set('test-1234', { expireSeconds: 60 })
            .then(() => MyPromise.delay(2000))
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(true);
                should(res.ttlSeconds).be.Number().and.greaterThanOrEqual(50).and.lessThanOrEqual(60);
            })
            .then(() => stringClient.set('test-6789'))
            .then(() => stringClient.ttl() )
            .then(res => {
                should(res.exists).be.equal(true);
                should(res.hasExpiration).be.equal(false);
                should(res.ttlSeconds).be.equal(0);
            })
            .then(() => client.close())
    }).timeout(10 * 1000)

    it('expire-non-existing', () => {
        const client = new RedisClient(logger);
        client.run();

        const stringClient = client.string('my-str-key-not-existing');

        return stringClient.expire(10)
            .then(res => {
                should(res).be.equal(false);
            })
            .then(() => client.close())
    })

})