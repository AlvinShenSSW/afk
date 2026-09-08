import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { CLEANUP_TIMEOUT_MS, supervise } from './windows-shell.mjs';

function fixture() {
  const child = new EventEmitter();
  child.pid = 123;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}
const request = { command: 'synthetic', args: [], stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 25, maxBuffer: 100, killSignal: 'SIGKILL' };

for (const cause of ['ETIMEDOUT', 'ENOBUFS']) {
  test(`supervisor ${cause} terminates before accepting closure`, async () => {
    const child = fixture();
    const kills = [];
    const result = supervise(request, {
      spawnImpl: () => child,
      killImpl: (bin, args, options) => {
        kills.push({ args, options });
        queueMicrotask(() => { child.emit('exit', 1, null); child.emit('close', 1, null); });
        return { status: 0 };
      },
    });
    if (cause === 'ENOBUFS') child.stdout.write(Buffer.alloc(101));
    const outcome = await result;
    assert.equal(outcome.error.code, cause);
    assert.equal(outcome.signal, 'SIGKILL');
    assert.equal(outcome.status, null);
    assert.equal(kills.length, 1);
    assert.deepEqual(kills[0].args, ['/PID', '123', '/T', '/F']);
    assert.ok(kills[0].options.timeout > 0 && kills[0].options.timeout <= CLEANUP_TIMEOUT_MS);
  });
}

for (const killed of [{ status: 5 }, { status: null, error: { code: 'ETIMEDOUT' } }]) {
  test(`failed tree cleanup (${killed.error?.code ?? killed.status}) remains distinct`, async () => {
    const outcome = await supervise(request, { spawnImpl: fixture, killImpl: () => killed });
    assert.equal(outcome.error.code, 'ERR_AFK_TREE_CLEANUP');
    assert.match(outcome.error.message, /initial cause: ETIMEDOUT/);
    assert.equal(outcome.status, null);
  });
}

test('shell exit with retained pipe handles has a bounded drain and no stale PID kill', async () => {
  const child = fixture();
  let kills = 0;
  const result = supervise(request, { spawnImpl: () => child, killImpl: () => { kills++; return { status: 0 }; } });
  child.emit('exit', 0, null);
  const outcome = await result;
  assert.equal(outcome.error.code, 'ERR_AFK_TREE_CLEANUP');
  assert.equal(outcome.status, null);
  assert.equal(kills, 0);
});

test('normal closure preserves raw bytes and does not terminate', async () => {
  const child = fixture();
  const result = supervise(request, { spawnImpl: () => child,
    killImpl: () => { assert.fail('normal close must not terminate'); } });
  const bytes = Buffer.from('hello 世界');
  child.stdout.write(bytes.subarray(0, 8));
  child.stdout.write(bytes.subarray(8));
  child.stderr.write('diagnostic');
  child.emit('exit', 0, null);
  child.emit('close', 0, null);
  const outcome = await result;
  assert.equal(outcome.error, undefined);
  assert.equal(outcome.status, 0);
  assert.deepEqual(Buffer.from(outcome.output[1], 'base64'), bytes);
  assert.equal(Buffer.from(outcome.output[2], 'base64').toString(), 'diagnostic');
});
