// Preserve HTTP status so the caller can distinguish expired sessions and conflicts.
export async function requestJson(path, options = {}, fetchImpl = fetch) {
  const timeout = AbortSignal.timeout(10000)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  let response
  try {
    response = await fetchImpl(path, { ...options, signal })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new Error('Cannot reach the backend or the request timed out. Try again when connected.', { cause: error })
  }
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Backend returned an unreadable response (HTTP ${response.status}). Check the backend connection.`)
  }
  return { response, data }
}

export function mergeMessages(currentMessages, incomingMessages) {
  const byId = new Map(currentMessages.map(message => [message.id, message]))
  for (const message of incomingMessages) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => {
    const difference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return difference || (a.id === b.id ? 0 : a.id > b.id ? -1 : 1)
  })
}

export function formatMessageTime(value) {
  const date = new Date(value)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
