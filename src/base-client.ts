import { RedisClient } from './redis-client';
import * as IORedis from 'ioredis'

export class RedisBaseClient 
{
    private _client : RedisClient;
    private _name: string;

    constructor(client : RedisClient, name: string)
    {
        this._client = client;
        this._name = name;
    }

    get name() {
        return this._name;
    }

    // get client() {
    //     return this._client;
    // }

    exec<T>(cb : ((x: IORedis.Commands) => globalThis.Promise<T>)) : Promise<T>
    {
        return this._client.exec(cb);
    } 

    exists()
    {
        return this.exec(x => x.exists(this._name))
            .then((res: number) => {
                return (res == 1);
            });
    }

    delete()
    {
        return this.exec(x => x.del(this._name));
    }

    ttl() : Promise<TTLResult>
    {
        return this.exec(x => x.ttl(this._name))
            .then((res: number) => {
                if (res >= 0) {
                    return {
                        exists: true,
                        hasExpiration: true,
                        ttlSeconds: res
                    };
                }
                if (res == -1) {
                    return {
                        exists: true,
                        hasExpiration: false,
                        ttlSeconds: 0
                    };
                }
                if (res == -2) {
                    return {
                        exists: false,
                        hasExpiration: false,
                        ttlSeconds: 0
                    };
                }
                throw new Error("Unexpected Result.");
            });
    }

    expire(seconds: number) : Promise<boolean>
    {
        return this.exec(x => x.expire(this._name, seconds))
            .then((res: number) => {
                return (res == 1);
            });
    }

}

export interface TTLResult 
{
    exists: boolean,
    hasExpiration: boolean,
    ttlSeconds: number,
}