import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'
import { requestJson as fetchJson, mergeMessages, formatMessageTime } from './api.js'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [notice, setNotice] = useState('')
  const [activityConversation, setActivityConversation] = useState(null)
  const [conversationType, setConversationType] = useState('direct')
  const [inviteeNames, setInviteeNames] = useState('')
  const [groupName, setGroupName] = useState('')
  const [conversationCreating, setConversationCreating] = useState(false)
  const [conversationCreateError, setConversationCreateError] = useState('')
  const [conversationReload, setConversationReload] = useState(0)
  const conversationCreateRequestRef = useRef(0)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationsError, setConversationsError] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [messageSendError, setMessageSendError] = useState('')
  const messageSendRequestRef = useRef(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [olderMessagesLoading, setOlderMessagesLoading] = useState(false)
  const [olderMessagesError, setOlderMessagesError] = useState('')
  const olderMessagesController = useRef(null)
  const [socketStatus, setSocketStatus] = useState('disconnected')
  const [socketError, setSocketError] = useState('')
  const socketRef = useRef(null)
  const messagesRef = useRef(messages)
  const [historyReload, setHistoryReload] = useState(0)
  const [sendStatus, setSendStatus] = useState('')
  const sessionEpochRef = useRef(0)

  const endSession = useCallback((message = '') => {
    sessionEpochRef.current += 1
    conversationCreateRequestRef.current += 1
    setConversationCreating(false)
    setConversationCreateError('')
    setInviteeNames('')
    setGroupName('')
    setNotice('')
    setActivityConversation(null)
    setSendStatus('')
    setSocketError('')
    setSocketStatus('disconnected')
    messageSendRequestRef.current += 1
    setMessageContent('')
    setMessageSending(false)
    setMessageSendError('')
    olderMessagesController.current?.abort()
    olderMessagesController.current = null
    setToken(null)
    setUser(null)
    setUsername('')
    setPassword('')
    setError(message)
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

  }, [])

  const requestJson = useCallback(async (path, options) => {
    const epoch = sessionEpochRef.current
    const result = await fetchJson(path, options)
    if (result.response.status === 401 && token && epoch === sessionEpochRef.current) {
      endSession('Session expired or rejected. Log in again.')
      throw new Error('Session expired or rejected. Log in again.')
    }
    return result
  }, [endSession, token])

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

    socketRef.current = socket

    let hasConnectedBefore = false

    socket.on('connect', () => {
      setSocketStatus('joining')
      setSocketError('')

      if (hasConnectedBefore) {
        console.info('Socket.IO reconnected; conversation recovery needed.')
      }

      hasConnectedBefore = true
    })

    socket.on('connect_error', (err) => {
      setSocketStatus('disconnected')

      const authenticationErrors = [
        'Authentication required.',
        'Invalid authentication token.',
        'Invalid or expired authentication token.',
      ]

      if (authenticationErrors.includes(err.message)) {
        endSession('Session expired or rejected. Log in again.')
        return
      }

      setSocketError(err.message)
    })

    socket.on('disconnect', (reason) => {
      setSocketStatus('disconnected')
      if (reason === 'io server disconnect') {
        endSession('Session expired or ended by the server. Log in again.')
      } else {
        setSocketError('Live connection lost. Reconnecting; saved history will be recovered.')
      }
    })

    socket.on('conversation:activity', activity => {
      if (activity?.conversationId && activity.sender !== user?.id) {
        setActivityConversation(activity.conversationId)
      }
    })

    socket.on('conversation:created', event => {
      if (event?.conversationId) {
        setConversationsLoading(true)
        setConversationsError('')
        setConversationReload(value => value + 1)
      }
    })

    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [token, endSession, user])

  useEffect(() => {
    if (!token || !selectedConversationId) return

    const socket = socketRef.current
    if (!socket) return

    let active = true

    const recoveryControllers = new Set()
    let joinRun = 0

    const cancelRecovery = () => {
      joinRun += 1
      for (const controller of recoveryControllers) {
        controller.abort()
      }

      recoveryControllers.clear()
    }

    const joinConversation = () => {
      cancelRecovery()
      const run = joinRun
      setSocketStatus('joining')

        socket.timeout(5000).emit(
          'conversation:join',
          selectedConversationId,
          (err, response) => {
            if (!active || run !== joinRun || !socket.connected) return

            if (err) {
              setSocketStatus('disconnected')
              setSocketError('Conversation join timed out.')
              return
            }

        if (!response?.ok) {
          setSocketStatus('denied')
          setSocketError(
            response?.error || 'Unable to join conversation.'
          )
        } else {
          setSocketStatus('live')
          setSocketError('')

          { // Recover after every authorized join, including the first subscription.
            const controller = new AbortController()
            recoveryControllers.add(controller)

            const knownMessageIds = new Set(
              messagesRef.current.map((message) => message.id)
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

                  const { response, data } = await requestJson(
                    `/api/conversations/${selectedConversationId}/messages${query}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                      signal: controller.signal,
                    }
                  )


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

                  const newMessages = data.messages.filter(message => !knownMessageIds.has(message.id))
                  recoveredMessages.push(...data.messages)
                  recoveredCount += newMessages.length
                  for (const message of data.messages) knownMessageIds.add(message.id)

                  if (data.nextCursor === null) break

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

                  setMessagesError(
                    err instanceof Error
                      ? `Message recovery failed: ${err.message}`
                      : 'Message recovery failed.'
                  )
                }
              } finally {

                recoveryControllers.delete(controller)
              }
            }

            void recoverMessages()

            console.info(
              'Authorized conversation joined; history synchronization started.'
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
  }, [token, selectedConversationId, requestJson])

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
        const { response, data } = await requestJson('/api/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })


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
  }, [token, conversationReload, requestJson])

  useEffect(() => {
    if (!token || !selectedConversationId) return

    const controller = new AbortController()

    async function loadMessages() {
      try {
        const { response, data } = await requestJson(
          `/api/conversations/${selectedConversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )


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
  }, [token, selectedConversationId, historyReload, requestJson])

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
      const { response, data } = await requestJson(
        `/api/conversations/${selectedConversationId}/messages?before=${encodeURIComponent(nextCursor)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      )


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

  async function handleSendMessage(event) {
    event.preventDefault()

    const content = messageContent.trim()

    if (!token || !selectedConversationId || !content || messageSending) {
      return
    }

    const requestId = ++messageSendRequestRef.current
    const conversationId = selectedConversationId

    setMessageSending(true)
    setSendStatus('Sending…')
    setMessageSendError('')

    try {
          const socket = socketRef.current

          if (!socket?.connected || socketStatus !== 'live') {
            throw new Error('Socket.IO is not authorized for this conversation.')
          }

          const result = await socket
            .timeout(5000)
            .emitWithAck('message:send', {
              conversationId,
              content,
            })

          if (messageSendRequestRef.current !== requestId) {
            return
          }

          if (!result?.ok) {
            throw new Error(result?.error || 'Unable to send message.')
          }

          const message = result.message

          if (
            !message ||
            typeof message.id !== 'string' ||
            message.conversation !== conversationId
          ) {
            throw new Error('Invalid message response.')
          }

          if (messageSendRequestRef.current !== requestId) {
            return
          }

          setMessages((currentMessages) =>
            mergeMessages(currentMessages, [message])
          )

          setMessageContent('')
          setSendStatus('Sent — saved by the server.')
        } catch (err) {

      if (messageSendRequestRef.current === requestId) {
        setSendStatus('Failed to confirm delivery.')
        setMessageSendError(`${err instanceof Error ? err.message : 'Unable to send message.'} Delivery is unconfirmed. Check history before sending again; this message was not automatically retried.`)
      }
    } finally {
      if (messageSendRequestRef.current === requestId) {
        setMessageSending(false)
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault()

    if (loading) return

    setError('')
    setNotice('')
    setLoading(true)

    try {
      const { response, data } = await requestJson(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })


      if (!response.ok) {
        throw new Error(data.error || 'Unable to log in.')
      }
      if (authMode === 'register') {
        setAuthMode('login')
        setPassword('')
        setNotice('Account created. Log in with your new account.')
        return
      }
      setConversations([])
      setConversationsError('')
      setConversationsLoading(true)
      setSelectedConversationId(null)

      sessionEpochRef.current += 1
      setToken(data.token)
      setUser(data.user)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function selectConversation(id) {
    if (activityConversation === id) setActivityConversation(null)
    if (id === selectedConversationId) return
    setSendStatus('')
    messageSendRequestRef.current += 1
    setMessageContent('')
    setMessageSending(false)
    setMessageSendError('')
    olderMessagesController.current?.abort()
    olderMessagesController.current = null
    setMessages([])
    setMessagesError('')
    setMessagesLoading(true)
    setNextCursor(null)
    setOlderMessagesLoading(false)
    setOlderMessagesError('')
    setSelectedConversationId(id)
  }

  function refreshConversations() {
    setConversationsLoading(true)
    setConversationsError('')
    setConversationReload(value => value + 1)
  }

  async function handleCreateConversation(event) {
    event.preventDefault()
    if (!token || conversationCreating) return
    const requestId = ++conversationCreateRequestRef.current
    setConversationCreating(true)
    setConversationCreateError('')
    setNotice('')
    try {
      const { response, data } = await requestJson('/api/conversations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: conversationType,
          usernames: inviteeNames.split(',').map(value => value.trim()),
          ...(conversationType === 'group' ? { name: groupName } : {}),
        }),
      })
      if (requestId !== conversationCreateRequestRef.current) return
      if (!response.ok) {
        if (response.status === 409 && conversationType === 'direct') {
          refreshConversations()
          if (data.conversation?.id) selectConversation(data.conversation.id)
          setNotice('This direct conversation already exists. Use it from your conversation list.')
          setInviteeNames('')
          setGroupName('')
          return
        }

        throw new Error(data.error || 'Unable to create conversation.')
      }

      refreshConversations()
      if (data.conversation?.id) selectConversation(data.conversation.id)
      setNotice('Conversation created.')

      setInviteeNames('')
      setGroupName('')
    } catch (err) {
      if (requestId === conversationCreateRequestRef.current) setConversationCreateError(err.message)
    } finally {
      if (requestId === conversationCreateRequestRef.current) setConversationCreating(false)
    }
  }



  if (token && user) {
    return (
      <main>
        <h1>Messenger</h1>
        <p>Logged in as {user.username}</p>

        <button type="button" onClick={() => endSession()}>
          Log out
        </button>

        <p role="status">Live connection: {socketStatus}</p>

        {socketError && (
          <p role="alert">{socketError}</p>
        )}

        <h2>Conversations</h2>

        <button type="button" onClick={refreshConversations} disabled={conversationsLoading}>
          Refresh conversations
        </button>
        <form onSubmit={handleCreateConversation}>
          <h3>Start a conversation</h3>
          <label htmlFor="conversation-type">Type</label>
          <select id="conversation-type" value={conversationType}
            onChange={event => setConversationType(event.target.value)} disabled={conversationCreating}>
            <option value="direct">Direct</option>
            <option value="group">Group</option>
          </select>
          <label htmlFor="invitees">
            {conversationType === 'direct' ? 'Other username' : 'Other usernames, separated by commas'}
          </label>
          <input id="invitees" value={inviteeNames} required disabled={conversationCreating}
            onChange={event => setInviteeNames(event.target.value)} />
          <p>You are included automatically. Groups require at least two other registered users.</p>
          {conversationType === 'group' && <>
            <label htmlFor="group-name">Group name (optional)</label>
            <input id="group-name" value={groupName} maxLength={80} disabled={conversationCreating}
              onChange={event => setGroupName(event.target.value)} />
          </>}
          <button type="submit" disabled={conversationCreating || !inviteeNames.trim()}>
            {conversationCreating ? 'Creating...' : 'Create conversation'}
          </button>
          {conversationCreateError && <p role="alert">{conversationCreateError}</p>}
        </form>
        {notice && <p role="status">{notice}</p>}
        {activityConversation && <p role="status">
          New message in {conversations.find(conversation => conversation.id === activityConversation)?.name
            || conversations.find(conversation => conversation.id === activityConversation)?.participants?.map(person => person.username).join(', ')
            || 'an authorized conversation; refresh the conversation list to find it'}.
        </p>}

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
                  onClick={() => selectConversation(conversation.id)}
                >
                  {conversation.name || conversation.type} — {conversation.participants?.map(person => person.username).join(', ') || conversation.id}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedConversationId && (
          <section>
            <h2>Selected Conversation</h2>
            <p>{conversations.find(conversation => conversation.id === selectedConversationId)?.participants?.map(person => person.username).join(', ')}</p>
            <button type="button" disabled={messagesLoading} onClick={() => {
              setMessagesError('')
              setMessagesLoading(true)
              setHistoryReload(value => value + 1)
            }}>Refresh history</button>

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
                    <strong>{conversations.find(conversation => conversation.id === selectedConversationId)?.participants?.find(person => person.id === message.sender)?.username || message.sender}:</strong> {message.content}
                    {' '}<time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
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


            <h3>Send Message</h3>

            <form onSubmit={handleSendMessage}>

              <label htmlFor="message-content">Message</label>

              <input
                id="message-content"
                type="text"
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
                disabled={messageSending}
                required
                maxLength={2000}
              />

              <button
                type="submit"
                disabled={messageSending || !messageContent.trim()}
              >
                {messageSending ? 'Sending...' : 'Send'}
              </button>
            </form>

            {sendStatus && <p role="status">{sendStatus}</p>}
            {messageSendError && (
              <p role="alert">{messageSendError}</p>
            )}

          </section>
        )}

      </main>
    )
  }


  return (
    <main>
      <h1>Messenger</h1>
      <h2>{authMode === 'register' ? 'Register' : 'Log in'}</h2>
      <button type="button" disabled={loading} onClick={() => {
        setAuthMode(authMode === 'login' ? 'register' : 'login')
        setError('')
        setNotice('')
        setPassword('')
      }}>
        {authMode === 'login' ? 'Create an account' : 'Back to login'}
      </button>
      {authMode === 'register' && <p>Username: 3–30 letters, numbers, or underscores. Password: at least 6 characters, at most 72 UTF-8 bytes.</p>}
      {notice && <p role="status">{notice}</p>}

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            autoComplete="username"
            disabled={loading}
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
            autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : authMode === 'register' ? 'Register' : 'Log in'}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

export default App
