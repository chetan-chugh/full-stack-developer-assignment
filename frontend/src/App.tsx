import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

// Layout shown to every authenticated user page
function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="ml-[var(--sidebar-width)] max-[860px]:ml-0">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Regular users */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin: separate login, then admin pages */}
      <Route path="/dadmin" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route path="/dadmin/users" element={<AdminUsersPage />} />
        <Route path="/dadmin/logs" element={<AdminLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}