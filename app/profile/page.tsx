// app/profile/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrismaClient, type Profile } from "@prisma/client";
import { ProfileForm } from "./profile-form"; // Nous allons créer ce composant
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?message=Veuillez vous connecter pour accéder à votre profil.");
  }

  let userProfile: Profile | null = null;
  try {
    userProfile = await prisma.profile.findUnique({
      where: { id: user.id },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    // Gérer l'erreur, peut-être afficher un message à l'utilisateur
  }

  if (!userProfile) {
    // Cela ne devrait pas arriver si le trigger handle_new_user fonctionne correctement
    // et que l'utilisateur est bien connecté.
    // Vous pourriez vouloir créer un profil ici s'il manque, ou afficher une erreur.
    // Pour l'instant, on redirige ou on affiche un message d'erreur simple.
    console.error(`Profil non trouvé pour l'utilisateur ${user.id}. Redirection...`);
    // Idéalement, on ne redirige pas vers /auth si l'utilisateur est authentifié mais n'a pas de profil.
    // On pourrait afficher un message d'erreur sur la page.
    // Pour l'instant, si le profil est absolument nécessaire :
    // redirect("/?error=profile_not_found");
    // Ou afficher un message sur la page :
    return (
        <div className="container mx-auto max-w-lg py-12 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Erreur de Profil</h1>
            <p className="text-red-500">Votre profil n'a pas pu être chargé. Veuillez réessayer plus tard ou contacter le support.</p>
            <Button variant="outline" asChild className="mt-6">
                <Link href="/">Retour à l'accueil</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-lg mx-auto">
        <Button variant="outline" size="sm" asChild className="mb-6 rounded-full">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight text-primary">Mon Profil</h1>
        <div className="neumorphic-card p-6 md:p-8">
          <ProfileForm userProfile={userProfile} />
        </div>
      </div>
    </div>
  );
}
