import {BrowserRouter, Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomerSignUp from './pages/Signup pages/CustomerSignUp'
import RolesPage from './Components/RolesPage'
import CustomerDashboard from './pages/Customer/CustomerDashboard'
import VehicleServices from './pages/Customer/VehicleServices'
import BookService from './pages/Customer/BookService'
import Login from './pages/Login pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<RolesPage />} />
        <Route path="/signup/:role" element={<CustomerSignUp />} />
        <Route path="/login" element={<RolesPage />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        <Route path="/dashboard/customer/vehicle-services" element={<VehicleServices />} />
        <Route path="/dashboard/customer/vehicle-services/book-service" element={<BookService />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
