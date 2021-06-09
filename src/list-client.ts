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
        return this.exec(x => x.lpush(this.name, valueOrArray));
    }

    pushRight(valueOrArray : any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.exec(x => x.rpush(this.name, valueOrArray));
    }

    pop()
    {
        return this.exec(x => x.lpop(this.name));
    }

    popRight()
    {
        return this.exec(x => x.rpop(this.name));
    }

    set(index: number, value : any)
    {
        return this.exec(x => x.lset(this.name, index, value));
    }

    range(start?: number, end?: number)
    {
        if (_.isNullOrUndefined(start)) {
            start = 0;
        }
        if (_.isNullOrUndefined(end)) {
            end = -1;
        }
        return this.exec(x => x.lrange(this.name, start!, end!));
    }

    count()
    {
        return this.exec(x => x.llen(this.name));
    }
}