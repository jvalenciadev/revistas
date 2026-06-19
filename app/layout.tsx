import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Letras Abiertas - Revista Literaria Escolar",
  description: "Un espacio creativo para los trabajos de lenguaje y literatura de nuestros estudiantes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check auth status on server side
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let user = null;
  let profile = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      profile = profileData;
    }
  } catch (error) {
    console.error("Error loading user layout session:", error);
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar user={user} profile={profile} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
