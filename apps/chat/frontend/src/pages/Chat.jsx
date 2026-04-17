import { useEffect, useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/messages')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then(setMessages)
      .catch(setError)
  }, [])

  return (
    <section>
      <h1>Messages</h1>
      {error && <p style={{ color: 'crimson' }}>불러오기 실패: {String(error)}</p>}
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{message.author}</strong>: {message.content}
          </li>
        ))}
      </ul>
    </section>
  )
}
