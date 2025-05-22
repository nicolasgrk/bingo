// components/auth/signout-button.tsx
"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth"); // Rediriger vers la page d'authentification
    router.refresh(); // Important pour que le layout serveur mette à jour l'état de la session
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Déconnexion
    </Button>
  );
}
