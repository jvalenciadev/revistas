"use client";

import { useState } from "react";
import { FileText, Eye, EyeOff, FileDown, ExternalLink } from "lucide-react";

interface DocumentViewerProps {
  fileUrl: string;
}

export default function DocumentViewer({ fileUrl }: DocumentViewerProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!fileUrl) return null;

  const fileExtension = fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const isPdf = fileExtension === "pdf";
  const isDoc = ["doc", "docx"].includes(fileExtension);

  // Build the embed URL based on file type
  let embedUrl = fileUrl;
  if (isDoc) {
    embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }

  const getFileTypeName = () => {
    if (isPdf) return "Documento PDF";
    if (isDoc) return "Documento de Word";
    return "Archivo Adjunto";
  };

  return (
    <section
      style={{
        marginTop: "4rem",
        padding: "2rem",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.2rem", color: "var(--text-primary)" }}>
              {getFileTypeName()}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Esta obra incluye el manuscrito u hoja de trabajo original adjunto por el autor.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {(isPdf || isDoc) && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn btn-secondary"
              style={{
                padding: "0.5rem 1.1rem",
                fontSize: "0.85rem",
                borderRadius: "50px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {showPreview ? (
                <>
                  <EyeOff size={15} />
                  Ocultar Lector
                </>
              ) : (
                <>
                  <Eye size={15} />
                  Leer Aquí
                </>
              )}
            </button>
          )}

          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: "0.5rem 1.1rem",
              fontSize: "0.85rem",
              borderRadius: "50px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FileDown size={15} />
            Descargar
          </a>
        </div>
      </div>

      {/* Embedded Document Frame */}
      {showPreview && (isPdf || isDoc) && (
        <div
          className="animate-fade-in"
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            backgroundColor: "var(--bg-secondary)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
            padding: "0.5rem",
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0.4rem 0.8rem",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "0.5rem",
            gap: "0.5rem",
            alignItems: "center"
          }}>
            <span>Visualizador Oficial</span>
            <span>•</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", color: "var(--primary)", fontWeight: "600" }}
            >
              Pantalla Completa <ExternalLink size={12} />
            </a>
          </div>

          <iframe
            src={embedUrl}
            width="100%"
            height="650px"
            style={{
              border: "none",
              backgroundColor: "#fff",
              borderRadius: "4px",
            }}
            title="Visualizador de Manuscrito Original"
          />
        </div>
      )}
    </section>
  );
}
