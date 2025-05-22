// app/events/event-card.tsx
"use client";

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User } from '@supabase/supabase-js';
import type { Event as PrismaEventType, Profile } from '@prisma/client';

type EventForCardDisplay = PrismaEventType & {
  creator: {
    username: string | null;
  } | null;
};

interface EventCardProps {
  event: EventForCardDisplay;
  currentUser: User | null;
}

export function EventCard({ event, currentUser }: EventCardProps) {
  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date non spécifiée';

  const isCreator = currentUser && event.creatorId === currentUser.id;

  return (
    <Card className="neumorphic-card flex flex-col h-full items-center justify-center p-8">
      <CardHeader className="w-full flex flex-col items-center justify-center pb-2">
        <div className="flex justify-between items-start w-full mb-2">
          <CardTitle className="text-2xl font-semibold mb-2">{event.name}</CardTitle>
          {event.isPublic ? (
            <Badge variant="outline">Public</Badge>
          ) : (
            <Badge variant="secondary">Privé</Badge>
          )}
        </div>
        {event.description && (
          <CardDescription className="text-base text-muted-foreground pt-1 line-clamp-3 text-center">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow w-full flex flex-col items-center justify-center mb-4">
        <div className="text-sm text-muted-foreground mb-1 text-center">
          Créé par :{' '}
          {event.creator && event.creatorId ? (
            <Link href={`/users/${event.creatorId}`} className="text-primary hover:underline">
              {event.creator.username || 'Inconnu'}
            </Link>
          ) : (
            event.creator?.username || 'Inconnu'
          )}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Date de l'événement : {formattedDate}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col space-y-3 w-full">
        <Button asChild className="neumorphic-btn w-full text-base h-12 rounded-xl">
          <Link href={`/events/${event.id}`}>Voir les détails</Link>
        </Button>


        {isCreator && (
           <Button variant="outline" className="w-full text-base h-12 rounded-xl" asChild>
            <Link href={`/events/${event.id}/edit`}>Gérer l'événement</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
