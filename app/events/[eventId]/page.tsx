// app/events/[eventId]/page.tsx
import {
  PrismaClient,
  type Event as PrismaEvent,
  type Profile,
  type EventParticipant as PrismaEventParticipant,
  type BingoCard as PrismaBingoCard
} from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { JoinLeaveEventButton } from './join-leave-event-button';
// Supprimer l'import de ParticipantBingoGridDisplay et EventGridsNavigator car géré par SwipeableEventGrids
// import { ParticipantBingoGridDisplay } from './participant-bingo-grid-display';
// import { EventGridsNavigator } from './event-grids-navigator';
import { SwipeableEventGrids } from './swipeable-event-grids'; // Nouveau composant
import type { BingoCardData } from './my-card/page';
import { ArrowLeft, ListOrdered } from 'lucide-react';

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

export type ParticipantWithProfileAndCard = PrismaEventParticipant & {
  user: Profile | null;
  bingoCard: (PrismaBingoCard & { parsedCardData?: BingoCardData }) | null;
};

export type EventWithDetailedParticipantsAndCards = PrismaEvent & {
  creator: Profile | null;
  participants: ParticipantWithProfileAndCard[];
};

interface EventDetailPageProps {
  params: {
    eventId: string;
  };
  // searchParams n'est plus nécessaire pour participantIndex
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let event: EventWithDetailedParticipantsAndCards | null = null;

  try {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
        participants: {
          include: {
            user: true,
            bingoCard: true,
          },
          orderBy: {
            user: { username: 'asc' } // Trier pour un ordre cohérent des swipes
          }
        },
      },
    });
  } catch (error) {
    console.error("Erreur Prisma lors de la récupération de l'événement et des grilles:", error);
  }

  if (!event) {
    notFound();
  }

  // Parser cardData pour chaque bingoCard
  event.participants.forEach(p => {
    if (p.bingoCard && p.bingoCard.cardData) {
      try {
        const parsed = typeof p.bingoCard.cardData === 'string'
          ? JSON.parse(p.bingoCard.cardData)
          : p.bingoCard.cardData;
        if (Array.isArray(parsed)) {
          p.bingoCard.parsedCardData = parsed as BingoCardData;
        } else {
          p.bingoCard.parsedCardData = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, text: "Erreur Format", status: "PENDING" }));
        }
      } catch (e) {
        console.error("Erreur parsing cardData pour participant", p.userId, e);
        p.bingoCard.parsedCardData = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, text: "Erreur Parse", status: "PENDING" }));
      }
    } else if (p.bingoCard) { // Si bingoCard existe mais cardData est null/undefined
        p.bingoCard.parsedCardData = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, text: "Vide", status: "PENDING" }));
    }
  });

  const currentUserIsActualParticipant = authUser ? event.participants.some(p => p.userId === authUser.id) : false;
  const currentUserIsCreator = authUser ? event.creatorId === authUser.id : false;

  const formattedEventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Date non spécifiée';

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-3xl mx-auto">
        <div className=" p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-6">
            <div>
              <Button variant="outline" size="sm" asChild className="mb-4 md:mb-0 md:absolute md:top-6 md:left-6 rounded-full">
                  <Link href="/events">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux événements
                  </Link>
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold mt-4 md:mt-0 mb-2">{event.name}</h1>
              <div className="flex items-center space-x-2 mb-2">
                {event.isPublic ? <Badge variant="outline">Public</Badge> : <Badge variant="secondary">Privé</Badge>}
                <span className="text-sm text-muted-foreground">
                  Créé par :{' '}
                  {event.creator && event.creator.id ? (
                    <Link href={`/users/${event.creator.id}`} className="text-primary hover:underline">
                      {event.creator.username || 'Inconnu'}
                    </Link>
                  ) : (
                    event.creator?.username || 'Inconnu'
                  )}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Date : {formattedEventDate}</p>
              <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2 text-primary hover:text-primary/80">
                  <Link href={`/events/${eventId}/leaderboard`}>
                      <ListOrdered className="mr-2 h-4 w-4" />
                      Voir le classement
                  </Link>
              </Button>
            </div>
            {authUser && (
              <div className="mt-4 md:mt-0 self-start md:self-center">
                <JoinLeaveEventButton
                  eventId={event.id}
                  userId={authUser.id}
                  isPublic={event.isPublic}
                  accessCode={event.accessCode}
                  isParticipant={currentUserIsActualParticipant}
                  isCreator={currentUserIsCreator}
                />
              </div>
            )}
          </div>

          {event.description && (
            <div className="mb-8 prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p>{event.description}</p>
            </div>
          )}

          {/* Section des Participants (liste simple) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Participants ({event.participants.length})</h2>
            {event.participants.length > 0 ? (
              <ul className="space-y-1 text-sm mb-8">
                {event.participants.map(participant => (
                  <li key={participant.id} className="p-1">
                    {participant.user && participant.user.id ? (
                      <Link href={`/users/${participant.user.id}`} className="hover:underline text-muted-foreground hover:text-primary">
                        - {participant.user.username || 'Participant anonyme'}
                        {participant.userId === event?.creatorId && " (Créateur)"}
                        {participant.bingoCard ? "" : " (n'a pas encore de grille)"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">- {participant.user?.username || 'Participant anonyme'}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-8">Aucun participant pour le moment.</p>
            )}
          </div>
          
          {/* Section des Grilles de Bingo avec Swipe */}
          {event.participants.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-6 text-center">Grilles des Participants</h2>
              <SwipeableEventGrids
                participantsWithGrids={event.participants}
                eventId={eventId}
                currentUserIsActualParticipant={currentUserIsActualParticipant}
                currentAuthUserId={authUser?.id || null}
              />
            </div>
          ) : (
              !currentUserIsActualParticipant && authUser && ( // Si l'utilisateur n'est pas participant mais est connecté
                  <div className="text-center mt-6">
                      <p className="text-muted-foreground">Rejoignez l'événement pour voir les grilles !</p>
                  </div>
              )
          )}

           {/* ... (Actions du créateur et lien "Ma Grille Personnelle" comme avant) ... */}
           {authUser?.id === event.creatorId && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Actions du Créateur</h2>
              <Button variant="outline" asChild>
                <Link href={`/events/${event.id}/edit`}>Modifier l'événement</Link>
              </Button>
            </div>
          )}
           {currentUserIsActualParticipant && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-2">Ma Grille Personnelle</h2>
              <Button asChild variant="default">
                  <Link href={`/events/${eventId}/my-card`}>Gérer ma grille (texte)</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
