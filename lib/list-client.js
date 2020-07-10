const _ = require('the-lodash');
const RedisBaseClient = require('./base-client');

class RedisListClient extends RedisBaseClient
{
    constructor(client, name)
    {
        super(client, name);
    }

    push(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this._client.exec_command('lpush', [this._name, ...valueOrArray]);
    }

    pushRight(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this._client.exec_command('rpush', [this._name, ...valueOrArray]);
    }

    pop()
    {
        return this._client.exec_command('lpop', [this._name]);
    }

    popRight()
    {
        return this._client.exec_command('rpop', [this._name]);
    }

    set(index, value)
    {
        return this._client.exec_command('lset', [this._name, index, value]);
    }

    range(start, end)
    {
        if (_.isUndefined(start)) {
            start = 0;
        }
        if (_.isUndefined(end)) {
            end = -1;
        }
        return this._client.exec_command('lrange', [this._name, start, end]);
    }

    count()
    {
        return this._client.exec_command('llen', [this._name]);
    }
}

module.exports = RedisListClient;