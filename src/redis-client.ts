import _ from 'the-lodash'
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger';

import * as redis from 'redis';

import  { v4 as uuidv4 }  from 'uuid';

import { RedisStringClient } from './string-client';
import { RedisListClient } from './list-client';
import { RedisSetClient } from './set-client';
import { RedisSortedSetClient } from './sorted-set-client';
import { RedisHashSetClient } from './hash-set-client';

export interface RedisClientParams {
    port?: number,
    host?: string
}

export type PubSubHandler = (message: string, channel: string, pattern: string) => any;

export class RedisClient {
    private _logger : ILogger;
    private _redisPort : number;
    private _redisHost? : string;

    private _isClosed : boolean = false;
    private _channels : Record<string, { handlers: Record<string, PubSubHandler> }> = {};

    private _client : redis.RedisClient | null = null;
    private _pubsubClient : redis.RedisClient | null = null;

    constructor(logger: ILogger, params? : RedisClientParams) {
        this._logger = logger.sublogger('RedisClient');
        this._logger.info('Client created...')

        params = params || {}
        params = _.clone(params);

        let redisParams = _.defaults(params, {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        });
        redisParams = _.defaults(redisParams, {
            port: 6379
        })
        this._redisPort = parseInt(redisParams.port!);
        this._redisHost = redisParams.host;
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

    run()
    {
        this._client = this._createClient('primary');
        this._pubsubClient = this._createClient('pubsub'); 
    }

    string(name: string) : RedisStringClient
    {
        return new RedisStringClient(this, name);
    }

    list(name: string) : RedisListClient
    {
        return new RedisListClient(this, name);
    }

    set(name: string) : RedisSetClient
    {
        return new RedisSetClient(this, name);
    }

    sortedSet(name: string) : RedisSortedSetClient
    {
        return new RedisSortedSetClient(this, name);
    }

    hashSet(name: string) : RedisHashSetClient
    {
        return new RedisHashSetClient(this, name);
    }
    
    exec_command(name: string, args: any)
    {
        this._logger.silly('[exec_command] %s :: ', name, args);

        return Promise.construct<any>((resolve, reject) => {
            this.client!.sendCommand(name, args, (err, value) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(value)
                }
            })
        })
    }

    private _createClient(name: string)
    {
        this._logger.info('[_createClient] %s', name);

        var client = redis.createClient(this._redisPort, this._redisHost, {
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

    delete(key: string)
    {
        return this.exec_command('del', [key]);
    }

    setValue(key: string, value: any) {
        return Promise.construct((resolve, reject) => {
            this.client!.set(key, value, (err, result) => {
                if (err) reject(err)
                resolve(result)
            })
        })
    }

    getValue(key: string) {
        return Promise.construct((resolve, reject) => {
            this.client!.get(key, (err, value) => {
                if (err) reject(err)

                resolve(value)
            })
        })
    }

    deleteValue(key: string) {
        return Promise.construct((resolve, reject) => {
            this.client!.del(key, (err, value) => {
                if (err) { reject(err); }
                resolve(value)
            })
        })
    }

    filterValues(pattern: string, cb: (keys: any) => any) {
        let cursor = '0'

        return Promise.construct((resolve, reject) => {
            this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', '100', (err: any, res: any) => {
                cursor = res[0];

                let keys = res[1];

                if (cursor === '0') {
                    return resolve(cb(keys))
                }

                return this.client!.scan()
            })
        })
    }

    subscribe(channel: string, cb: (keys: any) => any) : RedisSubscription {
        if (!this._channels[channel]) {
            this._channels[channel] = {
                handlers: {}
            }
        }
        var id = uuidv4();
        this._channels[channel].handlers[id] = cb;

        if (_.keys(this._channels[channel].handlers).length == 1)
        {
            this.pubsubClient!.psubscribe(channel, (err, result) => {
                if (err)
                {
                    this._logger.error('[subscribe] ', err);
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
                            this.pubsubClient!.punsubscribe(channel);
                        }
                    }
                }
            }
        }
    }

    publishMessage(channel: string, message: string) {
        return Promise.construct((resolve, reject) => {
            this.pubsubClient!.publish(channel, message, (err, result) => {
                if (err) reject(err)

                resolve(result)
            })
        })
    }

}

export interface RedisSubscription
{
    close: () => void
}