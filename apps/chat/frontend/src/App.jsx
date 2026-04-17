import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/">Home</Link>
        <Link to="/chat">Chat</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  )
}
