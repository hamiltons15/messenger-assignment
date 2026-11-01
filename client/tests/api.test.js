import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, mergeMessages, formatMessageTime } from '../src/api.js'

test('HTTP status and JSON errors survive parsing for session/conflict handling', async () => {
  for (const status of [200, 401, 409, 503]) {
    const result = await requestJson('/test', {}, async () => new Response(JSON.stringify({ error: 'Reason' }), { status }))
    assert.equal(result.response.status, status)
    assert.equal(result.data.error, 'Reason')
  }
})
test('Network and non-JSON failures explain the backend boundary', async () => {
  await assert.rejects(requestJson('/test', {}, async () => { throw new TypeError('Failed to fetch') }), /Cannot reach the backend/)
  await assert.rejects(requestJson('/test', {}, async () => new Response('<html>proxy error</html>', { status: 502 })), /unreadable response \(HTTP 502\)/)
})
test('Obsolete reads retain cancellation rather than becoming connectivity errors', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(requestJson('/test', { signal: controller.signal }, async (path, options) => {
    options.signal.throwIfAborted()
  }), { name: 'AbortError' })
})
test('History and live records merge once with deterministic equal-time ordering', () => {
  const a = { id: 'a', createdAt: '2026-10-31T12:00:00Z', content: 'first' }
  const b = { ...a, id: 'b' }
  const c = { ...a, id: 'c', createdAt: '2026-10-31T12:00:01Z' }
  const result = mergeMessages([a, b], [a, c, b])
  assert.deepEqual(result.map(message => message.id), ['c', 'b', 'a'])
  assert.deepEqual(mergeMessages(result, result), result)
})
test('Stored message timestamps render with local date and time', () => {
  assert.match(formatMessageTime('2020-01-02T12:00:00Z'), /2020/)
  assert.match(formatMessageTime(new Date().toISOString()), /AM|PM/)
})
