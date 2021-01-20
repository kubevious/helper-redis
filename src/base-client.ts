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
}