// app/my-events/page.tsx
import { PrismaClient, type Event as PrismaEventType, type Profile } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/app/events/event-card'; // Réutiliser le composant EventCard
import { CalendarDays, ArrowLeft, PlusCircle } from 'lucide-react';

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Type pour les événements affichés sur cette page (incluant le créateur)
type EventForMyEventsPage = PrismaEventType & {
  creator: {
    username: string | null;
  } | null;
  // On pourrait ajouter _count pour le nombre de participants si on le souhaite
  // _count?: { participants: number };
};

export default async function MyEventsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?message=Veuillez vous connecter pour voir vos événements.");
  }

  let participatedEvents: EventForMyEventsPage[] = [];
  let createdEvents: EventForMyEventsPage[] = [];

  try {
    // 1. Récupérer les événements auxquels l'utilisateur participe (et qu'il n'a pas créés)
    const participations = await prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        event: {
          NOT: { // Exclure les événements qu'il a créés pour éviter les doublons dans les sections
            creatorId: user.id,
          }
        }
      },
      include: {
        event: {
          include: {
            creator: { select: { username: true } },
            // _count: { select: { participants: true } }
          }
        }
      },
      orderBy: {
        event: { createdAt: 'desc' } // Ou par eventDate si pertinent
      },
    });
    participatedEvents = participations.map(p => p.event).filter(event => event !== null) as EventForMyEventsPage[];

    // 2. Récupérer les événements créés par l'utilisateur
    createdEvents = await prisma.event.findMany({
        where: {
            creatorId: user.id,
        },
        include: {
            creator: { select: { username: true } }, // Ici, creator sera l'utilisateur lui-même
            // _count: { select: { participants: true } }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });


  } catch (error) {
    console.error("Erreur lors de la récupération de 'Mes Événements':", error);
    // Gérer l'erreur comme il se doit
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-6xl mb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
              <CalendarDays className="mr-3 h-7 w-7 text-primary" />
              Mes Événements
          </h1>
          <Button variant="outline" size="sm" asChild className="neumorphic-btn">
              <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l'accueil
              </Link>
          </Button>
        </div>

        {/* Section Événements Créés */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Événements que j'ai Créés</h2>
          <div className="neumorphic-panel">
            {createdEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {createdEvents.map((event) => (
                  <div key={event.id} className="flex justify-center items-center">
                    <EventCard event={event} currentUser={user} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Vous n'avez créé aucun événement pour le moment.</p>
                <Button variant="default" asChild className="neumorphic-btn mt-6">
                    <Link href="/events/create">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Créer mon premier événement
                    </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Section Événements auxquels je participe */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Événements auxquels je Participe</h2>
          <div className="neumorphic-panel">
            {participatedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {participatedEvents.map((event) => (
                  <div key={event.id} className="flex justify-center items-center">
                    <EventCard event={event} currentUser={user} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Vous ne participez à aucun autre événement pour le moment.</p>
                 <Button variant="link" asChild className="neumorphic-btn mt-6">
                    <Link href="/events">Explorer les événements</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
