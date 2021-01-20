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
        var params = [this.name];
        for(var x of valueOrArray) {
            params.push(x.score);
            params.push(x.value);
        }
        return this.client.exec_command('zadd', params);
    }

    remove(valueOrArray: any)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this.client.exec_command('zrem', [this.name, ...valueOrArray]);
    }

    popMin()
    {
        return this._pop('zpopmin');
    }

    popMax()
    {
        return this._pop('zpopmax');
    }

    private _pop(cmd: string)
    {
        return this.client.exec_command(cmd, [this.name])
            .then((result: any) => {
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
        return this.client.exec_command('zrange', [this.name, start, end]);
    }

    rangeWithScores(start?: number, end?: number)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this.client.exec_command('zrange', [this.name, start, end, 'withscores'])
            .then((res: any) => {
                var finalResult = [];
                for(var i = 0; i < res.length; i += 2)
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
            return this.client.exec_command('zcard', [this.name]);
        } else {
            return this.client.exec_command('zcount', [this.name, min, max]);
        }
    }
}