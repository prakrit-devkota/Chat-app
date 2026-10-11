import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/home.jsx'
import LoginPage from './pages/login.jsx'
import RegisterPage from './pages/register.jsx'
import ChatPage from './pages/chatpage.jsx'
import { useNavigate } from 'react-router-dom'



function App() {
  const navigate = useNavigate()
  return (
    <Routes>
      <Route path="/" element={<HomePage   onRegister={() => navigate('/register')}
            onLogin={() => navigate('/login')}
            onGuest={() => navigate('/chat')}/>} />
     <Route path="/login" element={<LoginPage />} />
     <Route path="/register" element={<RegisterPage />} />
     <Route path="/chat" element={<ChatPage />} />
      
    </Routes>
  )
}

export default App