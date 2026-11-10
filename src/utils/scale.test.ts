import test from 'node:test';
import assert from 'node:assert/strict';
import { TTLCache, RequestDeduplicator, SlidingWindowRateLimiter } from './scale';

test('TTLCache stores, retrieves, and expires items correctly', async () => {
  const cache = new TTLCache<string>(10, 50); // 50ms TTL
  cache.set('key1', 'value1');

  assert.equal(cache.get('key1'), 'value1');
  assert.equal(cache.has('key1'), true);

  // Wait for expiry
  await new Promise((r) => setTimeout(r, 60));

  assert.equal(cache.get('key1'), null);
  assert.equal(cache.has('key1'), false);
  const stats = cache.getStats();
  assert.equal(stats.hits, 1);
  assert.equal(stats.misses, 1);
});

test('RequestDeduplicator deduplicates simultaneous parallel calls', async () => {
  const deduplicator = new RequestDeduplicator<string>();
  let executionCount = 0;

  const expensiveFetch = async () => {
    executionCount++;
    await new Promise((r) => setTimeout(r, 20));
    return 'result-data';
  };

  // Launch 10 concurrent requests with the same key
  const promises = Array.from({ length: 10 }, () =>
    deduplicator.execute('query-key', expensiveFetch)
  );

  const results = await Promise.all(promises);

  // All 10 callers receive the same result, but the worker only executes ONCE
  assert.equal(executionCount, 1);
  assert.equal(results.length, 10);
  assert.ok(results.every((r) => r === 'result-data'));
});

test('SlidingWindowRateLimiter enforces request thresholds', () => {
  const limiter = new SlidingWindowRateLimiter(3, 1000); // 3 requests per second

  const r1 = limiter.check('client-ip-1');
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = limiter.check('client-ip-1');
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = limiter.check('client-ip-1');
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th request must be rejected
  const r4 = limiter.check('client-ip-1');
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);

  // Different client should still be allowed
  const rOther = limiter.check('client-ip-2');
  assert.equal(rOther.allowed, true);
});
