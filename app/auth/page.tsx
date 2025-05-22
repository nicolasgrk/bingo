// app/auth/page.tsx
import { AuthForm } from "./auth-form"; // Nous allons créer ce composant
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Si l'utilisateur est déjà connecté, redirigez-le vers la page d'accueil ou une autre page
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center pt-24 p-4">
      <div className="neumorphic-panel w-full max-w-md mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 tracking-tight text-primary">
          Accès QuoicouBingo
        </h1>
        <div className="neumorphic-card p-8">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
