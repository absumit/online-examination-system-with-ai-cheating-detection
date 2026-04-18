const redis = require('redis')

const redisClient = redis.createClient({
       username: 'default',
    password: 'bWopNoMkeJuIPQ8ZIysuRKbTYmd3QIWC',
    socket: {
        host: 'redis-14301.crce292.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 14301
    }
})

module.exports=redisClient;

