import _ from 'the-lodash'
import { RedisClient } from './redis-client';
import { RedisBaseClient } from './base-client';

export class RedisSortedSetClient extends RedisBaseClient
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
        let params : string[] = [];
        for(let x of valueOrArray) {
            params.push(x.score);
            params.push(x.value);
        }
        return this.exec(x => x.zadd(this.name, params));
    }

    remove(valueOrArray: any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.exec(x => x.zrem(this.name, valueOrArray));
    }

    popMin()
    {
        return this.exec(x => x.zpopmin(this.name))
            .then((result) => {
                if (!result.length) {
                    return null;
                }
                return {
                    value: result[0],
                    score: result[1]
                }
            });
    }

    popMax()
    {
        return this.exec(x => x.zpopmax(this.name))
            .then((result) => {
                if (!result.length) {
                    return null;
                }
                return {
                    value: result[0],
                    score: result[1]
                }
            });
    }

    range(start?: number, end?: number)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this.exec(x => x.zrange(this.name, start!, end!));
    }

    rangeWithScores(start?: number, end?: number)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this.exec(x => x.zrange(this.name, start!, end!, 'WITHSCORES'))
            .then((res: any) => {
                let finalResult = [];
                for(let i = 0; i < res.length; i += 2)
                {
                    finalResult.push({
                        value: res[i],
                        score: res[i + 1],
                    })
                }
                return finalResult;
            });
    }

    count(min?: number, max?: number)
    {
        if (_.isUndefined(min) && _.isUndefined(max)) {
            return this.exec(x => x.zcard(this.name));
        } else {
            return this.exec(x => x.zcount(this.name, min!, max!));
        }
    }
}