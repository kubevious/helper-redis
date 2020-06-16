const Promise = require('the-promise');
const _ = require('the-lodash');

class RedisClient
{
    constructor(logger, params)
    {
        this._logger = logger.sublogger("RedisClient");
  
        params = params || {}
        params = _.clone(params);

        this._mysqlConnectParams = _.defaults(params, {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });
    }

    get logger() {
        return this._logger;
    }

    connect()
    {

    }

    close()
    {

    }

    setValue(key, value)
    {

    }

    getValue(key)
    {
        return Promise.resolve('abcd');
    }

    publish()
    {

    }

    subscribe(topic, handlerCb)
    {   
        Promise.timeout(100)
            .then(() => {
                handlerCb('test-1234');
            })

        return {
            close: () => {
                // should unsubscribe;
            }
        }
    }

}

module.exports = RedisClient;