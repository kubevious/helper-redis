import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RedisClient, RedisSubscription }  from '../src';

describe('pub-sub', () => {
    
    it('test-1', () => {
        const publishClient = new RedisClient(logger);
        publishClient.run();
        const subscribeClient = new RedisClient(logger);
        subscribeClient.run();

        var subscription : RedisSubscription;
        var messages : string[] = [];

        return Promise.resolve()
            .then(() => {
                subscription = subscribeClient.subscribe('channel_one', (message) => {
                    messages.push(message);
                })
            })

            .then(() => Promise.timeout(100))
            .then(() => publishClient.publishMessage('channel_one', '1'))
            .then(() => publishClient.publishMessage('channel_two', '2'))
            .then(() => publishClient.publishMessage('channel_one', '3'))
            .then(() => Promise.timeout(100))

            .then(() => {
                (messages.length).should.be.equal(2)
                should(messages.sort()).be.eql(['1', '3'].sort())
            })
            
            .then(() => subscription.close())

            .then(() => Promise.timeout(100))
            .then(() => publishClient.publishMessage('channel_one', '4'))
            .then(() => publishClient.publishMessage('channel_one', '5'))
            .then(() => Promise.timeout(100))

            .then(() => {
                (messages.length).should.be.equal(2)
                should(messages.sort()).be.eql(['1', '3'].sort())
            })

            .then(() => publishClient.close())
            .then(() => subscribeClient.close())
    })
})
