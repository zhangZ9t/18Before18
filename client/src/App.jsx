import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import ParentDashboard from './pages/ParentDashboard'
import TeenDashboard from './pages/TeenDashboard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="parent" />} />
        <Route path="/join" element={<AuthPage mode="teen" />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/teen" element={<TeenDashboard />} />
        <Route path="/tenant" element={<Navigate to="/teen" replace />} />
        <Route path="/dashboard" element={<Navigate to="/parent" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
