import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';


export class RedisStringClient extends RedisBaseClient
{
    constructor(client : RedisClient, name: string)
    {
        super(client, name);
    }

    set(value: string)
    {
        return this.client.exec_command('set', [this.name, value]);
    }

    get()
    {
        return this.client.exec_command('get', [this.name]);
    }
}