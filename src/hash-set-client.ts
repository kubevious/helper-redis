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
        var params = [this.name];
        for(var x of _.keys(obj)) {
            params.push(x);
            params.push(obj[x]);
        }
        return this.client.exec_command('hset', params);
    }

    get()
    {
        return this.client.exec_command('hgetall', [this.name]);
    }

    getField(field: string)
    {
        return this.client.exec_command('hget', [this.name, field]);
    }

    removeField(field: string)
    {
        return this.client.exec_command('hdel', [this.name, field]);
    }

    keys()
    {
        return this.client.exec_command('hkeys', [this.name]);
    }

    keyCount()
    {
        return this.client.exec_command('hlen', [this.name]);
    }
}