"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Plus,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Feather,
  Info,
  Calendar
} from "lucide-react";
import confetti from "canvas-confetti";

interface Article {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  file_url: string | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Poesía");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Upload progress states
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      setProfile(profileData);

      // Load articles
      const { data: userArticles } = await supabase
        .from("articles")
        .select("*")
        .eq("student_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (userArticles) setArticles(userArticles);
      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "document" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "document") {
      setUploadingDoc(true);
    } else {
      setUploadingCover(true);
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${type}s/${fileName}`;

      // Upload file to Supabase Storage bucket 'documents'
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (error) {
        throw new Error(
          "No se pudo subir el archivo. Asegúrate de que el bucket 'documents' esté creado y configurado con acceso público en Supabase."
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      if (type === "document") {
        setFileUrl(publicUrl);
      } else {
        setCoverUrl(publicUrl);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al subir el archivo.");
    } finally {
      if (type === "document") {
        setUploadingDoc(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    if (!title || !content || !category) {
      setFormError("Por favor completa los campos de Título, Categoría y Contenido de la obra.");
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("articles").insert([
        {
          title,
          content,
          category,
          cover_url: coverUrl || null,
          file_url: fileUrl || null,
          student_id: user.id,
          student_name: profile?.full_name || "Estudiante",
          status: "pendiente", // Submitted works start as pending moderation
        },
      ]).select();

      if (error) throw error;

      // Celebrate success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setFormSuccess("¡Felicidades! Tu obra ha sido enviada al comité editorial (profesores) para su revisión.");

      // Reset form
      setTitle("");
      setContent("");
      setCoverUrl("");
      setFileUrl("");

      // Refresh list
      const { data: updatedArticles } = await supabase
        .from("articles")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      if (updatedArticles) setArticles(updatedArticles);

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Error al enviar el trabajo.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobado":
        return (
          <span className="badge badge-poetry" style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
            <CheckCircle size={12} /> Aprobado / Publicado
          </span>
        );
      case "rechazado":
        return (
          <span className="badge" style={{ backgroundColor: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
            <XCircle size={12} /> Rechazado
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
            <Clock size={12} /> Pendiente de Revisión
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1 }}>
      {/* Editorial banner header */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          padding: "2.5rem 3rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 className="literary-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Taller Editorial del Estudiante
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Bienvenido, <strong style={{ color: "var(--text-primary)" }}>{profile?.full_name}</strong>. Aquí puedes subir tus obras creativas (poemas, cuentos, ensayos) para que sean revisadas y publicadas en la revista **Letras Abiertas**.
          </p>
        </div>
      </div>

      {/* Main container split */}
      <div style={{ maxWidth: "1200px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3rem" }}>

          {/* Left Column: Submission list */}
          <div>
            <h2 className="literary-title" style={{ fontSize: "1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={20} style={{ color: "var(--primary)" }} />
              Mis Creaciones Literarias ({articles.length})
            </h2>

            {articles.length === 0 ? (
              <div
                style={{
                  padding: "4rem 2rem",
                  textAlign: "center",
                  border: "1px dashed var(--border-color)",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <Feather size={36} style={{ color: "var(--text-light)", marginBottom: "1rem" }} />
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Tu portafolio está vacío</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Aún no has enviado ningún trabajo. Utiliza el formulario para mandar tu primer poema, cuento o ensayo.
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Título de la Obra</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((art) => (
                      <tr key={art.id}>
                        <td>
                          <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                            {art.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Calendar size={12} />
                            Enviado el {new Date(art.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge badge-secondary"
                            style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
                          >
                            {art.category}
                          </span>
                        </td>
                        <td>{getStatusBadge(art.status)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {art.status === "aprobado" ? (
                              <a
                                href={`/articles/${art.id}`}
                                className="btn btn-secondary"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                              >
                                <ExternalLink size={12} />
                                Leer en Revista
                              </a>
                            ) : (
                              <a
                                href={`/articles/${art.id}`}
                                className="btn btn-secondary"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                              >
                                <ExternalLink size={12} />
                                Vista Previa
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Submission Form */}
          <div>
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                padding: "2rem",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h2 className="literary-title" style={{ fontSize: "1.4rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={20} style={{ color: "var(--primary)" }} />
                Nueva Obra Editorial
              </h2>

              {formError && (
                <div className="alert alert-error">
                  <Info size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={16} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateArticle} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

                <div className="form-group">
                  <label className="form-label" htmlFor="artTitle">Título de la Obra</label>
                  <input
                    id="artTitle"
                    type="text"
                    placeholder="Escribe un título creativo..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="artCategory">Categoría</label>
                  <select
                    id="artCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Poesía">Poesía</option>
                    <option value="Cuento">Cuento</option>
                    <option value="Ensayo">Ensayo</option>
                    <option value="Crónica">Crónica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="artContent">Cuerpo del Escrito (Texto)</label>
                  <textarea
                    id="artContent"
                    placeholder="Escribe tu obra aquí..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>

                {/* Cover Image Upload — with live thumbnail preview */}
                <div className="form-group">
                  <label className="form-label">Imagen de Portada (Opcional)</label>

                  {!coverUrl ? (
                    /* Drop zone / upload button */
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.6rem",
                        padding: "1.8rem",
                        border: "2px dashed var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        cursor: uploadingCover ? "not-allowed" : "pointer",
                        background: "var(--bg-base)",
                        transition: "border-color 0.2s, background 0.2s",
                        opacity: uploadingCover ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--accent)";
                        (e.currentTarget as HTMLLabelElement).style.background = "rgba(var(--accent-rgb, 99,102,241), 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border-color)";
                        (e.currentTarget as HTMLLabelElement).style.background = "var(--bg-base)";
                      }}
                    >
                      {uploadingCover ? (
                        <>
                          <div style={{ width: 32, height: 32, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={28} style={{ color: "var(--text-secondary)" }} />
                          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Haz clic para subir una portada</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>PNG, JPG, WEBP — máx. 5 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, "cover")}
                        disabled={uploadingCover}
                      />
                    </label>
                  ) : (
                    /* Thumbnail preview with remove button */
                    <div style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                      <img
                        src={coverUrl}
                        alt="Preview de portada"
                        style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      />
                      {/* Dark overlay on hover */}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                        padding: "0.75rem",
                      }}>
                        <span style={{ fontSize: "0.75rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <CheckCircle size={13} /> Portada cargada
                        </span>
                        <button
                          type="button"
                          onClick={() => setCoverUrl("")}
                          style={{
                            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                            borderRadius: "6px", color: "#fff", fontSize: "0.75rem",
                            padding: "0.25rem 0.6rem", cursor: "pointer",
                          }}
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Upload — with rich file card preview */}
                <div className="form-group">
                  <label className="form-label">Documento Original (PDF, Word) (Opcional)</label>

                  {!fileUrl ? (
                    /* Drop zone */
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.6rem",
                        padding: "1.8rem",
                        border: "2px dashed var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        cursor: uploadingDoc ? "not-allowed" : "pointer",
                        background: "var(--bg-base)",
                        transition: "border-color 0.2s, background 0.2s",
                        opacity: uploadingDoc ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--accent)";
                        (e.currentTarget as HTMLLabelElement).style.background = "rgba(var(--accent-rgb, 99,102,241), 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border-color)";
                        (e.currentTarget as HTMLLabelElement).style.background = "var(--bg-base)";
                      }}
                    >
                      {uploadingDoc ? (
                        <>
                          <div style={{ width: 32, height: 32, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Subiendo documento...</span>
                        </>
                      ) : (
                        <>
                          <FileText size={28} style={{ color: "var(--text-secondary)" }} />
                          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Haz clic para subir un documento</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>PDF, DOC, DOCX — máx. 10 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, "document")}
                        disabled={uploadingDoc}
                      />
                    </label>
                  ) : (
                    /* File card preview */
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-surface)",
                    }}>
                      {/* File type icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: "8px",
                        background: fileUrl.toLowerCase().endsWith(".pdf") ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <FileText size={24} style={{ color: fileUrl.toLowerCase().endsWith(".pdf") ? "#ef4444" : "#3b82f6" }} />
                      </div>

                      {/* File info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
                            padding: "0.1rem 0.4rem", borderRadius: "4px",
                            background: fileUrl.toLowerCase().endsWith(".pdf") ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                            color: fileUrl.toLowerCase().endsWith(".pdf") ? "#ef4444" : "#3b82f6",
                            textTransform: "uppercase",
                          }}>
                            {fileUrl.split(".").pop()?.toUpperCase() ?? "DOC"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle size={12} /> Subido
                          </span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {decodeURIComponent(fileUrl.split("/").pop() ?? "documento")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.3rem",
                            fontSize: "0.75rem", color: "var(--accent)",
                            textDecoration: "none", padding: "0.35rem 0.6rem",
                            border: "1px solid var(--accent)", borderRadius: "6px",
                          }}
                        >
                          <ExternalLink size={12} /> Ver
                        </a>
                        <button
                          type="button"
                          onClick={() => setFileUrl("")}
                          style={{
                            fontSize: "0.75rem", padding: "0.35rem 0.6rem",
                            border: "1px solid var(--border-color)", borderRadius: "6px",
                            background: "transparent", cursor: "pointer", color: "var(--text-secondary)",
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "1rem", height: "45px" }}
                  disabled={submitting || uploadingDoc || uploadingCover}
                >
                  {submitting ? "Enviando..." : "Enviar a Moderación"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
