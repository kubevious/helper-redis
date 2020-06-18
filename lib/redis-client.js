const Promise = require('the-promise');
const _ = require('the-lodash');
const redis = require('redis')

class RedisClient {
    constructor(logger, params) {
        this._logger = logger.sublogger("RedisClient");

        params = params || {}
        params = _.clone(params);

        this._redisConnectParams = _.defaults(params, {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });

        this.client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, {
            retry_strategy: function (options) {
                if (options.error && options.error.code === "ECONNREFUSED") {
                    return new Error("The server refused the connection");
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error("Retry time exhausted");
                }
                if (options.attempt > 10) {
                    return undefined;
                }

                return Math.min(options.attempt * 100, 3000);
            }
        })

        this.client.on('ready', () => {
            console.log('ready')
        })

        this.client.on('connect', () => {
            console.log('connect')
        })

        this.client.on('reconnect', () => {
            console.log('reconnect')
        })

        this.client.on('error', (err) => {
            console.log('error', err)
        })

        this.client.on('subsribe', (channel, count) => {
            console.log('channel', channel)
            console.log('count', count)
        })
    }

    get logger() {
        return this._logger;
    }

    close() {

    }

    setValue(key, value) {
        this.client.set(key, value, redis.print)
    }

    getValue(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, value) => {
                if (err) reject(err)

                resolve(value)
            })
        })
    }

    deleteValue(key) {
        this.client.del(key)
    }

    filterValues() {

    }

    publish() {

    }

    subscribe(topic, handlerCb) {
        this.client.subscribe(topic)
        // Promise.timeout(100)
        //     .then(() => {
        //         handlerCb('test-1234');
        //     })

        // return {
        //     close: () => {
        //         // should unsubscribe;
        //     }
        // }
    }

    subscribersList() {
        this.client.pubsub('channels', (err, channels) => {
            console.log('channels:', channels)
        })
    }

}

module.exports = RedisClient;