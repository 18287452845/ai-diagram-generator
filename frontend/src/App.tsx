import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import DiagramsPage from './pages/DiagramsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App