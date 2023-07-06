import 'mocha';
import should from 'should';
import _ from 'the-lodash';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('sorted-set-client', () => {

    it('add', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add({ score: 10, value: 'item1' }) )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(1);
            })
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item1']);
            })
            .then(() => client.close());
    })

    it('add-2', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add({ score: 10, value: 'item1' }) )
            .then(() => setClient.add([{ score: 5, value: 'item2' }, { score: 20, value: 'item3' }, ]) )
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item2', 'item1', 'item3']);
            })
            .then(() => client.close());
    })

    it('pop-min', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                { score: 10, value: 'item1' },
                { score: 5, value: 'item2' },
                { score: 20, value: 'item3' }, ])
            )
            .then(() => setClient.popMin() )
            .then(res => {
                should(res).be.eql({ value: 'item2', score: '5'});
            })
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item1', 'item3']);
            })
            .then(() => client.close());
    })

    it('pop-min-empty', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.popMin() )
            .then(res => {
                should(res).be.null();
            })
            .then(() => client.close());
    })

    it('pop-max', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                { score: 10, value: 'item1' },
                { score: 5, value: 'item2' },
                { score: 20, value: 'item3' }, ])
            )
            .then(() => setClient.popMax() )
            .then(res => {
                should(res).be.eql({ value: 'item3', score: '20'});
            })
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item2', 'item1']);
            })
            .then(() => client.close());
    })

    it('pop-max-empty', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.popMax() )
            .then(res => {
                should(res).be.null();
            })
            .then(() => client.close());
    })
    
    it('remove', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                { score: 10, value: 'item1' },
                { score: 5, value: 'item2' },
                { score: 20, value: 'item3' }, ])
            )
            .then(() => setClient.remove('item1') )
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(2);
            })
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item2', 'item3']);
            })
            .then(() => client.close());
    })

    it('remove-2', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                { score: 10, value: 'item1' },
                { score: 5, value: 'item2' },
                { score: 20, value: 'item3' }, ])
            )
            .then(() => setClient.remove(['item1', 'item2']) )
            .then(() => setClient.range())
            .then(res => {
                should(res).be.eql(['item3']);
            })
            .then(() => client.close());
    })
    .timeout(50 * 1000)

    it('count', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                { score: 10, value: 'item1' },
                { score: 5, value: 'item2' },
                { score: 20, value: 'item3' }, ])
            )
            .then(() => setClient.count())
            .then(res => {
                should(res).be.equal(3);
            })
            .then(() => client.close());
    })

    it('count-non-existent', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.count() )
            .then(res => {
                should(res).be.equal(0);
            })
            .then(() => client.close());
    })

    it('range-with-scores', () => {
        const client = new RedisClient(logger);
        client.run();

        const setClient = client.sortedSet('my-set');

        return client.waitConnect()
            .then(() => setClient.delete() )
            .then(() => setClient.add([
                    { score: 10, value: 'item1' },
                    { score: 5, value: 'item2' },
                    { score: 20, value: 'item3' } 
                ])
            )
            .then(() => setClient.rangeWithScores())
            .then(res => {
                should(res).be.eql([
                    { score: '5', value: 'item2' },
                    { score: '10', value: 'item1' },
                    { score: '20', value: 'item3' } 
                ]);
            })
            .then(() => client.close());
    })
})