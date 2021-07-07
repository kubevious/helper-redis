import _ from 'the-lodash'
import { Promise, Resolvable } from 'the-promise';
import { ILogger } from 'the-logger';

import * as IORedis from 'ioredis'

import  { v4 as uuidv4 }  from 'uuid';

import { RedisStringClient } from './string-client';
import { RedisListClient } from './list-client';
import { RedisSetClient } from './set-client';
import { RedisSortedSetClient } from './sorted-set-client';
import { RedisHashSetClient } from './hash-set-client';
import { RedisearchClient } from './redisearch-client'

import { EventEmitter } from 'stream';
import { RedisClientParams, RedisClusterNodeInfo, RedisClusterParams } from './types';

(<any>IORedis).Promise = Promise;

export type PubSubHandler = (message: string, channel: string, pattern: string) => any;
export type ConnectHandler = () => any;

const REDIS_DEFAULT_PORT = 6379;

export class RedisClient {
    private _logger : ILogger;

    private _params : RedisClientParams;

    private _isClosed : boolean = false;

    private _commands : IORedis.Commands | null = null;
    
    private _connection : IORedis.Redis | null = null;
    private _clusterConnection : IORedis.Cluster | null = null;

    private _isConnected : boolean = false;
    private _connectHandlers: ConnectHandler[] = [];
    private _tempConnectHandlers: ConnectHandler[] = [];
    

    constructor(logger: ILogger, params? : Partial<RedisClientParams>) {
        this._logger = logger.sublogger('RedisClient');
        this._logger.info('Client created...')

        params = params || {}
        params = _.clone(params);

        const isCluster = params.isCluster || getEnvBool('REDIS_CLUSTER') || false;

        if (isCluster)
        {
            if (params.nodes) {
                this._params = {
                    isCluster: true,
                    nodes: params.nodes
                }
            } else {
                const HOST_PREFIX = "REDIS_HOST_";
                const PORT_PREFIX = "REDIS_PORT_";
                const NAT_PREFIX = "REDIS_NAT_";
                const nodesDict : Record<string, RedisClusterNodeInfo> = {};
                for(let hostEnv of _.keys(process.env).filter(x => _.startsWith(x, HOST_PREFIX)))
                {
                    let id = hostEnv.substring(HOST_PREFIX.length);
        
                    const hostValue = getEnvString(hostEnv)!;
                    
                    const portEnv = PORT_PREFIX + id;
                    const portValue = getEnvInt(portEnv);
        
                    const natEnv = NAT_PREFIX + id;
                    const natValue = getEnvString(natEnv);
        
                    if (!nodesDict[id]) {
                        nodesDict[id] = {
                            host: hostValue,
                            port: portValue || REDIS_DEFAULT_PORT,
                            nat: natValue
                        }
                    }
                }

                this._params = {
                    isCluster: true,
                    nodes: _.values(nodesDict)
                }
            }
        }
        else
        {
            this._params = {
                isCluster: false,
                host: params.host || getEnvString('REDIS_HOST') || 'localhost',
                port: params.port || getEnvInt('REDIS_PORT') || REDIS_DEFAULT_PORT,
                nodes: []
            }
        }

        this._logger.info('Params: ', this._params);
    }

    get logger() {
        return this._logger;
    }

    run()
    {
        
        if (this._params.isCluster)
        {
            this._clusterConnection = this._createClusterClient('primary');
            this._commands = this._clusterConnection!;
        }
        else
        {
            this._connection = this._createClient('primary');
            this._commands = this._connection!;
        }
    }

    handleConnect(cb: ConnectHandler)
    {
        this._connectHandlers.push(cb);

        if (this._isConnected) {
            this._trigger(cb);
        }
    }

    waitConnect()
    {
        if (this._isConnected) {
            return Promise.resolve();
        }

        return Promise.construct<void>((resolve) => {
            if (this._isConnected) {
                resolve();
            } else {
                this._tempConnectHandlers.push(resolve);
            }
        })
    }

    private _trigger(cb: ConnectHandler)
    {
        Promise.resolve(null)
            .then(() => {
                return cb();
            })
            .catch(reason => {
                this.logger.error("Error Handling Redis Connection: ", reason);
            })
            .then(() => {
                return null;
            })
    }

    private _triggerConnect()
    {
        const handlers = this._tempConnectHandlers;
        this._tempConnectHandlers = [];
        for(let cb of handlers)
        {
            this._trigger(cb);
        }
        

        for(let cb of this._connectHandlers)
        {
            this._trigger(cb);
        }
    }

    exec<T>(cb : ((x: IORedis.Commands) => globalThis.Promise<T>)) : Promise<T>
    {
        return Promise.resolve(cb(this._commands!));
    } 

    execInCluster<T>(cb : ((x: IORedis.Commands) => globalThis.Promise<T>)) : Promise<T[]>
    {
        if (!this._params.isCluster) {
            return this.exec(cb)
                .then(result => {
                    return [result];
                })
        }
        return Promise.serial(this._clusterConnection!.nodes(), x => {
            return Promise.resolve(cb(x));
        });
    } 

    execCustom(command: string, args: any[], options?: ExecCommandOptions)
    {
        if (!this._connection) {
            return Promise.reject("Not Connected");
        }
        // this.logger.info("[execCustom] begin: %s, args:", command, args);
        return this._connection?.send_command(command, ...args)
            .catch(reason => {
                if (options) {
                    if (options.handleError) {
                        return options.handleError(reason);
                    }
                }
                throw reason;
            })
            // .then(result => {
            //     this.logger.info("[execCustom] end: %s, Result:", command, result);
            //     return result;
            // })
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

    get redisearch() : RedisearchClient
    {
        return new RedisearchClient(this);
    }

    private _createClient(name: string)
    {
        this._logger.info('[_createClient] %s', name);

        const options : IORedis.RedisOptions = {
            retryStrategy(times) {
                return Math.min(times * times * 100, 5000);
            }
        }
        options.host = this._params.host;
        options.port = this._params.port;

        let client = new IORedis.default(options)
        this._setupHandlers(name, client);

        return client;
    }

    private _createClusterClient(name: string)
    {
        this._logger.info('[_createClusterClient] %s', name);

        const nodes : IORedis.NodeConfiguration[] = [];

        const options : IORedis.ClusterOptions = {
            clusterRetryStrategy(times) {
                return Math.min(times * times * 100, 5000);
            },
            natMap: {}
        }

        const params = <RedisClusterParams>this._params;
        for(let node of params.nodes)
        {
            nodes.push({
                host: node.host,
                port: node.port
            });

            if (node.nat) {
                options.natMap![node.nat] = {
                    host: node.host,
                    port: node.port
                }
            }
        }

        // this.logger.info("FINAL CONFIG: ", nodes, options);

        let client = new IORedis.Cluster(nodes, options)
        this._setupHandlers(name, client);

        return client;
    }

    private _setupHandlers(name: string, client: EventEmitter)
    {
        client.on('ready', () => {
            this._logger.info('[on-ready] %s', name);
            this._triggerConnect();
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
    }

    close() {
        this._logger.info('Closing connection...')
        this._isClosed = true;
        if (this._connection) {
            this._connection.disconnect();
            this._connection = null;
        }
        if (this._clusterConnection) {
            this._clusterConnection.disconnect();
            this._clusterConnection = null;
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

    filterValues(pattern: string, cb?: (keys: string[]) => any)
    {
        const resultData : Record<string, boolean> = {};
        return this.execInCluster(x => {
            return this._performScan(x, '0', pattern, resultData, cb);
        })
        .then(() => {
            return _.keys(resultData);
        })
    }

    private _performScan(cluster: IORedis.Commands, cursor: string, pattern: string, resultData : Record<string, boolean>, cb?: (keys: string[]) => any) : Promise<void>
    {
        return Promise.resolve(cluster.scan(cursor, 'MATCH', pattern, 'COUNT', 100))
            .then((res) => {
                const newCursor = res[0];
                const newKeys = res[1];

                if (cb) {
                    cb(newKeys);
                }

                for(let key of newKeys)
                {
                    resultData[key] = true;
                }

                if (newCursor === '0') {
                    return;
                }
        
                return this._performScan(cluster, newCursor, pattern, resultData);
            })
    }

}

export interface RedisSubscription
{
    close: () => void
}

function getEnvString(name: string) : string | undefined
{
    const val = process.env[name];
    if (_.isUndefined(val)) {
        return undefined;
    }
    return val;
}

function getEnvBool(name: string) : boolean | undefined
{
    const val = getEnvString(name);
    if (_.isUndefined(val)) {
        return undefined;
    }
    return (val == 'true');
}

function getEnvInt(name: string) : number | undefined
{
    const val = getEnvString(name);
    if (_.isUndefined(val)) {
        return undefined;
    }
    return parseInt(val);
}

export interface ExecCommandOptions {
    handleError? : (reason: any) => any;
}