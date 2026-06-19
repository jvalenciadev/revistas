import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, BookOpen } from "lucide-react";
import DocumentViewer from "@/components/DocumentViewer";

export const revalidate = 0; // Ensure fresh data on every read

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch article
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !article) {
    notFound();
  }

  // Double check that it's approved or the owner is viewing it
  // (Profiles who are teachers can view anything, but let's check role if it's not approved)
  if (article.status !== "aprobado") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      notFound();
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = user.id === article.student_id;
    const isTeacher = profile?.role === "profesor";

    if (!isOwner && !isTeacher) {
      notFound();
    }
  }

  const getBadgeClass = (cat: string) => {
    switch (cat) {
      case "Poesía":
        return "badge-poetry";
      case "Cuento":
        return "badge-story";
      case "Ensayo":
        return "badge-essay";
      case "Crónica":
        return "badge-chronicle";
      default:
        return "badge-secondary";
    }
  };

  // Convert double newlines to paragraph tags for a nice editorial print look
  const paragraphs = article.content
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  return (
    <div className="animate-fade-in" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Article Container */}
      <article className="article-reading-layout">
        {/* Back navigation */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{
              padding: "0.5rem 1.2rem",
              fontSize: "0.88rem",
              borderRadius: "50px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ArrowLeft size={16} />
            Volver a la Revista
          </Link>
        </div>

        {/* Cover image header banner */}
        {article.cover_url && (
          <div
            style={{
              width: "100%",
              height: "380px",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              marginBottom: "3rem",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-color)"
            }}
          >
            <img
              src={article.cover_url}
              alt={article.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Editorial Header */}
        <header className="article-header">
          <span className={`badge ${getBadgeClass(article.category)}`} style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            {article.category}
          </span>

          <h1 className="article-title">{article.title}</h1>

          <div className="article-meta">
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <User size={15} style={{ color: "var(--primary)" }} />
              Obra de <strong>{article.student_name}</strong>
            </span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Calendar size={15} />
              {new Date(article.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {article.status !== "aprobado" && (
            <div
              style={{
                marginTop: "1.5rem",
                display: "inline-block",
                padding: "0.3rem 0.8rem",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                backgroundColor: "var(--accent-light)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
                textTransform: "uppercase",
              }}
            >
              Vista Previa - Estado: {article.status}
            </div>
          )}
        </header>

        {/* Article content (Text) */}
        <section className="article-body">
          {paragraphs.map((para: string, idx: number) => (
            <p key={idx}>{para}</p>
          ))}
        </section>

        {/* Interactive Inline Document Viewer preview */}
        {article.file_url && (
          <DocumentViewer fileUrl={article.file_url} />
        )}
      </article>

      {/* Decorative separators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "4rem 0 2rem 0",
          color: "var(--border-color)",
        }}
      >
        <BookOpen size={20} />
      </div>

      <footer className="footer">
        <p>© 2026 Revista Letras Abiertas. Creado con amor para el área de Lenguaje.</p>
      </footer>
    </div>
  );
}
