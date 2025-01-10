import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Success from '@/pages/Success';
import Index from '@/pages/Index';
import SalesPage from '@/pages/SalesPage';
import RegisterAndOrder from '@/pages/RegisterAndOrder';
import AdminConsole from '@/pages/AdminConsole';
import { ProtectedRoute } from './ProtectedRoute';

export const routes = [
  {
    path: "/",
    element: <SalesPage />
  },
  {
    path: "/login",
    element: <Login />,
    authRedirect: "/dashboard"
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/success",
    element: <Success />
  },
  {
    path: "/register-and-order",
    element: <RegisterAndOrder />
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminConsole />
      </ProtectedRoute>
    )
  }
];