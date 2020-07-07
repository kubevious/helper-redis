const _ = require('the-lodash');

class RedisStringClient 
{
    constructor(client, name)
    {
        this._client = client;
        this._name = name;
    }

    set(value)
    {
        return this._client.exec_command('set', [this._name, value]);
    }

    get()
    {
        return this._client.exec_command('get', [this._name]);
    }

    delete()
    {
        return this._client.exec_command('del', [this._name]);
    }
}

module.exports = RedisStringClient;