const _ = require('the-lodash');
const RedisBaseClient = require('./base-client');

class RedisSetClient extends RedisBaseClient
{
    constructor(client, name)
    {
        super(client, name);
    }

    add(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this._client.exec_command('sadd', [this._name, ...valueOrArray]);
    }

    remove(valueOrArray)
    {
        if (!_.isArray(valueOrArray)) {
            valueOrArray = [valueOrArray];
        }
        return this._client.exec_command('srem', [this._name, ...valueOrArray]);
    }

    pop()
    {
        return this._client.exec_command('spop', [this._name]);
    }

    members()
    {
        return this._client.exec_command('smembers', [this._name]);
    }

    count()
    {
        return this._client.exec_command('scard', [this._name]);
    }
    
    diff(other)
    {
        return this._client.exec_command('sdiff', [this._name, other]);
    }

    union(other)
    {
        return this._client.exec_command('sdiff', [this._name, other]);
    }

    intersect(other)
    {
        return this._client.exec_command('sinter', [this._name, other]);
    }
}

module.exports = RedisSetClient;