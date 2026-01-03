import {BrowserRouter, Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomerSignUp from './pages/Signup pages/CustomerSignUp'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup/customer" element={<CustomerSignUp />} />
        <Route path="/login/*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
