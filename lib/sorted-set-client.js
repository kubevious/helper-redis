const _ = require('the-lodash');

class RedisSortedSetClient 
{
    constructor(client, name)
    {
        this._client = client;
        this._name = name;
    }

    add(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        var params = [this._name];
        for(var x of valueOrArray) {
            params.push(x.score);
            params.push(x.value);
        }
        return this._client.exec_command('zadd', params);
    }

    remove(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this._client.exec_command('zrem', [this._name, ...valueOrArray]);
    }

    popMin()
    {
        return this._pop('zpopmin');
    }

    popMax()
    {
        return this._pop('zpopmax');
    }

    _pop(cmd)
    {
        return this._client.exec_command(cmd, [this._name])
            .then(result => {
                if (!result.length) {
                    return null;
                }
                return {
                    value: result[0],
                    score: result[1]
                }
            });
    }

    delete()
    {
        return this._client.exec_command('del', [this._name]);
    }

    range(start, end)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this._client.exec_command('zrange', [this._name, start, end]);
    }

    rangeWithScores(start, end)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this._client.exec_command('zrange', [this._name, start, end, 'withscores'])
            .then(res => {
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

    count(min, max)
    {
        if (_.isUndefined(min) && _.isUndefined(max)) {
            return this._client.exec_command('zcard', [this._name]);
        } else {
            return this._client.exec_command('zcount', [this._name, min, max]);
        }
    }
}

module.exports = RedisSortedSetClient;