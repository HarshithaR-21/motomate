import { BrowserRouter, Routes, Route } from 'react-router-dom'

// ── CRITICAL: Leaflet CSS must be imported at the app root so maps render correctly.
// Without this, map tiles load but the container has zero height and markers are mispositioned.
import 'leaflet/dist/leaflet.css'

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
import SCODashboard from './pages/SCO/pages/SCODashboard'
import SCOServices from './pages/SCO/pages/SCOServices'
import SCOWorkers from './pages/SCO/pages/SCOWorkers'
import SCORequests from './pages/SCO/pages/SCORequests'
import SCOProfile from './pages/SCO/pages/SCOProfile'
import FleetDashboard from './pages/FleetManager/pages/FleetDashboard'
import VehicleManagement from './pages/FleetManager/pages/VehicleManagement'
import ServiceTracking from './pages/FleetManager/pages/ServiceTracking'
import BulkScheduling from './pages/FleetManager/pages/BulkScheduling'
import MaintenanceReports from './pages/FleetManager/pages/MaintenanceReports'

// ── Worker Dashboard ──────────────────────────────────────────────────────────
import WorkerLayout     from './pages/Worker/WorkerLayout'
import WorkerDashboard  from './pages/Worker/pages/WorkerDashboard'
import IncomingJobsPage from './pages/Worker/pages/IncomingJobsPage'
import CurrentJobPage   from './pages/Worker/pages/CurrentJobPage'
import JobHistoryPage   from './pages/Worker/pages/JobHistoryPage'
import RatingsPage      from './pages/Worker/pages/RatingsPage'
import CurrentServiceStatus from './pages/Customer/CurrentServiceStatus'

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
        <Route path='/dashboard/customer/current-status' element={<CurrentServiceStatus />} />

        {/* Both URL shapes work — /customer/live-tracking was missing before */}
        <Route path='/customer/live-tracking' element={<CurrentServiceStatus />} />
        <Route path='/live-tracking' element={<CurrentServiceStatus />} />

        <Route path='/dashboard/admin' element={<AdminDashboard />} />
        <Route path='/admin/verifications/service-centers' element={<ServiceCenterVerifications />} />
        <Route path='/admin/verifications/fleet-managers' element={<FleetManagerVerifications />} />
        <Route path='/admin/issues' element={<IssuesPage />} />

        <Route path='/dashboard/service-center-owner' element={<SCODashboard />} />
        <Route path='/dashboard/service-center-owner/services' element={<SCOServices />} />
        <Route path='/dashboard/service-center-owner/workers' element={<SCOWorkers />} />
        <Route path='/dashboard/service-center-owner/requests' element={<SCORequests />} />
        <Route path='/dashboard/service-center-owner/profile' element={<SCOProfile />} />

        <Route path="/dashboard/fleet" element={<FleetDashboard />} />
        <Route path="/dashboard/fleet/vehicles" element={<VehicleManagement />} />
        <Route path="/dashboard/fleet/tracking" element={<ServiceTracking />} />
        <Route path="/dashboard/fleet/schedule" element={<BulkScheduling />} />
        <Route path="/dashboard/fleet/reports" element={<MaintenanceReports />} />

        {/* ── Worker Dashboard (nested layout) ─────────────────────────── */}
        <Route path="/dashboard/worker" element={<WorkerLayout />}>
          <Route path=""         element={<WorkerDashboard />} />
          <Route path="incoming" element={<IncomingJobsPage />} />
          <Route path="current"  element={<CurrentJobPage />} />
          <Route path="history"  element={<JobHistoryPage />} />
          <Route path="ratings"  element={<RatingsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App