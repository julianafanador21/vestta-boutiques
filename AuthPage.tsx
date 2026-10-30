import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const error =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, storeName || "Mi boutique");
    setBusy(false);
    if (error) {
      setNotice(error);
      return;
    }
    if (mode === "register") {
      setNotice(
        "Cuenta creada. Si tu proyecto exige confirmar email, revisa tu bandeja; si no, ya puedes entrar.",
      );
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="wordmark">Vestta</div>
        <h1 className="wordmark">Atelier</h1>
        <p className="lede">
          Inventario íntimo para boutiques. Cada tienda ve solo su armario.
        </p>
        <form onSubmit={onSubmit}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="store">Nombre de la boutique</label>
              <input
                id="store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ruby Rose Atelier"
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <p className="notice">{notice}</p>
          <button className="primary full" disabled={busy} type="submit">
            {busy
              ? "Un momento…"
              : mode === "login"
                ? "Entrar"
                : "Registrar boutique"}
          </button>
        </form>
        <p className="switch">
          {mode === "login" ? "¿Primera vez?" : "¿Ya tienes cuenta?"}{" "}
          <button
            className="linkish"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setNotice("");
            }}
          >
            {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
