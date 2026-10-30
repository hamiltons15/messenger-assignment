import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

function mergeMessages(currentMessages, incomingMessages) {
  const messagesById = new Map()

  for (const message of currentMessages) {
    messagesById.set(message.id, message)
  }

  for (const message of incomingMessages) {
    if (!messagesById.has(message.id)) {
      messagesById.set(message.id, message)
    }
  }

  return [...messagesById.values()].sort((a, b) => {
    const timeDifference =
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()

    if (timeDifference !== 0) {
      return timeDifference
    }

    if (a.id === b.id) return 0

    return a.id > b.id ? -1 : 1
  })
}

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationsError, setConversationsError] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [nextCursor, setNextCursor] = useState(null)
  const [olderMessagesLoading, setOlderMessagesLoading] = useState(false)
  const [olderMessagesError, setOlderMessagesError] = useState('')
  const olderMessagesController = useRef(null)
  const [socketStatus, setSocketStatus] = useState('disconnected')
  const [socketError, setSocketError] = useState('')
  const socketRef = useRef(null)
  const messagesRef = useRef(messages)
  const reconnectPendingRef = useRef(false)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    return () => {
      olderMessagesController.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!token) return

    const socket = io({
      auth: { token },
      autoConnect: false,
    })

    reconnectPendingRef.current = false

    socketRef.current = socket

    let hasConnectedBefore = false

    socket.on('connect', () => {
      setSocketStatus('connected')
      setSocketError('')

      if (hasConnectedBefore) {
        reconnectPendingRef.current = true
        console.info('Socket.IO reconnected; conversation recovery needed.')
      }

      hasConnectedBefore = true
    })

    socket.on('connect_error', (err) => {
      setSocketStatus('disconnected')
      setSocketError(err.message)
    })

    socket.on('disconnect', () => {
      setSocketStatus('disconnected')
    })

    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [token])

  useEffect(() => {
    if (!token || !selectedConversationId) return

    const socket = socketRef.current
    if (!socket) return

    let active = true

    const recoveryControllers = new Set()

    const cancelRecovery = () => {
      for (const controller of recoveryControllers) {
        controller.abort()
      }

      recoveryControllers.clear()
    }

    const joinConversation = () => {
      socket.emit('conversation:join', selectedConversationId, (response) => {
        if (!active) return

        if (!response?.ok) {
          setSocketError(
            response?.error || 'Unable to join conversation.'
          )
        } else {
          setSocketError('')

          if (reconnectPendingRef.current) {
            reconnectPendingRef.current = false

            const controller = new AbortController()
            recoveryControllers.add(controller)

            const knownMessageIds = new Set(
              messagesRef.current.map((message) => message.id)
            )

            const newestKnownMessage = messagesRef.current.reduce(
              (newest, message) => {
                if (!newest) return message

                const messageTime = new Date(message.createdAt).getTime()
                const newestTime = new Date(newest.createdAt).getTime()

                if (messageTime > newestTime) return message

                if (
                  messageTime === newestTime &&
                  message.id > newest.id
                ) {
                  return message
                }

                return newest
              },
              null
            )

            const recoverMessages = async () => {
              let cursor = null
              let pageCount = 0
              let recoveredCount = 0
              const recoveredMessages = []
              const seenCursors = new Set()

              try {
                while (!controller.signal.aborted && active) {
                  const query = cursor
                    ? `?before=${encodeURIComponent(cursor)}`
                    : ''

                  const response = await fetch(
                    `/api/conversations/${selectedConversationId}/messages${query}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                      signal: controller.signal,
                    }
                  )

                  const data = await response.json()

                  if (!response.ok) {
                    throw new Error(data.error || 'Unable to recover messages.')
                  }

                  if (
                    !Array.isArray(data.messages) ||
                    !(typeof data.nextCursor === 'string' || data.nextCursor === null)
                  ) {
                    throw new Error('Invalid message history response.')
                  }

                  if (controller.signal.aborted || !active) return

                  pageCount += 1

                  const isNewerThanBoundary = (message) => {
                    if (!newestKnownMessage) return true

                    const messageTime = new Date(message.createdAt).getTime()
                    const boundaryTime = new Date(newestKnownMessage.createdAt).getTime()

                    return (
                      messageTime > boundaryTime ||
                      (
                        messageTime === boundaryTime &&
                        message.id > newestKnownMessage.id
                      )
                    )
                  }

                  const reachedKnownMessage = data.messages.some(
                    (message) => !isNewerThanBoundary(message)
                  )

                  const newMessages = data.messages.filter(
                    (message) =>
                      isNewerThanBoundary(message) &&
                      !knownMessageIds.has(message.id)
                  )

                  recoveredMessages.push(...newMessages)
                  recoveredCount += newMessages.length

                  if (reachedKnownMessage || data.nextCursor === null) {
                    break
                  }

                  if (
                    data.messages.length === 0 ||
                    seenCursors.has(data.nextCursor)
                  ) {
                    throw new Error('Recovery pagination did not advance.')
                  }

                  seenCursors.add(data.nextCursor)
                  cursor = data.nextCursor
                }

                if (controller.signal.aborted || !active) return

                if (recoveredMessages.length > 0) {
                  setMessages((currentMessages) =>
                    mergeMessages(currentMessages, recoveredMessages)
                  )
                }

                console.info(
                  `Recovery scanned ${pageCount} page(s) and found ${recoveredCount} messages not previously loaded.`
                )
              } catch (err) {
                if (!controller.signal.aborted && active) {
                  console.error('Message recovery failed:', err)
                }
              } finally {
                recoveryControllers.delete(controller)
              }
            }

            void recoverMessages()

            console.info(
              'Authorized conversation rejoined; recovery controller created.'
            )
          }
        }
      })
    }

    socket.on('connect', joinConversation)
    socket.on('disconnect', cancelRecovery)


    if (socket.connected) {
      joinConversation()
    }

    return () => {
      active = false

      cancelRecovery()

      socket.off('connect', joinConversation)
      socket.off('disconnect', cancelRecovery)

      if (socket.connected) {
        socket.emit('conversation:leave', selectedConversationId)
      }
    }
  }, [token, selectedConversationId])

  useEffect(() => {
    if (!token || !selectedConversationId) return

    const socket = socketRef.current
    if (!socket) return

    const handleNewMessage = (message) => {
      if (
        !message ||
        typeof message.id !== 'string' ||
        message.conversation !== selectedConversationId
      ) {
        return
      }

      setMessages((currentMessages) => {
        if (currentMessages.some((existing) => existing.id === message.id)) {
          return currentMessages
        }

        return mergeMessages(currentMessages, [message])
      })
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
    }
  }, [token, selectedConversationId])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadConversations() {
      try {
        const response = await fetch('/api/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to retrieve conversations.')
        }

        if (!Array.isArray(data.conversations)) {
          throw new Error('Invalid conversation response.')
        }

        if (!controller.signal.aborted) {
          setConversations(data.conversations)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setConversationsError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setConversationsLoading(false)
        }
      }
    }

    loadConversations()

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || !selectedConversationId) return

    const controller = new AbortController()

    async function loadMessages() {
      try {
        const response = await fetch(
          `/api/conversations/${selectedConversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to retrieve messages.')
        }

        if (!Array.isArray(data.messages)) {
          throw new Error('Invalid message history response.')
        }

        if (!controller.signal.aborted) {
          setMessages((currentMessages) =>
            mergeMessages(currentMessages, data.messages)
          )

          setNextCursor(data.nextCursor ?? null)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setMessagesError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setMessagesLoading(false)
        }
      }
    }

    loadMessages()

    return () => controller.abort()
  }, [token, selectedConversationId])

  async function handleLoadOlderMessages() {
    if (
      !token ||
      !selectedConversationId ||
      !nextCursor ||
      messagesLoading ||
      olderMessagesController.current
    ) {
      return
    }

    const controller = new AbortController()
    olderMessagesController.current = controller

    setOlderMessagesLoading(true)
    setOlderMessagesError('')

    try {
      const response = await fetch(
        `/api/conversations/${selectedConversationId}/messages?before=${encodeURIComponent(nextCursor)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load older messages.')
      }

      if (
        !Array.isArray(data.messages) ||
        !(typeof data.nextCursor === 'string' || data.nextCursor === null)
      ) {
        throw new Error('Invalid message history response.')
      }

      if (controller.signal.aborted) return

      setMessages((currentMessages) =>
        mergeMessages(currentMessages, data.messages)
      )

      setNextCursor(data.nextCursor)
    } catch (err) {
      if (!controller.signal.aborted) {
        setOlderMessagesError(
          err instanceof Error ? err.message : 'Unable to load older messages.'
        )
      }
    } finally {
      if (olderMessagesController.current === controller) {
        olderMessagesController.current = null
        setOlderMessagesLoading(false)
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to log in.')
      }
      setConversations([])
      setConversationsError('')
      setConversationsLoading(true)
      setSelectedConversationId(null)

      setToken(data.token)
      setUser(data.user)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }



  function handleLogout() {
    olderMessagesController.current?.abort()
    olderMessagesController.current = null
    setToken(null)
    setUser(null)
    setUsername('')
    setPassword('')
    setError('')
    setConversations([])
    setConversationsLoading(false)
    setConversationsError('')
    setSelectedConversationId(null)
    setMessages([])
    setMessagesLoading(false)
    setMessagesError('')
    setNextCursor(null)
    setOlderMessagesLoading(false)
    setOlderMessagesError('')

  }

  if (token && user) {
    return (
      <main>
        <h1>Messenger</h1>
        <p>Logged in as {user.username}</p>

        <button type="button" onClick={handleLogout}>
          Log out
        </button>

        <p role="status">Live connection: {socketStatus}</p>

        {socketError && (
          <p role="alert">{socketError}</p>
        )}

        <h2>Conversations</h2>

        {conversationsLoading && <p>Loading conversations...</p>}

        {conversationsError && (
          <p role="alert">{conversationsError}</p>
        )}

        {!conversationsLoading &&
          !conversationsError &&
          conversations.length === 0 && (
            <p>No conversations available.</p>
          )}

        {!conversationsLoading && !conversationsError && (
          <ul>
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => {
                    olderMessagesController.current?.abort()
                    olderMessagesController.current = null
                    setMessages([])
                    setMessagesError('')
                    setMessagesLoading(true)
                    setNextCursor(null)
                    setOlderMessagesLoading(false)
                    setOlderMessagesError('')
                    setSelectedConversationId(conversation.id)
                  }}
                >
                  {conversation.name || conversation.type} — {conversation.id}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedConversationId && (
          <section>
            <h2>Selected Conversation</h2>
            <p>{selectedConversationId}</p>

            <h3>Messages</h3>

            {messagesLoading && <p>Loading messages...</p>}

            {messagesError && <p role="alert">{messagesError}</p>}

            {!messagesLoading &&
              !messagesError &&
              messages.length === 0 && (
                <p>No messages available.</p>
              )}

            {!messagesLoading && !messagesError && (
              <ul>
                {[...messages].reverse().map((message) => (
                  <li key={message.id}>
                    <strong>{message.sender}:</strong> {message.content}
                  </li>
                ))}
              </ul>
            )}
            {!messagesLoading && !messagesError && nextCursor && (
              <button
                type="button"
                onClick={handleLoadOlderMessages}
                disabled={olderMessagesLoading}
              >
                {olderMessagesLoading ? 'Loading...' : 'Load older messages'}
              </button>
            )}

            {olderMessagesLoading && <p>Loading older messages...</p>}

            {olderMessagesError && (
              <p role="alert">{olderMessagesError}</p>
            )}

          </section>
        )}

      </main>
    )
  }


  return (
    <main>
      <h1>Messenger</h1>
      <h2>Log in</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

export default App
