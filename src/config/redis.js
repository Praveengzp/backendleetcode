const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-11189.crce292.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 11189
    }
});

module.exports = redisClient;