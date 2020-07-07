class RedisBaseClient 
{
    constructor(client, name)
    {
        this._client = client;
        this._name = name;
    }

    exists()
    {
        return this._client.exec_command('exists', [this._name])
            .then(res => {
                return (res == 1);
            });
    }

    delete()
    {
        return this._client.exec_command('del', [this._name]);
    }
}

module.exports = RedisBaseClient;