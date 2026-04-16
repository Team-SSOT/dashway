import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Issues from './pages/Issues.jsx'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/">Home</Link>
        <Link to="/issues">Issues</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/issues" element={<Issues />} />
      </Routes>
    </div>
  )
}
