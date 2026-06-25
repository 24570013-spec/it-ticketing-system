import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import TicketList   from './pages/TicketList';
import AdminPanel   from './pages/AdminPanel';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Hanya user (staff) dan admin yang boleh buat tiket — engineer tidak
function StaffOnlyRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'engineer') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tickets"      element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
      <Route path="/tickets/new"  element={<StaffOnlyRoute><CreateTicket /></StaffOnlyRoute>} />
      <Route path="/tickets/:id"  element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
      <Route path="/admin"        element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
