import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomerSignUp from './pages/Signup pages/CustomerSignUp'
import RolesPage from './Components/RolesPage'
import CustomerDashboard from './pages/Customer/CustomerDashboard'
import VehicleServices from './pages/Customer/VehicleServices'
import BookService from './pages/Customer/BookService'
import Login from './pages/Login pages/Login'
import ServiceHistory from './pages/Customer/ServiceHistory'
import ServiceCenterSignup from './pages/Signup pages/ServiceCenterSignup'
import FleetManagerSignup from './pages/Signup pages/FleetManagerSignUp'
import AdminDashboard from './pages/Admin/pages/AdminDashboard'
import { FleetManagerVerifications, ServiceCenterVerifications } from './pages/Admin/pages/VerificationsPage'
import IssuesPage from './pages/Admin/pages/IssuesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<RolesPage />} />
        <Route path="/signup/:role" element={<CustomerSignUp />} />
        <Route path="/signup/service-center" element={<ServiceCenterSignup />} />
        <Route path="/signup/fleet-manager" element={<FleetManagerSignup />} />

        <Route path="/login" element={<RolesPage />} />
        <Route path="/login/:role" element={<Login />} />
        
        <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        <Route path="/dashboard/customer/vehicle-services" element={<VehicleServices />} />
        <Route path="/dashboard/customer/vehicle-services/book-service" element={<BookService />} />
        <Route path='/dashboard/customer/service-history' element={<ServiceHistory />} />
        <Route path='/dashboard/admin' element={<AdminDashboard />} />
        <Route path='/admin/verifications/service-centers' element={<ServiceCenterVerifications />} />
        <Route path='/admin/verifications/fleet-managers' element={<FleetManagerVerifications />} />
        <Route path='/admin/issues' element={<IssuesPage />} />

      </Routes>
    </BrowserRouter>
  )
}
export default App
