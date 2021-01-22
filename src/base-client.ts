import { RedisClient } from './redis-client';

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

    get client() {
        return this._client;
    }

    exists()
    {
        return this._client.exec_command('exists', [this._name])
            .then((res: any) => {
                return (res == 1);
            });
    }

    delete()
    {
        return this._client.exec_command('del', [this._name]);
    }

    ttl()
    {
        return this._client.exec_command('ttl', [this._name])
            .then((res: number) => {
                if (res >= 0) {
                    return <TTLResult> {
                        exists: true,
                        hasExpiration: true,
                        ttlSeconds: res
                    };
                }
                if (res == -1) {
                    return <TTLResult> {
                        exists: true,
                        hasExpiration: false,
                        ttlSeconds: 0
                    };
                }
                if (res == -2) {
                    return <TTLResult> {
                        exists: false,
                        hasExpiration: false,
                        ttlSeconds: 0
                    };
                }
                throw new Error("Unexpected Result.");
            });
    }

    expire(seconds: number)
    {
        return this._client.exec_command('expire', [this._name, seconds]);
    }

}

export interface TTLResult 
{
    exists: boolean,
    hasExpiration: boolean,
    ttlSeconds: number,
}