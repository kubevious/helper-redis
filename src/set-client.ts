import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';

export class RedisSetClient extends RedisBaseClient
{
    constructor(client : RedisClient, name: string)
    {
        super(client, name);
    }

    add(valueOrArray: any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.client.exec_command('sadd', [this.name, ...valueOrArray]);
    }

    remove(valueOrArray: any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.client.exec_command('srem', [this.name, ...valueOrArray]);
    }

    pop()
    {
        return this.client.exec_command('spop', [this.name]);
    }

    members()
    {
        return this.client.exec_command('smembers', [this.name]);
    }

    count()
    {
        return this.client.exec_command('scard', [this.name]);
    }
    
    diff(other: any)
    {
        return this.client.exec_command('sdiff', [this.name, other]);
    }

    union(other: any)
    {
        return this.client.exec_command('sdiff', [this.name, other]);
    }

    intersect(other: any)
    {
        return this.client.exec_command('sinter', [this.name, other]);
    }
}