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
        return this.exec(x => x.sadd(this.name, valueOrArray));
    }

    remove(valueOrArray: any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.exec(x => x.srem(this.name, valueOrArray));
    }

    pop()
    {
        return this.exec(x => x.spop(this.name));
    }

    members()
    {
        return this.exec(x => x.smembers(this.name));
    }

    count() : Promise<number>
    {
        return this.exec(x => x.scard(this.name))
            .then(result => {
                if (!result) {
                    return 0;
                }
                return <number>result;
            });
    }
    
    diff(other: string)
    {
        return this.exec(x => x.sdiff(this.name, other));
    }

    union(other: string)
    {
        return this.exec(x => x.sdiff(this.name, other));
    }

    intersect(other: string)
    {
        return this.exec(x => x.sinter(this.name, other));
    }
}