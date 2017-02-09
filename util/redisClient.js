var redis = require('redis');
var config = require('../config');

var client = redis.createClient(config.RedisPort, config.RedisHost, { auth_pass: config.RedisPass });
//client.auth(config.RedisPass, function(){});
client.select(3, function() { console.log('select redis db 3'); });

var defaultExpired = parseInt(config.CacheExpired);

client.on('error', function(err) {
    console.error('Redis连接错误: ' + err);
    process.exit(1);
});

/**
 * 设置缓存
 * @param key 缓存key
 * @param value 缓存value
 * @param expired 缓存的有效时长，单位秒
 * @param callback 回调函数
 */
exports.setItem = function(key, value, expired, callback) {
    client.set(key, JSON.stringify(value), function(err) {
        if (err) {
            return callback(err);
        }
        if (typeof expired === 'function') {
            callback = expired;
        } else {
            client.expire(key, expired);
        }
        return callback(null);
    });
};

/**
 * 获取缓存
 * @param key 缓存key
 * @param callback 回调函数
 */
exports.getItem = function(key, callback) {
    client.get(key, function(err, value) {
        if (err) {
            return callback(err);
        }
        return callback(null, JSON.parse(value));
    });
};

/**
 * 移除缓存
 * @param key 缓存key
 * @param callback 回调函数
 */
exports.removeItem = function(key, callback) {
    client.del(key, function(err) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
};

exports.allKeys = function(callback) {
    client.keys("*", function(err, replies) {
        if (err) {
            return callback(err);
        }
        return callback(null, replies);
    });
};

exports.allValues = function(callback) {
    client.keys("*", function(err, replies) {
        if (err) {
            return callback(err);
        }
        client.mget(replies, function(err, replies) {
            if (err) {
                return callback(err);
            }
            return callback(null, replies);
        });
    });
}

exports.flushDB = function() {
    client.flushdb("*", function(err) {})
};

/**
 * 获取默认过期时间，单位秒
 */
exports.defaultExpired = defaultExpired;
