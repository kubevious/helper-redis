const _ = require('the-lodash');
const RedisBaseClient = require('./base-client');

class RedisHashSetClient extends RedisBaseClient
{
    constructor(client, name)
    {
        super(client, name);
    }

    set(obj)
    {
        var params = [this._name];
        for(var x of _.keys(obj)) {
            params.push(x);
            params.push(obj[x]);
        }
        return this._client.exec_command('hset', params);
    }

    get()
    {
        return this._client.exec_command('hgetall', [this._name]);
    }

    getField(field)
    {
        return this._client.exec_command('hget', [this._name, field]);
    }

    removeField(field)
    {
        return this._client.exec_command('hdel', [this._name, field]);
    }

    keys()
    {
        return this._client.exec_command('hkeys', [this._name]);
    }

    keyCount()
    {
        return this._client.exec_command('hlen', [this._name]);
    }
}

module.exports = RedisHashSetClient;