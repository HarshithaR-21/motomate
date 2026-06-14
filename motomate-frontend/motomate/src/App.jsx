import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
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
import SCOLayout from './pages/SCO/SCOLayout'
import SCODashboard from './pages/SCO/pages/SCODashboard'
import SCOServices from './pages/SCO/pages/SCOServices'
import SCOWorkers from './pages/SCO/pages/SCOWorkers'
import SCORequests from './pages/SCO/pages/SCORequests'
import SCOProfile from './pages/SCO/pages/SCOProfile'
import SOSDashboard from './pages/SCO/pages/SOSDashboard'
import FleetDashboard from './pages/FleetManager/pages/FleetDashboard'
import VehicleManagement from './pages/FleetManager/pages/VehicleManagement'
import ServiceTracking from './pages/FleetManager/pages/ServiceTracking'
import BulkScheduling from './pages/FleetManager/pages/BulkScheduling'
import MaintenanceReports from './pages/FleetManager/pages/MaintenanceReports'

import WorkerLayout     from './pages/Worker/WorkerLayout'
import WorkerDashboard  from './pages/Worker/pages/WorkerDashboard'
import IncomingJobsPage from './pages/Worker/pages/IncomingJobsPage'
import CurrentJobPage   from './pages/Worker/pages/CurrentJobPage'
import JobHistoryPage   from './pages/Worker/pages/JobHistoryPage'
import RatingsPage      from './pages/Worker/pages/RatingsPage'
import WorkerSOSPage    from './pages/Worker/pages/WorkerSOSPage'
import EVVehiclesPage from './EV/EVVehiclesPage'
import EVBookServicePage from './EV/EVBookServicePage'
import EVWorkshopSelectionPage from './EV/EVWorkshopSelectionPage'
import EVHistoryPage from './EV/EVHistoryPage'
import EVTrackingPage from './EV/EVTrackingPage'
import EVChargingPage from './EV/EVChargingPage'
import EVSOSPage from './EV/EVSOSPage'

import CurrentServiceStatus from './pages/Customer/CurrentServiceStatus'
import SOSEmergencyPage from './pages/Customer/SOSEmergencyPage'
import EVWorkshopDashboard from './EV/pages/EVWorkshopDashboard'
import EVWorkshopRequestsPage from './EV/pages/EVWorkshopRequestsPage'

const RequireAuth = () => {
  const location = useLocation();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const isAuthenticated = Boolean(getUser() || localStorage.getItem('token'));
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

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

        <Route element={<RequireAuth />}>
          {/* ── Customer ─────────────────────────────────────────────────── */}
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/customer/vehicle-services" element={<VehicleServices />} />
          <Route path="/dashboard/customer/vehicle-services/book-service" element={<BookService />} />
          <Route path='/dashboard/customer/service-history' element={<ServiceHistory />} />
          <Route path='/dashboard/customer/current-status' element={<CurrentServiceStatus />} />
          <Route path='/customer/live-tracking' element={<CurrentServiceStatus />} />
          <Route path='/live-tracking' element={<CurrentServiceStatus />} />
          <Route path='/dashboard/customer/emergency-sos' element={<SOSEmergencyPage />} />

          {/* ── Admin ────────────────────────────────────────────────────── */}
          <Route path='/dashboard/admin' element={<AdminDashboard />} />
          <Route path='/admin/verifications/service-centers' element={<ServiceCenterVerifications />} />
          <Route path='/admin/verifications/fleet-managers' element={<FleetManagerVerifications />} />
          <Route path='/admin/issues' element={<IssuesPage />} />

          {/* ── Service Center Owner — NESTED so sidebar always shows ────── */}
          <Route path='/dashboard/service-center-owner' element={<SCOLayout />}>
            <Route index             element={<SCODashboard />} />
            <Route path='services'   element={<SCOServices />} />
            <Route path='workers'    element={<SCOWorkers />} />
            <Route path='requests'   element={<SCORequests />} />
            <Route path='profile'    element={<SCOProfile />} />
            {/* SOS tab — now inside the layout so sidebar + header render */}
            <Route path='sos'        element={<SOSDashboard />} />
          </Route>

          {/* ── Fleet Manager ─────────────────────────────────────────────── */}
          <Route path="/dashboard/fleet" element={<FleetDashboard />} />
          <Route path="/dashboard/fleet/vehicles" element={<VehicleManagement />} />
          <Route path="/dashboard/fleet/tracking" element={<ServiceTracking />} />
          <Route path="/dashboard/fleet/schedule" element={<BulkScheduling />} />
          <Route path="/dashboard/fleet/reports" element={<MaintenanceReports />} />

          {/* ── Worker Dashboard (nested layout) ─────────────────────────── */}
          <Route path="/dashboard/worker" element={<WorkerLayout />}>
            <Route index           element={<WorkerDashboard />} />
            <Route path="incoming" element={<IncomingJobsPage />} />
            <Route path="current"  element={<CurrentJobPage />} />
            <Route path="history"  element={<JobHistoryPage />} />
            <Route path="ratings"  element={<RatingsPage />} />
            <Route path="sos"      element={<WorkerSOSPage />} />
          </Route>

          {/* ── EV Customer Pages ────────────────────────────────────────── */}
          <Route path="/dashboard/customer/ev/vehicles" element={<EVVehiclesPage />} />
          <Route path="/dashboard/customer/ev/book-service" element={<EVBookServicePage />} />
          <Route path="/dashboard/customer/ev/workshops" element={<EVWorkshopSelectionPage />} />
          <Route path="/dashboard/customer/ev/history" element={<EVHistoryPage />} />
          <Route path="/dashboard/customer/ev/tracking" element={<EVTrackingPage />} />
          <Route path="/dashboard/customer/ev/charging" element={<EVChargingPage />} />
          <Route path="/dashboard/customer/ev/sos" element={<EVSOSPage />} />

          {/* ── EV Workshop (Service Center) Pages ───────────────────────── */}
          <Route path="/dashboard/ev-workshop" element={<EVWorkshopDashboard />} />
          <Route path="/dashboard/ev-workshop/requests" element={<EVWorkshopRequestsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
