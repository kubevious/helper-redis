const Promise = require('the-promise');
const _ = require('the-lodash');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class RedisClient {
    constructor(logger, params = {}) {
        this._logger = logger.sublogger('RedisClient');
        this._logger.info('Client created...')

        params = params || {}
        params = _.clone(params);

        this._redisParams = _.defaults(params, {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        });

        this._channels = {};
        this._isClosed = false;

        this._client = this._createClient('primary');
        this._pubsubClient = this._createClient('pubsub');

    }

    get logger() {
        return this._logger;
    }

    get client() {
        return this._client;
    }

    get pubsubClient() {
        return this._pubsubClient;
    }

    _createClient(name)
    {
        this._logger.info('[_createClient] %s', name);

        var client = redis.createClient(this._redisParams.port, this._redisParams.host, {
            retry_strategy: function (options) {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    return new Error('The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    return undefined;
                }

                return Math.min(options.attempt * 100, 3000);
            },
        })

        client.on('ready', () => {
            this._logger.info('[on-ready] %s', name);
        })

        client.on('connect', () => {
            this._logger.info('[on-connect] %s', name);
        })

        client.on('reconnect', () => {
            this._logger.info('[on-reconnect] %s', name);
        })

        client.on('error', (err) => {
            if (this._isClosed) {
                if (err.code == 'NR_CLOSED') {
                    this._logger.warn('[on-error] %s :: %s', name, err.message);
                    return;
                }
            }
            this._logger.error('[on-error] %s', name, err);
        })

        client.on('pmessage', (pattern, channel, message) => {
            this.logger.info('[on-pmessage] (%s) client received message on %s: %s', pattern, channel, message)

            var subscriberInfo = this._channels[channel];
            if (subscriberInfo)
            {
                for(var cb of _.values(subscriberInfo.handlers))
                {
                    cb(message, channel, pattern);
                }
            }
        })

        client.on('punsubscribe', (pattern, count) => {
            this.logger.info('[on-punsubscribe] from %s, %s total subscriptions', pattern, count);
        });

        return client;
    }

    close() {
        this._logger.info('Closing connection...')
        this._isClosed = true;
        if (this._client) {
            this._client.end(true);
            this._client = null;
        }
        if (this._pubsubClient) {
            this._pubsubClient.end(true);
            this._pubsubClient = null;
        }
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
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, value) => {
                if (err) reject(err)

                resolve(value)
            })
        })
    }

    filterValues(pattern, cb) {
        let cursor = '0'

        return new Promise((resolve, reject) => {
            this.client.scan(cursor, 'MATCH', pattern, 'COUNT', '100', (err, res) => {
                cursor = res[0];

                let keys = res[1];

                if (cursor === '0') {
                    return resolve(cb(keys))
                }

                return this.client.scan()
            })
        })
    }

    subscribe(channel, cb) {
        if (!this._channels[channel]) {
            this._channels[channel] = {
                handlers: {}
            }
        }
        var id = uuidv4();
        this._channels[channel].handlers[id] = cb;

        if (_.keys(this._channels[channel].handlers).length == 1)
        {
            this.pubsubClient.psubscribe(channel, (err, result) => {
                if (err)
                {
                    this._logger.error('[subscribe] ', error);
                }
            });
        }

        return {
            close: () => {
                if (this._channels[channel])
                {
                    if (this._channels[channel].handlers[id])
                    {
                        delete this._channels[channel].handlers[id];
                        if (_.keys(this._channels[channel].handlers).length == 0)
                        {
                            delete this._channels[channel];
                            this.pubsubClient.punsubscribe(channel);
                        }
                    }
                }
            }
        }
    }

    publishMessage(channel, message) {
        return new Promise((resolve, reject) => {
            this.pubsubClient.publish(channel, message, (err, result) => {
                if (err) reject(err)

                resolve(result)
            })
        })
    }

}

module.exports = RedisClient;
