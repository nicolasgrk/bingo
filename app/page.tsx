// app/page.tsx
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PrismaClient, type Event as PrismaEventType, type Profile } from '@prisma/client';
import { EventCard } from '@/app/events/event-card';
import { Compass, CalendarClock, PlusCircle, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils"; // Importer cn pour combiner les classes conditionnellement

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire

type EventForHomepage = PrismaEventType & {
  creator: {
    username: string | null;
  } | null;
};

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let myActiveEvents: EventForHomepage[] = [];
  let discoverEvents: EventForHomepage[] = [];

  if (user) {
    try {
      const now = new Date();
      const participations = await prisma.eventParticipant.findMany({
        where: {
          userId: user.id,
          event: {
            OR: [
              { eventDate: null },
              { eventDate: { gte: now } }
            ]
          }
        },
        include: {
          event: {
            include: {
              creator: { select: { username: true } },
            }
          }
        },
        orderBy: {
          event: { eventDate: 'asc' }
        },
        take: 6
      });
      myActiveEvents = participations.map(p => p.event).filter(event => event !== null) as EventForHomepage[];

      const myActiveEventIds = myActiveEvents.map(e => e.id);
      
      discoverEvents = await prisma.event.findMany({
        where: {
          isPublic: true,
          NOT: {
            id: { in: myActiveEventIds }
          }
        },
        include: {
          creator: { select: { username: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des événements pour l'accueil:", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12">
      {user ? (
        <>
          <section className="w-full max-w-6xl mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center">
                <CalendarClock className="mr-3 h-6 w-6 text-primary" />
                Mes Événements en Cours
              </h2>
              <Button variant="outline" asChild className="neumorphic-btn">
                <Link href="/my-events">Tout voir &rarr;</Link>
              </Button>
            </div>
            <div className="neumorphic-panel">
              {myActiveEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {myActiveEvents.map((event) => (
                    <div key={event.id} className="flex justify-center items-center">
                      <EventCard event={event} currentUser={user} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Vous ne participez à aucun événement en cours.</p>
                  <Button variant="outline" asChild className="neumorphic-btn mt-4">
                      <Link href="/events">Explorer les événements</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="w-full max-w-6xl mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center">
                <Compass className="mr-3 h-6 w-6 text-primary" />
                Découvrir des Événements
              </h2>
              {discoverEvents.length > 0 && (
                <Button variant="outline" asChild className="neumorphic-btn">
                    <Link href="/events">Voir tous les événements &rarr;</Link>
                </Button>
              )}
            </div>
            <div className="neumorphic-panel">
              {discoverEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {discoverEvents.map((event) => (
                    <div key={event.id} className="flex justify-center items-center">
                      <EventCard event={event} currentUser={user} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Aucun nouvel événement public à découvrir pour le moment.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
          <div className="neumorphic-panel p-12 md:p-20 text-center max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              Bingo Friends App
            </h1>
            <p className="text-lg text-muted-foreground mb-10">
              L'application parfaite pour organiser et jouer au bingo entre amis, où que vous soyez !
            </p>
            <Button size="lg" asChild className="neumorphic-btn">
              <Link href="/auth">Commencer</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
