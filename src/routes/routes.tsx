import { createBrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ResetPassword from "@/pages/ResetPassword";
import Success from "@/pages/Success";
import AdminConsole from "@/pages/AdminConsole";
import SalesPage from "@/pages/SalesPage";
import RegisterAndOrder from "@/pages/RegisterAndOrder";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/success",
    element: <Success />,
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
    path: "/sales",
    element: <SalesPage />,
  },
  {
    path: "/register-and-order",
    element: <RegisterAndOrder />,
  },
]);