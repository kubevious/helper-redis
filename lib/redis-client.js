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

        this.client.on('quit', () => {
            console.log('exit')
        })

        this._logger.info('Connection created...')
    }

    get logger() {
        return this._logger;
    }

    closeConnection() {
        this._logger.info('Closing connection...')
        this.client.end(true)
    }

    setValue(key, value) {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, (err, result) => {
                if (err) reject(err)
                resolve(result)
            })
        })
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

    filterValues(pattern, cb) {
        let cursor = '0'

        return this.client.scan(cursor, 'MATCH', pattern, 'COUNT', '100', (err, res) => {
            cursor = res[0];

            let keys = res[1];

            if (cursor === '0') {
                return cb(keys);
            }

            return this.client.scan()
        })
    }

    publish() {

    }

    subscribe(topic, handlerCb) {
        this.client.subscribe(topic)
    }

    subscribersList() {
        this.client.pubsub('channels', (err, channels) => {
            console.log('channels:', channels)
        })
    }

}

module.exports = RedisClient;