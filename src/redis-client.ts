import _ from 'the-lodash'
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger';


// import * as redis from 'redis';
import * as IORedis from 'ioredis'

import  { v4 as uuidv4 }  from 'uuid';

import { RedisStringClient } from './string-client';
import { RedisListClient } from './list-client';
import { RedisSetClient } from './set-client';
import { RedisSortedSetClient } from './sorted-set-client';
import { RedisHashSetClient } from './hash-set-client';

(<any>IORedis).Promise = Promise;
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
    // private _channels : Record<string, { handlers: Record<string, PubSubHandler> }> = {};

    private _commands : IORedis.Commands | null = null;
    private _connection : IORedis.Redis | null = null;
    // private _pubsubClient : redis.RedisClient | null = null;

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

    run()
    {
        this._connection = this._createClient('primary');
        this._commands = this._connection!;
    }

    exec<T>(cb : ((x: IORedis.Commands) => globalThis.Promise<T>)) : Promise<T>
    {
        return Promise.resolve(cb(this._commands!));
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

    private _createClient(name: string)
    {
        this._logger.info('[_createClient] %s', name);

        const options : IORedis.RedisOptions = {
            retryStrategy(times) {
                return Math.min(times * times * 100, 5000);
            }
        }
        options.host = this._redisHost;
        options.port = this._redisPort;

        let client = new IORedis.default(options)

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

        // client.on('pmessage', (pattern, channel, message) => {
        //     this.logger.info('[on-pmessage] (%s) client received message on %s: %s', pattern, channel, message)

        //     let subscriberInfo = this._channels[channel];
        //     if (subscriberInfo)
        //     {
        //         for(let cb of _.values(subscriberInfo.handlers))
        //         {
        //             cb(message, channel, pattern);
        //         }
        //     }
        // })

        // client.on('punsubscribe', (pattern, count) => {
        //     this.logger.info('[on-punsubscribe] from %s, %s total subscriptions', pattern, count);
        // });

        return client;
    }

    close() {
        this._logger.info('Closing connection...')
        this._isClosed = true;
        if (this._connection) {
            this._connection.disconnect();
            this._connection = null;
        }
    }

    setValue(key: string, value: any) {
        return this.exec(x => x.set(key, value));
    }

    getValue(key: string) {
        return this.exec(x => x.get(key));
    }

    deleteValue(key: string) {
        return this.exec(x => x.del(key));
    }

    filterValues(pattern: string, cb?: (keys: string[]) => any) {
        return this._performScan('0', pattern, [], cb);
    }

    private _performScan(cursor: string, pattern: string, keys: string[], cb?: (keys: string[]) => any) : Promise<string[]>
    {
        return this.exec(x => x.scan(cursor, 'MATCH', pattern, 'COUNT', 100))
            .then((res) => {
                const newCursor = res[0];
                const newKeys = res[1];

                if (cb) {
                    cb(newKeys);
                }
        
                const finalKeys = _.concat(keys, newKeys);
                if (newCursor === '0') {
                    return finalKeys 
                }
        
                return this._performScan(newCursor, pattern, finalKeys);
            })
    }

    // subscribe(channel: string, cb: (keys: any) => any) : RedisSubscription {
    //     if (!this._channels[channel]) {
    //         this._channels[channel] = {
    //             handlers: {}
    //         }
    //     }
    //     let id = uuidv4();
    //     this._channels[channel].handlers[id] = cb;

    //     if (_.keys(this._channels[channel].handlers).length == 1)
    //     {
    //         this.pubsubClient!.psubscribe(channel, (err, result) => {
    //             if (err)
    //             {
    //                 this._logger.error('[subscribe] ', err);
    //             }
    //         });
    //     }

    //     return {
    //         close: () => {
    //             if (this._channels[channel])
    //             {
    //                 if (this._channels[channel].handlers[id])
    //                 {
    //                     delete this._channels[channel].handlers[id];
    //                     if (_.keys(this._channels[channel].handlers).length == 0)
    //                     {
    //                         delete this._channels[channel];
    //                         this.pubsubClient!.punsubscribe(channel);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    // publishMessage(channel: string, message: string) {
    //     return Promise.construct((resolve, reject) => {
    //         this.pubsubClient!.publish(channel, message, (err, result) => {
    //             if (err) reject(err)

    //             resolve(result)
    //         })
    //     })
    // }

}

export interface RedisSubscription
{
    close: () => void
}