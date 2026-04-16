import { useEffect, useState } from 'react'

export default function Issues() {
  const [issues, setIssues] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/issues')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then(setIssues)
      .catch(setError)
  }, [])

  return (
    <section>
      <h1>Issues</h1>
      {error && <p style={{ color: 'crimson' }}>불러오기 실패: {String(error)}</p>}
      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>{issue.title}</li>
        ))}
      </ul>
    </section>
  )
}
