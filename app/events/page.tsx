// app/events/page.tsx
import { PrismaClient, type Event as PrismaEventType } from '@prisma/client'; // Importer le type Event de Prisma
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventCard } from './event-card';

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Définir le type pour les événements que nous allons manipuler dans cette page
// Il doit correspondre à ce que retourne Prisma avec l'inclusion du créateur
type EventWithCreatorUsername = PrismaEventType & {
  creator: {
    username: string | null;
  } | null;
};

export default async function EventsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Initialiser 'events' avec le type correct
  let events: EventWithCreatorUsername[] = [];

  try {
    const publicEventsQuery = prisma.event.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: { username: true }
        }
      }
    });

    // Attendre la résolution de la promesse
    const publicEvents: EventWithCreatorUsername[] = await publicEventsQuery;
    events.push(...publicEvents);

    if (user) {
      const userCreatedEventsQuery = prisma.event.findMany({
        where: {
          creatorId: user.id,
          isPublic: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          creator: { select: { username: true }}
        }
      });
      
      const userCreatedEvents: EventWithCreatorUsername[] = await userCreatedEventsQuery;
      
      const userCreatedEventsFiltered = userCreatedEvents.filter(
        uce => !events.some(e => e.id === uce.id)
      );
      events.push(...userCreatedEventsFiltered);
    }

    // Dédoublonnage et tri
    const uniqueEventIds = new Set<string>();
    events = events.filter(event => {
      if (uniqueEventIds.has(event.id)) {
        return false;
      }
      uniqueEventIds.add(event.id);
      return true;
    });

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    // Vous pourriez vouloir initialiser events à un tableau vide ici aussi en cas d'erreur
    // ou afficher un message d'erreur spécifique dans le JSX.
    // Pour l'instant, il restera le tableau partiellement rempli ou vide.
  }

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2 sm:mb-0">Événements Bingo</h1>
          {user && (
            <Button asChild variant="outline" className="rounded-full" size="lg">
              <Link href="/events/create">Créer un Événement</Link>
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="neumorphic-card text-center py-10">
            <p className="text-xl text-muted-foreground">Aucun événement disponible pour le moment.</p>
            {user && <p className="mt-4">Pourquoi ne pas en <Link href="/events/create" className="underline text-primary hover:text-primary/80">créer un</Link> ?</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="h-full flex flex-col">
                <EventCard event={event} currentUser={user} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
