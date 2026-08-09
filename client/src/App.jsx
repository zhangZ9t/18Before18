import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import ParentDashboard from './pages/ParentDashboard'
import TeenDashboard from './pages/TeenDashboard'

function DemoRedirect({ to }) {
  return <Navigate to={to} replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<DemoRedirect to="/parent" />} />
        <Route path="/signup" element={<DemoRedirect to="/parent" />} />
        <Route path="/join" element={<DemoRedirect to="/teen" />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/teen" element={<TeenDashboard />} />
        <Route path="/tenant" element={<DemoRedirect to="/teen" />} />
        <Route path="/dashboard" element={<DemoRedirect to="/parent" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
