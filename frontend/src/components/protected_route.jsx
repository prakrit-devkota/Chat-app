
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api/api.js";

export default function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        await api.get("/protected");

        if (!cancelled) {
          setAuthenticated(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthenticated(false);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (authenticated === null) {
    return <div>Checking authentication...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
