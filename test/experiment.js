const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require('../lib/redis-client')
const Promise = require('the-promise');

describe('experiments', () => {

    it('exp-1', () => {
        const client = new RedisClient(logger, null)

        return Promise.resolve()
            .then(() => {

            })
            .then(() => client.close())
    })

})