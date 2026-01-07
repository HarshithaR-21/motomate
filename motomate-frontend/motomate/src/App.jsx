import {BrowserRouter, Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomerSignUp from './pages/Signup pages/CustomerSignUp'
import Login from './pages/Login'
import RolesPage from './Components/RolesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<RolesPage />} />
        <Route path="/signup/:role" element={<CustomerSignUp />} />
        <Route path="/login/*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
