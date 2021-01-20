import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';

export class RedisListClient extends RedisBaseClient
{
    constructor(client : RedisClient, name: string)
    {
        super(client, name);
    }

    push(valueOrArray : any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.client.exec_command('lpush', [this.name, ...valueOrArray]);
    }

    pushRight(valueOrArray : any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.client.exec_command('rpush', [this.name, ...valueOrArray]);
    }

    pop()
    {
        return this.client.exec_command('lpop', [this.name]);
    }

    popRight()
    {
        return this.client.exec_command('rpop', [this.name]);
    }

    set(index: number, value : any)
    {
        return this.client.exec_command('lset', [this.name, index, value]);
    }

    range(start?: number, end?: number)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this.client.exec_command('lrange', [this.name, start, end]);
    }

    count()
    {
        return this.client.exec_command('llen', [this.name]);
    }
}