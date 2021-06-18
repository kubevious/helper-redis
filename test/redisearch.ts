import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient }  from '../src';

describe('redisearch', () => {

    it('case-1', () => {
        const client = new RedisClient(logger);
        client.run();

        const tenants = [ 'coke', 'pepsi' ];
        const apps = ['foo', 'bar', 'elephant', 'elegant'];

        const items : any[] = [];
        for(let tenant of tenants)
        {
            for(let app of apps)
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

        return Promise.resolve()
            .then(() => {
                return Promise.serial(items, item => {
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
            .then(() => Promise.timeout(300))
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
            .then(() => client.close());
    })


    it('list', () => {

        const client = new RedisClient(logger);
        client.run();

        const redisSearchIndexClient = client.redisearch.index('list.test');
        
        return Promise.resolve()
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
        
        return Promise.resolve()
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
                should(result.fields).be.ok();
                should(result.fields['tenant']).be.ok();
                should(result.fields['app']).be.ok();
                should(result.fields['kind']).be.ok();
            })
            .then(() => client.close())
            ;
            
    })


})