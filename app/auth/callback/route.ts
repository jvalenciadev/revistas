import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error cases from Supabase (expired links, etc.)
  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set(
      "error",
      errorDescription || "El enlace de confirmación ha expirado o es inválido."
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    // No code provided, redirect to home
    return NextResponse.redirect(new URL("/", origin));
  }

  // Exchange the code for a session
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    // Exchange failed, redirect to login with error message
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set(
      "error",
      "No se pudo verificar la cuenta. Por favor, intenta registrarte de nuevo."
    );
    return NextResponse.redirect(loginUrl);
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // Redirect to the appropriate dashboard based on role
  if (profile?.role === "profesor") {
    return NextResponse.redirect(new URL("/dashboard/teacher", origin));
  }

  return NextResponse.redirect(new URL("/dashboard/student", origin));
}
