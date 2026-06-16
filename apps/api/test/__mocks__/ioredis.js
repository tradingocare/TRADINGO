const EventEmitter = require('events');

class MockIORedis extends EventEmitter {
  constructor() {
    super();
    this.status = 'ready';
    this.isCluster = false;
    this.options = {};
    this.duplicate = jest.fn(() => new MockIORedis());
    this.set = jest.fn().mockResolvedValue('OK');
    this.get = jest.fn().mockResolvedValue(null);
    this.del = jest.fn().mockResolvedValue(1);
    this.keys = jest.fn().mockResolvedValue([]);
    this.pipeline = jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
      hset: jest.fn(),
      hscan: jest.fn(),
      sscan: jest.fn(),
      runCommand: jest.fn(),
    }));
    this.multi = jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
      hset: jest.fn(),
      runCommand: jest.fn(),
    }));
    this.scan = jest.fn().mockResolvedValue(['0', []]);
    this.hmget = jest.fn().mockResolvedValue([]);
    this.hgetall = jest.fn().mockResolvedValue({});
    this.hset = jest.fn().mockResolvedValue(1);
    this.zadd = jest.fn().mockResolvedValue(1);
    this.zrange = jest.fn().mockResolvedValue([]);
    this.zrevrange = jest.fn().mockResolvedValue([]);
    this.lpush = jest.fn().mockResolvedValue(1);
    this.lrange = jest.fn().mockResolvedValue([]);
    this.lpop = jest.fn().mockResolvedValue(null);
    this.rpop = jest.fn().mockResolvedValue(null);
    this.llen = jest.fn().mockResolvedValue(0);
    this.expire = jest.fn().mockResolvedValue(1);
    this.ttl = jest.fn().mockResolvedValue(-1);
    this.exists = jest.fn().mockResolvedValue(0);
    this.incr = jest.fn().mockResolvedValue(1);
    this.sadd = jest.fn().mockResolvedValue(1);
    this.smembers = jest.fn().mockResolvedValue([]);
    this.srem = jest.fn().mockResolvedValue(1);
    this.sismember = jest.fn().mockResolvedValue(0);
    this.defineCommand = jest.fn();
    this.connect = jest.fn().mockResolvedValue(undefined);
    this.disconnect = jest.fn().mockResolvedValue(undefined);
    this.quit = jest.fn().mockResolvedValue(undefined);
    this.scanStream = jest.fn(() => new EventEmitter());
    this.runCommand = jest.fn();
    this.clientSetName = jest.fn();
    this.clientList = jest.fn();
    this.xadd = jest.fn();
    this.xread = jest.fn();
    this.xtrim = jest.fn();
  }
}

module.exports = MockIORedis;
module.exports.default = MockIORedis;
