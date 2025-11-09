import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { PatientPage } from './pages/PatientPage'
import { ClinicianPage } from './pages/ClinicianPage'
import { AdminPage } from './pages/AdminPage'
import { DoctorFinderPage } from './pages/DoctorFinderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="patient" element={<PatientPage />} />
          <Route path="clinician" element={<ClinicianPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="doctor-finder" element={<DoctorFinderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
