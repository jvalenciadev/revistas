"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sun, Moon, LogOut, BookOpen, User } from "lucide-react";

interface NavbarProps {
  user: any;
  profile: {
    full_name: string;
    role: string;
  } | null;
}

export default function Navbar({ user, profile: initialProfile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // Keep a client-side copy of the profile so we can refresh it
  const [profile, setProfile] = useState(initialProfile);

  // Re-fetch profile on the client in case the server-side query failed (e.g. RLS timing)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
      document.documentElement.setAttribute("data-theme", systemTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand">
        <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <BookOpen size={22} style={{ color: "var(--primary)" }} />
          <span className="literary-title" style={{ fontSize: "1.25rem", fontWeight: "800", letterSpacing: "0.06em" }}>
            LETRAS ABIERTAS
          </span>
        </span>
      </Link>

      <div className="nav-links">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Cambiar tema"
          title="Cambiar tema"
          style={{ width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <span
              className="hide-mobile"
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <User size={15} style={{ color: "var(--text-light)" }} />
              <strong style={{ color: "var(--text-primary)" }}>
                {profile?.full_name || "Usuario"}
              </strong>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "50px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  backgroundColor:
                    profile?.role === "profesor" ? "var(--primary-light)" :
                    profile?.role === "estudiante" ? "var(--bg-secondary)" :
                    "transparent",
                  color:
                    profile?.role === "profesor" ? "var(--primary)" :
                    profile?.role === "estudiante" ? "var(--text-secondary)" :
                    "var(--text-secondary)",
                  fontWeight: "700",
                }}
              >
                {profile?.role === "profesor" ? "Profesor" :
                 profile?.role === "estudiante" ? "Estudiante" :
                 ""}
              </span>
            </span>

            <Link
              href="/dashboard"
              className="btn btn-secondary"
              style={{
                padding: "0.45rem 1.1rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                borderRadius: "50px",
              }}
            >
              <User size={14} />
              <span>
                {profile?.full_name
                  ? profile.full_name.split(" ")[0]   // First name only
                  : "Mi Panel"}
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="btn btn-danger"
              style={{
                padding: "0.45rem 1rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                borderRadius: "50px",
              }}
              title="Cerrar Sesión"
            >
              <LogOut size={15} />
              <span className="hide-mobile">Salir</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="btn btn-primary"
            style={{
              padding: "0.5rem 1.3rem",
              fontSize: "0.88rem",
              borderRadius: "50px",
            }}
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
