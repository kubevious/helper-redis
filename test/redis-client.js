const should = require('should');
const _ = require('the-lodash');
const logger = require('the-logger').setup('test', { pretty: true });
const RedisClient = require("../lib/redis-client")

describe('Redis client', () => {
    it('Constructor', () => {
        const client = new RedisClient(logger, null)

        client.closeConnection()
    })

    it('set value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('client', 'Danny').then(res => {
            res.should.be.equal('OK')

            client.closeConnection()
        })
    })

    it('get value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('client', 'Danny').then(res => {
            const result = client.getValue('client')

            result.then(data => {
                (data).should.be.equal('Danny');

                client.closeConnection()
            })
        })
    })

    it('delete value', () => {
        const client = new RedisClient(logger, null)

        client.setValue('town', 'NYC').then(() => {

            client.deleteValue('town')

            const result = client.getValue('town')

            result.then((data) => {
                should.equal(data, null)

                client.closeConnection()
            })
        })
    })

    it('filter values keys', () => {
        const client = new RedisClient(logger, null)

        client.setValue('city:nyc', 'NYC')
        client.setValue('city:la', 'LA')
        client.setValue('city:moscow', 'Moscow')
        client.setValue('town:rostov', 'Rostov')

        client.filterValues('city:*', (keys) => {
            keys.should.be.an.Array()
            keys.length.should.be.equal(3)

            client.closeConnection()
        })
    })

    it('publish messages to the channel', () => {
        const client1 = new RedisClient(logger, null)
        const client2 = new RedisClient(logger, null)
        const client3 = new RedisClient(logger, null)
        const client4 = new RedisClient(logger, null)

        client1.subsribe('channel*')

        client2.publishMessage('channel_two', '2')
        client3.publishMessage('channel_three', '3')
        client4.publishMessage('channel_four', '4')

        client1.channels.should.containEql('channel*')

    })
})