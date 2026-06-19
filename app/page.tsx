import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, Search, Feather, FileText, Calendar, User } from "lucide-react";

export const revalidate = 0; // Disable caching for real-time updates

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const awaitedParams = await searchParams;
  const activeCategory = awaitedParams.category || "Todos";
  const searchQuery = awaitedParams.search || "";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Build query
  let query = supabase
    .from("articles")
    .select("*")
    .eq("status", "aprobado");

  if (activeCategory && activeCategory !== "Todos") {
    query = query.eq("category", activeCategory);
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,student_name.ilike.%${searchQuery}%`);
  }

  const { data: articles, error } = await query.order("created_at", {
    ascending: false,
  });

  const categories = ["Todos", "Poesía", "Cuento", "Ensayo", "Crónica"];

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

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem 1.5rem" }} className="animate-fade-in">
      {/* Magazine Editorial Header */}
      <header className="magazine-header">
        <h1 className="magazine-logo">Letras Abiertas</h1>
        <p className="magazine-tagline">
          Revista literaria digital • Voces estudiantiles de nuestra comunidad
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1.2rem",
            marginTop: "1.8rem",
            fontSize: "0.8rem",
            color: "var(--text-light)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: "500",
            maxWidth: "600px",
            margin: "1.8rem auto 0 auto",
          }}
        >
          <span>Edición Especial</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long" })}</span>
          <span>•</span>
          <span>Área de Lenguaje</span>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <span style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--primary)",
            fontWeight: "700",
            display: "block",
            marginBottom: "0.6rem"
          }}>
            Taller Creativo Estudiantil
          </span>
          <h2 className="literary-title" style={{ fontSize: "2.4rem", marginBottom: "1.2rem", lineHeight: "1.2", fontWeight: "800" }}>
            Un tintero digital para las mentes creativas
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: "1.65", marginBottom: "1.8rem", maxWidth: "580px" }}>
            Te damos la bienvenida a nuestro espacio de expresión literaria. Un rincón escolar donde los poemas, relatos breves, crónicas y ensayos escritos por nuestros estudiantes cobran vida pública.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.88rem" }}>
              Enviar mi Obra
            </Link>
            <a href="#explorar" className="btn btn-secondary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.88rem" }}>
              Leer Obras Recientes
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div style={{
            position: "absolute",
            width: "140px",
            height: "140px",
            background: "radial-gradient(circle, var(--primary-light) 0%, transparent 70%)",
            filter: "blur(24px)",
            zIndex: 0
          }} />
          <Feather size={96} style={{ color: "var(--primary)", opacity: 0.85, zIndex: 1, transform: "rotate(-15deg)", filter: "drop-shadow(0 4px 8px rgba(162, 90, 56, 0.15))" }} />
        </div>
      </section>

      {/* Filter and Search Section */}
      <section
        id="explorar"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginBottom: "3rem",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          padding: "1.8rem",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* Categories Tab Navigation */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              let href = "/";
              if (cat !== "Todos") {
                href += `?category=${encodeURIComponent(cat)}`;
                if (searchQuery) href += `&search=${encodeURIComponent(searchQuery)}`;
              } else if (searchQuery) {
                href += `?search=${encodeURIComponent(searchQuery)}`;
              }

              return (
                <Link
                  key={cat}
                  href={href}
                  className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    padding: "0.45rem 1.15rem",
                    fontSize: "0.85rem",
                    borderRadius: "50px",
                    border: isActive ? "none" : "1px solid var(--border-color)",
                    backgroundColor: isActive ? "var(--primary)" : "transparent",
                    color: isActive ? "#FFF" : "var(--text-secondary)",
                    boxShadow: isActive ? "0 4px 10px rgba(162, 90, 56, 0.2)" : "none",
                  }}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          {/* Search Form */}
          <form
            action="/"
            method="GET"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: "280px",
              flex: "1",
              maxWidth: "420px",
            }}
          >
            {activeCategory !== "Todos" && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-light)",
                }}
              />
              <input
                type="text"
                name="search"
                placeholder="Buscar por título, autor..."
                defaultValue={searchQuery}
                className="form-input"
                style={{
                  paddingLeft: "2.4rem",
                  fontSize: "0.9rem",
                  height: "42px",
                  borderRadius: "50px",
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "0 1.25rem", height: "42px", borderRadius: "50px" }}>
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Main Magazine Layout */}
      {articles && articles.length > 0 ? (
        <div className="magazine-grid">
          {articles.map((article, idx) => {
            // First article is featured on desktop (span 8), rest are standard cards (span 4)
            const isFeatured = idx === 0 && !searchQuery && activeCategory === "Todos";
            const cardClass = isFeatured ? "magazine-card card-featured animate-fade-in" : "magazine-card card-standard animate-fade-in";
            const hasCover = !!article.cover_url;

            if (isFeatured && hasCover) {
              return (
                <article key={article.id} className={cardClass} style={{ padding: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", minHeight: "380px", width: "100%" }}>
                    {/* Left/Top cover image */}
                    <div style={{ position: "relative", minHeight: "260px" }}>
                      <img
                        src={article.cover_url!}
                        alt={article.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          borderRight: "1px solid var(--border-color)",
                        }}
                      />
                      <span
                        className={`badge ${getBadgeClass(article.category)}`}
                        style={{ position: "absolute", top: "1.5rem", left: "1.5rem", boxShadow: "var(--shadow-md)" }}
                      >
                        {article.category}
                      </span>
                    </div>

                    {/* Right content details */}
                    <div style={{ padding: "2.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-light)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontWeight: "500",
                            marginBottom: "1rem"
                          }}
                        >
                          <Calendar size={12} />
                          {new Date(article.created_at).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>

                        <Link href={`/articles/${article.id}`} style={{ display: "inline-block" }}>
                          <h2
                            className="literary-title hover-target"
                            style={{
                              fontSize: "2rem",
                              marginBottom: "1rem",
                              color: "var(--text-primary)",
                              lineHeight: "1.2",
                              fontWeight: "700",
                              transition: "color 0.2s ease",
                            }}
                          >
                            {article.title}
                          </h2>
                        </Link>

                        <p
                          style={{
                            fontSize: "0.98rem",
                            lineHeight: "1.7",
                            color: "var(--text-secondary)",
                            marginBottom: "1.5rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {article.content}
                        </p>
                      </div>

                      <div
                        style={{
                          paddingTop: "1.2rem",
                          borderTop: "1.5px solid var(--border-color)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <User size={15} style={{ color: "var(--primary)" }} />
                          Por <strong style={{ color: "var(--text-primary)" }}>{article.student_name}</strong>
                        </span>

                        <Link
                          href={`/articles/${article.id}`}
                          className="btn btn-secondary"
                          style={{
                            padding: "0.35rem 0.9rem",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            borderRadius: "50px",
                          }}
                        >
                          <Feather size={12} />
                          Leer más
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // Standard or no-cover card
            return (
              <article key={article.id} className={cardClass}>
                {hasCover && (
                  <div
                    style={{
                      height: "170px",
                      overflow: "hidden",
                      margin: "-2rem -2rem 1.2rem -2rem",
                      borderBottom: "1px solid var(--border-color)",
                      position: "relative"
                    }}
                  >
                    <img
                      src={article.cover_url!}
                      alt={article.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.2rem",
                  }}
                >
                  <span className={`badge ${getBadgeClass(article.category)}`}>
                    {article.category}
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-light)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontWeight: "500",
                    }}
                  >
                    <Calendar size={12} />
                    {new Date(article.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>

                <Link href={`/articles/${article.id}`} style={{ display: "inline-block", width: "100%" }}>
                  <h2
                    className="literary-title hover-target"
                    style={{
                      fontSize: isFeatured ? "2.2rem" : "1.45rem",
                      marginBottom: "1rem",
                      color: "var(--text-primary)",
                      lineHeight: "1.25",
                      fontWeight: "700",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {article.title}
                  </h2>
                </Link>

                <p
                  style={{
                    fontSize: "0.98rem",
                    lineHeight: "1.7",
                    color: "var(--text-secondary)",
                    marginBottom: "1.8rem",
                    display: "-webkit-box",
                    WebkitLineClamp: isFeatured ? 5 : 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {article.content}
                </p>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "1.2rem",
                    borderTop: "1.5px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <User size={15} style={{ color: "var(--primary)" }} />
                    Por <strong style={{ color: "var(--text-primary)" }}>{article.student_name}</strong>
                  </span>

                  <Link
                    href={`/articles/${article.id}`}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.35rem 0.9rem",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      borderRadius: "50px",
                    }}
                  >
                    <Feather size={12} />
                    Leer más
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            textAlign: "center",
            padding: "5rem 2rem",
            backgroundColor: "var(--bg-surface)",
            border: "1px dashed var(--border-color)",
            borderRadius: "var(--radius-md)",
            maxWidth: "620px",
            margin: "0 auto 4rem auto",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Feather
            size={48}
            style={{ color: "var(--text-light)", marginBottom: "1.5rem", opacity: 0.7 }}
          />
          <h3 style={{ fontSize: "1.4rem", marginBottom: "0.8rem", fontWeight: "700" }}>
            El tintero está lleno...
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: "1.6", fontSize: "0.95rem" }}>
            {searchQuery
              ? "No encontramos obras que coincidan con tu búsqueda. ¡Prueba con otro término o categoría!"
              : "Aún no se han publicado obras en esta categoría. Si eres estudiante, ¡puedes ser el primero en subir tu creación para la revista!"}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: "0.88rem", padding: "0.6rem 1.3rem" }}>
              Iniciar Sesión
            </Link>
            <Link href="/" className="btn btn-secondary" style={{ fontSize: "0.88rem", padding: "0.6rem 1.3rem" }}>
              Ver todas
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Revista Letras Abiertas. Creado con amor para el área de Lenguaje.</p>
        <p style={{ fontSize: "0.78rem", marginTop: "0.6rem", color: "var(--text-light)" }}>
          Un espacio donde las palabras cobran vida y la imaginación estudiantil no tiene límites.
        </p>
      </footer>
    </div>
  );
}
