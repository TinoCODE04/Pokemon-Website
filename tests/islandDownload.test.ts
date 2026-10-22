import assert from 'node:assert/strict'
import test from 'node:test'
import { downloadIslandModel } from '../src/utils/islandDownload.ts'

test('streams a versioned model with cache reuse and real byte progress', async () => {
  const progress: number[] = []
  const result = await downloadIslandModel('/models/test-hash.glb', {
    signal: new AbortController().signal,
    expectedBytes: 4,
    onProgress: (value) => progress.push(value),
    fetcher: async (url, options) => {
      assert.equal(url, '/models/test-hash.glb')
      assert.equal(options?.cache, 'force-cache')
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2])); controller.enqueue(new Uint8Array([3, 4])); controller.close() } }))
    },
  })
  assert.deepEqual([...new Uint8Array(result)], [1, 2, 3, 4])
  assert.ok(progress.some((value) => value > 0 && value < 100))
  assert.equal(progress.at(-1), 100)
  assert.ok(progress.every((value, index) => !index || value >= progress[index - 1]))
})

test('cancelling a stalled stream releases the reader and rejects instead of preparing a partial model', async () => {
  const controller = new AbortController()
  let cancelled = false
  const pending = downloadIslandModel('/model.glb', {
    signal: controller.signal,
    expectedBytes: 4,
    onProgress: (value) => { if (value > 0) controller.abort() },
    fetcher: async () => new Response(new ReadableStream({ start(reader) { reader.enqueue(new Uint8Array([1])) }, cancel() { cancelled = true } })),
  })
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(cancelled, true)
})

test('an already cancelled load never starts a request', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(downloadIslandModel('/model.glb', { signal: controller.signal, onProgress() {}, fetcher: async () => { throw new Error('Must not request') } }), { name: 'AbortError' })
})

test('HTTP failures and incomplete responses cannot become a ready model', async () => {
  const options = { signal: new AbortController().signal, onProgress() {} }
  await assert.rejects(downloadIslandModel('/model.glb', { ...options, fetcher: async () => new Response('Unavailable', { status: 503 }) }), /503/)
  await assert.rejects(downloadIslandModel('/model.glb', { ...options, expectedBytes: 4, fetcher: async () => new Response(new Uint8Array([1, 2])) }), /incomplete/i)
})
