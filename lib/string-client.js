const _ = require('the-lodash');
const RedisBaseClient = require('./base-client');

class RedisStringClient extends RedisBaseClient
{
    constructor(client, name)
    {
        super(client, name);
    }

    set(value)
    {
        return this._client.exec_command('set', [this._name, value]);
    }

    get()
    {
        return this._client.exec_command('get', [this._name]);
    }
}

module.exports = RedisStringClient;