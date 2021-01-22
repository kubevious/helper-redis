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
        const args : any[] = [this.name, value];
        if (params)
        {
            if (params.expireSeconds) {
                args.push('ex');
                args.push(params.expireSeconds);
            }
        }
        return this.client.exec_command('set', args);
    }

    get()
    {
        return this.client.exec_command('get', [this.name]);
    }
}

export interface SetParams
{
    expireSeconds?: number
}