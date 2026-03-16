const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-10794.crce283.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 10794
    }
});

module.exports = redisClient;