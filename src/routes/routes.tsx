
import { createBrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Success from "@/pages/Success";
import AdminConsole from "@/pages/AdminConsole";
import SalesPage from "@/pages/SalesPage";
import RegisterAndOrder from "@/pages/RegisterAndOrder";
import ProtectedRoute from "./ProtectedRoute";
import { Navigate } from "react-router-dom";
import Monitoring from "@/pages/Monitoring";
import Test from "@/pages/Test";

interface AppRoute {
  path: string;
  element: React.ReactNode;
  authRedirect?: string;
}

const routes: AppRoute[] = [
  {
    path: "/",
    element: <SalesPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/success",
    element: (
      <ProtectedRoute>
        <Success />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminConsole />
      </ProtectedRoute>
    ),
  },
  {
    path: "/monitoring",
    element: (
      <ProtectedRoute>
        <Monitoring />
      </ProtectedRoute>
    ),
  },
  {
    path: "/test",
    element: <Test />,
  },
  {
    path: "/sales",
    element: <SalesPage />,
  },
  {
    path: "/register-and-order",
    element: <RegisterAndOrder />,
  },
];

export const router = createBrowserRouter(routes);
