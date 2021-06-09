import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';


export class RedisStringClient extends RedisBaseClient
{
    constructor(client : RedisClient, name: string)
    {
        super(client, name);
    }

    set(value: string, params? : SetParams)
    {
        if (params)
        {
            if (params.expireSeconds) {
                return this.exec(x => x.set(this.name, value, 'ex', params.expireSeconds));
            }
        }
        return this.exec(x => x.set(this.name, value));
    }

    get()
    {
        return this.exec(x => x.get(this.name));
    }
}

export interface SetParams
{
    expireSeconds?: number
}