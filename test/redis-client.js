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

    it('pub-sub-test-1', () => {
        const publishClient = new RedisClient(logger, null)
        const subscribeClient = new RedisClient(logger, null)

        var messagesReceived = [];
        var subscription = subscribeClient.subscribe("channel_one", (channel, message) => {
            messagesReceived.push(message);
        })

        return Promise.resolve()
            .then(() => publishClient.publish('channel_one', '1'))
            .then(() => publishClient.publish('channel_two', '2'))
            .then(() => publishClient.publish('channel_one', '3'))
            .then(() => Promise.timeout(1000))
            .then(() => {
                (messagesReceived.length).should.be.equal(2);
            })
            .then(() => subscription.close())
            .then(() => publishClient.publish('channel_one', '4'))
            .then(() => publishClient.publish('channel_one', '5'))
            .then(() => Promise.timeout(1000))
            .then(() => {
                (messagesReceived.length).should.be.equal(2);
            })
            .then(() => publishClient.close())
            .then(() => subscribeClient.close())
            ;
    })
})