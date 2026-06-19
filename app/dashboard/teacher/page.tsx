"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  BookOpen,
  Users,
  Check,
  X,
  Trash2,
  ExternalLink,
  Info,
  Calendar,
  User,
  Shield,
  Edit2,
  Save,
  Activity,
  UserCheck
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  student_name: string;
  student_id: string;
  content: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"moderation" | "users">("moderation");

  // Inline edit state for user profile CRUD
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("estudiante");

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      // Verify user profile role is teacher
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Use DB role if available, fall back to auth metadata role
      const resolvedRole = profile?.role ?? user.user_metadata?.role ?? "estudiante";

      if (resolvedRole !== "profesor") {
        // Confirmed not a teacher → redirect to student dashboard
        router.push("/dashboard/student");
        return;
      }
      setCurrentProfile(profile ?? { id: user.id, full_name: user.email, role: "profesor" });


      // Load all articles
      const { data: allArticles } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (allArticles) setArticles(allArticles);

      // Load all profiles (User Management CRUD)
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (allProfiles) setProfiles(allProfiles);

      setLoading(false);
    }
    loadDashboardData();
  }, [router, supabase]);

  // Moderation action: Change article status
  const handleStatusChange = async (articleId: string, newStatus: "aprobado" | "rechazado" | "pendiente") => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ status: newStatus })
        .eq("id", articleId);

      if (error) throw error;

      // Update local state
      setArticles((prev) =>
        prev.map((art) => (art.id === articleId ? { ...art, status: newStatus } : art))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al actualizar el estado de la obra.");
    }
  };

  // Moderation action: Delete article
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente esta obra? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase.from("articles").delete().eq("id", articleId);
      if (error) throw error;

      // Update local state
      setArticles((prev) => prev.filter((art) => art.id !== articleId));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al eliminar la obra.");
    }
  };

  // CRUD action: Start editing user profile
  const startEditProfile = (prof: Profile) => {
    setEditingProfileId(prof.id);
    setEditName(prof.full_name);
    setEditRole(prof.role);
  };

  // CRUD action: Save profile edits
  const handleSaveProfile = async (profileId: string) => {
    if (!editName.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName, role: editRole })
        .eq("id", profileId);

      if (error) throw error;

      // Update local profiles state
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, full_name: editName, role: editRole } : p))
      );

      // If we edited current profile, update header
      if (profileId === currentUser.id) {
        setCurrentProfile((prev: any) => ({ ...prev, full_name: editName, role: editRole }));
        if (editRole !== "profesor") {
          // If teachers somehow downgrade themselves, redirect
          router.push("/dashboard/student");
        }
      }

      setEditingProfileId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al actualizar el perfil.");
    }
  };

  // Helper stats
  const pendingArticlesCount = articles.filter((a) => a.status === "pendiente").length;
  const approvedArticlesCount = articles.filter((a) => a.status === "aprobado").length;
  const totalStudentsCount = profiles.filter((p) => p.role === "estudiante").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1 }}>
      {/* Dashboard Top Header */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          padding: "2.5rem 3rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 className="literary-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Mesa de Redacción y Control
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Panel de moderación del Profesor: <strong style={{ color: "var(--text-primary)" }}>{currentProfile?.full_name}</strong>. Administra las obras enviadas por los estudiantes y gestiona sus roles en el sistema.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "3rem auto", padding: "0 1.5rem" }}>
        {/* Statistics Cards Row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", padding: "0.75rem", borderRadius: "50%" }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{pendingArticlesCount}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Pendientes de Revisión</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", padding: "0.75rem", borderRadius: "50%" }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{approvedArticlesCount}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Obras Publicadas</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ backgroundColor: "var(--success-light)", color: "var(--success)", padding: "0.75rem", borderRadius: "50%" }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{totalStudentsCount}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Estudiantes Registrados</div>
            </div>
          </div>
        </section>

        {/* Dashboard Tabs Toggle */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => setActiveTab("moderation")}
            style={{
              padding: "1rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "moderation" ? "3px solid var(--primary)" : "none",
              color: activeTab === "moderation" ? "var(--text-primary)" : "var(--text-light)",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={18} />
              Moderación de Obras ({articles.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            style={{
              padding: "1rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "users" ? "3px solid var(--primary)" : "none",
              color: activeTab === "users" ? "var(--text-primary)" : "var(--text-light)",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} />
              Gestión de Estudiantes (CRUD)
            </span>
          </button>
        </div>

        {/* Tab 1: Moderation */}
        {activeTab === "moderation" && (
          <div className="table-container">
            {articles.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center", backgroundColor: "var(--bg-surface)" }}>
                <p style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>Aún no hay obras literarias enviadas.</p>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Obra / Estudiante</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Acciones de Moderación</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((art) => (
                    <tr key={art.id}>
                      <td style={{ maxWidth: "400px" }}>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{art.title}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.3rem 0" }}>
                          Por <strong>{art.student_name}</strong>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Calendar size={12} />
                          Enviado el {new Date(art.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ backgroundColor: "var(--bg-secondary)" }}>
                          {art.category}
                        </span>
                      </td>
                      <td>
                        {art.status === "aprobado" && (
                          <span className="badge badge-poetry">Aprobado / Publicado</span>
                        )}
                        {art.status === "rechazado" && (
                          <span className="badge" style={{ backgroundColor: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }}>
                            Rechazado
                          </span>
                        )}
                        {art.status === "pendiente" && (
                          <span className="badge" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {art.status !== "aprobado" && (
                            <button
                              onClick={() => handleStatusChange(art.id, "aprobado")}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", backgroundColor: "var(--success)" }}
                              title="Aprobar para publicar en la revista"
                            >
                              <Check size={14} /> Aprobar
                            </button>
                          )}

                          {art.status !== "rechazado" && (
                            <button
                              onClick={() => handleStatusChange(art.id, "rechazado")}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", border: "1px solid var(--error)", color: "var(--error)" }}
                              title="Rechazar obra"
                            >
                              <X size={14} /> Rechazar
                            </button>
                          )}

                          <a
                            href={`/articles/${art.id}`}
                            className="btn btn-secondary"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                            title="Ver obra completa"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={14} /> Leer
                          </a>

                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="btn btn-danger"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                            title="Eliminar obra"
                          >
                            <Trash2 size={14} /> Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: User CRUD Management */}
        {activeTab === "users" && (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Nombre del Usuario</th>
                  <th>ID de Registro</th>
                  <th>Rol Editorial</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((prof) => {
                  const isEditing = editingProfileId === prof.id;
                  const isSelf = currentUser?.id === prof.id;

                  return (
                    <tr key={prof.id}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="form-input"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.95rem" }}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <User size={16} style={{ color: "var(--text-light)" }} />
                            <strong style={{ color: "var(--text-primary)" }}>{prof.full_name}</strong>
                            {isSelf && (
                              <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.4rem", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "var(--primary)", fontWeight: "bold" }}>
                                Tú
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.2rem" }}>
                          Registrado: {new Date(prof.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-light)" }}>
                        {prof.id}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="form-select"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.95rem" }}
                          >
                            <option value="estudiante">Estudiante</option>
                            <option value="profesor">Profesor</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: prof.role === "profesor" ? "var(--primary-light)" : "var(--bg-secondary)",
                              color: prof.role === "profesor" ? "var(--primary)" : "var(--text-secondary)",
                            }}
                          >
                            {prof.role === "profesor" ? "Profesor" : "Estudiante"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveProfile(prof.id)}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", backgroundColor: "var(--success)" }}
                            >
                              <Save size={14} /> Guardar
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditProfile(prof)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                            >
                              <Edit2 size={14} /> Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
