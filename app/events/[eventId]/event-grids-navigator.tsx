// app/events/[eventId]/event-grids-navigator.tsx
"use client"; // Ce composant utilise des liens, peut rester serveur si Link est bien géré

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EventGridsNavigatorProps {
  currentIndex: number;
  totalGrids: number;
  eventId: string;
  participantName: string;
}

export function EventGridsNavigator({
  currentIndex,
  totalGrids,
  eventId,
  participantName,
}: EventGridsNavigatorProps) {
  if (totalGrids <= 0) return null;

  const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalGrids - 1; // Boucle
  const nextIndex = currentIndex < totalGrids - 1 ? currentIndex + 1 : 0; // Boucle

  return (
    <div className="neumorphic-card flex items-center justify-between mb-4 p-3">
      <Button variant="outline" size="icon" asChild className="rounded-full" disabled={totalGrids <= 1}>
        <Link href={`/events/${eventId}?participantIndex=${prevIndex}`} scroll={false}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Grille de</p>
        <p className="font-semibold text-lg">{participantName}</p>
        <p className="text-xs text-muted-foreground">({currentIndex + 1} / {totalGrids})</p>
      </div>
      <Button variant="outline" size="icon" asChild className="rounded-full" disabled={totalGrids <= 1}>
        <Link href={`/events/${eventId}?participantIndex=${nextIndex}`} scroll={false}>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}
