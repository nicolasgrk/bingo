// app/events/create/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateEventForm } from "./create-event-form"; // Nous allons créer ce composant

export default async function CreateEventPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Si l'utilisateur n'est pas connecté, redirigez-le vers la page d'authentification
    redirect("/auth?message=Veuillez vous connecter pour créer un événement.");
  }

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight text-primary">Créer un Nouvel Événement Bingo</h1>
        <div className="neumorphic-card p-6 md:p-8">
          {/* Le user.id sera passé au formulaire pour l'utiliser comme creator_id */}
          <CreateEventForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
