import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DashboardBridgePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to login
  if (!user) {
    redirect("/login");
  }

  // ── 1. Try to read existing profile from DB ───────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Log to server terminal so we can diagnose easily
  console.log("[dashboard] user:", user.id, "| DB role:", profile?.role ?? "NULL", "| meta role:", user.user_metadata?.role ?? "none", "| err:", profileError?.message ?? "ok");

  // ── 2. If profile exists → redirect based on role ─────────────────
  if (profile?.role === "profesor") {
    redirect("/dashboard/teacher");
  }

  if (profile?.role === "estudiante") {
    redirect("/dashboard/student");
  }

  // ── 3. Profile missing → try to create it ──────
  if (!profile) {
    const meta = user.user_metadata ?? {};
    const role: string = meta.role ?? "estudiante";
    const fullName: string = meta.full_name ?? user.email ?? "Usuario";

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, full_name: fullName, role },  // ← sin email (columna puede no existir aún)
        { onConflict: "id" }
      );

    console.log("[dashboard] upsert:", upsertError ? `ERROR: ${upsertError.message}` : "OK → role=" + role);

    // ── 4. Redirect based on metadata role regardless of upsert result
    //    NEVER redirect to /login if user is authenticated — that causes loops
    if (role === "profesor") {
      redirect("/dashboard/teacher");
    } else {
      redirect("/dashboard/student");
    }
  }

  // ── 5. Absolute fallback (should never reach here) ─────────────────
  // If profile exists but role is unexpected, default to student dashboard
  redirect("/dashboard/student");
}
