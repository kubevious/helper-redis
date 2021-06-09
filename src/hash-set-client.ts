import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';

export class RedisHashSetClient extends RedisBaseClient
{
    constructor(client : RedisClient, name: string)
    {
        super(client, name);
    }

    set(obj: any)
    {
        let params : string[] = [];
        for(let x of _.keys(obj)) {
            params.push(x);
            params.push(obj[x]);
        }
        return this.exec(x => x.hset(this.name, params));
    }

    get()
    {
        return this.exec(x => x.hgetall(this.name));
    }

    getField(field: string)
    {
        return this.exec(x => x.hget(this.name, field));
    }

    removeField(field: string)
    {
        return this.exec(x => x.hdel(this.name, field));
    }

    keys()
    {
        return this.exec(x => x.hkeys(this.name));
    }

    keyCount()
    {
        return this.exec(x => x.hlen(this.name));
    }
}