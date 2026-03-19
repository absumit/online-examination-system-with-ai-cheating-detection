const redis = require('redis')

const redisClient = redis.createClient({
       username: 'default',
    password: 'AmlrCZT7DfA8LMOgmbeiEnXDif7YHcO0',
    socket: {
        host: 'redis-19434.crce281.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 19434
    }
})

module.exports=redisClient;

