import 'mocha';
import should from 'should';
import _ from 'the-lodash';
import { MyPromise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('redisearch', () => {

    it('run-search-1', () => {
        const client = new RedisClient(logger);
        client.run();

        const tenants = [ 'coke', 'pepsi' ];
        const apps = ['foo', 'bar', 'elephant', 'elegant'];

        const items : any[] = [];
        for(const tenant of tenants)
        {
            for(const app of apps)
            {
                items.push({
                    id: `tenant:${tenant}:app:${app}`,
                    tenant: tenant,
                    app: app,
                    kind: 'abcd'
                })
            }
        }

        const redisSearchIndexClient = client.redisearch.index('index.test');

        return client.waitConnect()
            .then(() => {
                return MyPromise.serial(items, item => {
                    return client.hashSet(item.id).set(item);
                })            
            })
            .then(() => {
                return redisSearchIndexClient.delete();
            })
            .then(() => {
                return redisSearchIndexClient.create({
                    count: 1,
                    prefix: 'tenant:'
                }, [
                    {
                        name: 'tenant' 
                    },
                    {
                        name: 'app'
                    },
                    {
                        name: 'kind',
                        type: 'TAG'
                    },
                ])
            })
            .then(() => MyPromise.delay(300))
            .then(() => redisSearchIndexClient.search('foo'))
            .then(result => {
                should(result.items.length).be.equal(2);
            })
            .then(() => redisSearchIndexClient.search('@tenant:pepsi @app:bar'))
            .then(result => {
                should(result.items.length).be.equal(1);
                should(result.items[0].key).be.equal('tenant:pepsi:app:bar');
                should(result.items[0].value.id).be.equal('tenant:pepsi:app:bar');
            })
            .then(() => redisSearchIndexClient.search('elephant'))
            .then(result => {
                should(result.items.length).be.equal(2);
            })
            .then(() => redisSearchIndexClient.search('@tenant:pepsi (eleph* | %eleph%)'))
            .then(result => {
                should(result.items.length).be.equal(1);
                should(result.items[0].key).be.equal('tenant:pepsi:app:elephant');
            })
            .then(() => redisSearchIndexClient.search('@tenant:pepsi (elephant* | %elephant%)'))
            .then(result => {
                should(result.items.length).be.equal(1);
                should(result.items[0].key).be.equal('tenant:pepsi:app:elephant');
            })
            .then(() => redisSearchIndexClient.search('@tenant:pepsi (elexhant* | %elexhant%)'))
            .then(result => {
                should(result.items.length).be.equal(1);
                should(result.items[0].key).be.equal('tenant:pepsi:app:elephant');
            })
            .then(() => redisSearchIndexClient.search('@tenant:coke @app:ele*'))
            .then(result => {
                should(result.items.length).be.equal(2);
                const keys = _.map(result.items, x => x.key).sort();
                should(keys[0]).be.equal('tenant:coke:app:elegant');
                should(keys[1]).be.equal('tenant:coke:app:elephant');
            })
            .then(() => redisSearchIndexClient.search('@tenant:coke @app:%elxphant%'))
            .then(result => {
                should(result.items.length).be.equal(1);
                should(result.items[0].key).be.equal('tenant:coke:app:elephant');
            })
            .then(() => redisSearchIndexClient.search('coke', {
                fields: ['app']
            }))
            .then(result => {
                should(result.items.length).be.equal(4);
                for(const x of result.items)
                {
                    should(_.keys(x.value).length).be.equal(1);
                    should(_.keys(x.value)).be.eql(['app']);
                }
            })
            .then(() => client.close());
    })


    it('aggregate-1', () => {
        const client = new RedisClient(logger);
        client.run();

        const tenants = [ 'coke', 'pepsi' ];
        const apps = ['foo', 'bar', 'elephant', 'elegant'];

        const items : any[] = [];
        for(const tenant of tenants)
        {
            for(const app of apps)
            {
                items.push({
                    id: `tenant:${tenant}:app:${app}`,
                    tenant: tenant,
                    app: app,
                    kind: 'abcd'
                })
            }
        }

        const redisSearchIndexClient = client.redisearch.index('index.test');

        return client.waitConnect()
            .then(() => {
                return MyPromise.serial(items, item => {
                    return client.hashSet(item.id).set(item);
                })            
            })
            .then(() => {
                return redisSearchIndexClient.delete();
            })
            .then(() => {
                return redisSearchIndexClient.create({
                    count: 1,
                    prefix: 'tenant:'
                }, [
                    {
                        name: 'tenant' 
                    },
                    {
                        name: 'app'
                    },
                    {
                        name: 'kind',
                        type: 'TAG'
                    },
                ])
            })
            .then(() => MyPromise.delay(300))
            .then(() => redisSearchIndexClient.aggregate('@app:ele*', { groupBy: ['app']}))
            .then(result => {
                const dict = _.makeDict(result, x => x['app'], x => true);
                should(dict).be.eql(
                    {
                        "elegant": true,
                        "elephant": true,
                    });
            })
            .then(() => client.close());
    })


    it('list', () => {

        const client = new RedisClient(logger);
        client.run();

        const redisSearchIndexClient = client.redisearch.index('list.test');
        
        return client.waitConnect()
            .then(() => {
                return redisSearchIndexClient.delete();
            })
            .then(() => {
                return redisSearchIndexClient.create({
                    count: 1,
                    prefix: 'tenant:'
                }, [
                    {
                        name: 'tenant' 
                    },
                    {
                        name: 'app'
                    },
                    {
                        name: 'kind',
                        type: 'TAG'
                    },
                ])
            })
            .then(() => {
                return client.redisearch.list();
            })
            .then(result => {
                const index = _.indexOf(result, 'list.test');
                should(index).not.equal(-1);
            })
            .then(() => client.close())
            ;
            
    })


    it('info', () => {

        const client = new RedisClient(logger);
        client.run();

        const redisSearchIndexClient = client.redisearch.index('info.test');
        
        return client.waitConnect()
            .then(() => {
                return redisSearchIndexClient.delete();
            })
            .then(() => {
                return redisSearchIndexClient.create({
                    count: 1,
                    prefix: 'tenant:'
                }, [
                    {
                        name: 'tenant' 
                    },
                    {
                        name: 'app',
                        isSortable: true
                    },
                    {
                        name: 'kind',
                        type: 'TAG'
                    },
                ])
            })
            .then(() => {
                return redisSearchIndexClient.info();
            })
            .then(result => {
                should(result).be.ok();
                should(result!.gc_stats).be.ok();
            })
            .then(() => client.close())
            ;
            
    });



    it('info-missing-index', () => {

        const client = new RedisClient(logger);
        client.run();

        const redisSearchIndexClient = client.redisearch.index('info.testnotpresent');
        
        return client.waitConnect()
            .then(() => {
                return redisSearchIndexClient.info();
            })
            .then(result => {
                should(result).be.null();
            })
            .then(() => client.close())
            ;
            
    })



})