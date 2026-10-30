import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { InventoryPage } from "./pages/InventoryPage";

function Guard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrap">
        <p className="wordmark" style={{ fontSize: 28 }}>
          Vestta
        </p>
      </div>
    );
  }
  if (!session) return <Navigate to="/entrar" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <InventoryPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
