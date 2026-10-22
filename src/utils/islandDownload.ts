interface DownloadOptions {
  signal: AbortSignal
  expectedBytes?: number
  onProgress: (percent: number) => void
  fetcher?: typeof fetch
}

/** URLs are content hashed, so cached bytes remain valid across page visits. */
export async function downloadIslandModel(url: string, { signal, expectedBytes, onProgress, fetcher = fetch }: DownloadOptions): Promise<ArrayBuffer> {
  signal.throwIfAborted()
  const response = await fetcher(url, { signal, cache: 'force-cache' })
  if (!response.ok) throw new Error(`Island download failed (${response.status})`)
  const reader = response.body?.getReader()
  const total = expectedBytes ?? Number(response.headers.get('Content-Length'))
  let bytes: Uint8Array
  if (reader) {
    const chunks: Uint8Array[] = []
    let received = 0
    const cancel = () => { void reader.cancel().catch(() => {}) }
    signal.addEventListener('abort', cancel, { once: true })
    try {
      signal.throwIfAborted()
      while (true) {
        const { value, done } = await reader.read()
        signal.throwIfAborted()
        if (done) break
        chunks.push(value)
        received += value.byteLength
        if (total > 0) onProgress(Math.min(99, Math.round(received / total * 100)))
      }
    } finally {
      signal.removeEventListener('abort', cancel)
      reader.releaseLock()
    }
    bytes = new Uint8Array(received)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  } else {
    bytes = new Uint8Array(await response.arrayBuffer())
  }
  signal.throwIfAborted()
  if (expectedBytes !== undefined && bytes.byteLength !== expectedBytes) throw new Error('Island download is incomplete')
  onProgress(100)
  return bytes.buffer as ArrayBuffer
}
