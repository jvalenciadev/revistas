"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, User, Mail, Lock, Shield, Feather, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("estudiante");
  const [teacherPin, setTeacherPin] = useState("");

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") || null
  );
  const [success, setSuccess] = useState<string | null>(null);

  // Clear errors when toggling modes
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [isSignUp]);

  // If user is already logged in, just send them to the dashboard.
  // The dashboard bridge will handle auto-creating the profile if needed.
  useEffect(() => {
    async function redirectIfLoggedIn() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        window.location.href = "/dashboard";
      }
    }
    redirectIfLoggedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!email || !password) {
      setError("Por favor completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setError("Por favor ingresa tu nombre completo.");
        setLoading(false);
        return;
      }

      if (role === "profesor") {
        const expectedPin = process.env.NEXT_PUBLIC_TEACHER_PIN || "LETRAS2026";
        if (teacherPin.trim() !== expectedPin) {
          setError("La clave de validación para el rol de Profesor es incorrecta.");
          setLoading(false);
          return;
        }
      }
    }

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setSuccess(
            "¡Cuenta creada con éxito! Si la confirmación de correo está activada, revisa tu bandeja de entrada. De lo contrario, ya puedes iniciar sesión."
          );
          // Auto fill fields and switch to sign in
          setIsSignUp(false);
        }
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      console.error(err);
      // Translate common Supabase Auth errors to friendly Spanish messages
      const code = err.code || err.message || "";
      if (
        code.includes("already registered") ||
        code.includes("user_already_exists")
      ) {
        setError(
          "Este correo ya está registrado. Usa el formulario de Inicio de Sesión para entrar."
        );
        // Auto-switch to sign-in mode so the user can log in immediately
        setIsSignUp(false);
      } else if (code.includes("Invalid login credentials") || code.includes("invalid_credentials")) {
        setError("Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.");
      } else if (code.includes("rate limit") || code.includes("over_email_send_rate_limit")) {
        setError("Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.");
      } else {
        setError(err.message || "Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 150px)",
        padding: "2rem 1.5rem",
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          padding: "2.5rem",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Logo and title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              marginBottom: "1rem",
            }}
          >
            <Feather size={24} />
          </div>
          <h2 className="literary-title" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            {isSignUp ? "Crear una Cuenta" : "Iniciar Sesión"}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {isSignUp
              ? "Regístrate en la revista escolar Letras Abiertas"
              : "Accede a tu panel editorial de Letras Abiertas"}
          </p>
        </div>

        {/* Message banners */}
        {error && (
          <div className="alert alert-error" role="alert">
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Nombre Completo
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-light)",
                  }}
                />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Ej. Sofía Alarcón"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "2.3rem" }}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-light)",
                }}
              />
              <input
                id="email"
                type="email"
                placeholder="ejemplo@colegio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "2.3rem" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-light)",
                }}
              />
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "2.3rem" }}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="role">
                  Rol del Usuario
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="profesor">Profesor / Moderador</option>
                </select>
              </div>

              {role === "profesor" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="teacherPin">
                    Clave de Validación de Profesor
                  </label>
                  <div style={{ position: "relative" }}>
                    <Shield
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-light)",
                      }}
                    />
                    <input
                      id="teacherPin"
                      type="password"
                      placeholder="Ingresa la clave escolar para profesores"
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: "2.3rem" }}
                      required={role === "profesor"}
                    />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                    Pide la clave al administrador escolar. Para pruebas usa: <code>LETRAS2026</code>
                  </span>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem", height: "45px" }}
            disabled={loading}
          >
            {loading ? "Cargando..." : isSignUp ? "Registrarse" : "Ingresar"}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {isSignUp ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
              }}
            >
              {isSignUp ? "Inicia Sesión" : "Regístrate aquí"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
