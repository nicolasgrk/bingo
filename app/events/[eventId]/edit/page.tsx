// app/events/[eventId]/edit/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PrismaClient, type Event as PrismaEvent } from "@prisma/client";
import { EditEventForm } from "./edit-event-form"; // Nous allons créer ce composant
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const prisma = new PrismaClient();

interface EditEventPageProps {
  params: {
    eventId: string;
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?message=Veuillez vous connecter pour modifier un événement.&next=/events/${eventId}/edit`);
  }

  let eventToEdit: PrismaEvent | null = null;
  try {
    eventToEdit = await prisma.event.findUnique({
      where: { id: eventId },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement pour modification:", error);
  }

  if (!eventToEdit) {
    notFound();
  }

  // Vérifier si l'utilisateur connecté est bien le créateur de l'événement
  if (eventToEdit.creatorId !== user.id) {
    // Rediriger ou afficher un message d'erreur si l'utilisateur n'est pas le créateur
    // Pour l'instant, redirigeons vers la page de l'événement avec un message d'erreur
    return (
        <div className="container mx-auto max-w-lg py-12 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Accès Interdit</h1>
            <p className="text-red-500">Vous n'êtes pas autorisé à modifier cet événement.</p>
            <Button variant="outline" asChild className="mt-6">
                <Link href={`/events/${eventId}`}>Retour à l'événement</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-2xl mx-auto">
        <Button variant="outline" size="sm" asChild className="mb-6 rounded-full">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'événement
          </Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight text-primary">Modifier l'Événement</h1>
        <div className="neumorphic-card p-6 md:p-8">
          <EditEventForm event={eventToEdit} />
        </div>
      </div>
    </div>
  );
}
