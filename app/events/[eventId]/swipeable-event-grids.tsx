// app/events/[eventId]/swipeable-event-grids.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { User } from '@supabase/supabase-js';
import type { ParticipantWithProfileAndCard } from './page'; // Type depuis la page de détail
import { ParticipantBingoGridDisplay } from './participant-bingo-grid-display';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';


interface SwipeableEventGridsProps {
  participantsWithGrids: ParticipantWithProfileAndCard[];
  eventId: string;
  currentUserIsActualParticipant: boolean;
  currentAuthUserId: string | null;
}

export function SwipeableEventGrids({
  participantsWithGrids,
  eventId,
  currentUserIsActualParticipant,
  currentAuthUserId,
}: SwipeableEventGridsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Gérer le cas où la liste des participants est vide
  if (!participantsWithGrids || participantsWithGrids.length === 0) {
    return <p className="text-center text-muted-foreground">Aucune grille de participant à afficher.</p>;
  }

  const totalGrids = participantsWithGrids.length;

  const handleSwipedLeft = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalGrids);
  };

  const handleSwipedRight = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalGrids) % totalGrids);
  };

  const handlers = useSwipeable({
    onSwipedLeft: handleSwipedLeft,
    onSwipedRight: handleSwipedRight,
    preventScrollOnSwipe: true,
    trackMouse: true, // Permet le swipe avec la souris aussi pour le test sur desktop
  });

  const goToPrevious = () => {
    handleSwipedRight(); // Même logique que swipe à droite
  };

  const goToNext = () => {
    handleSwipedLeft(); // Même logique que swipe à gauche
  };
  
  // Effet pour réinitialiser l'index si la liste des participants change (par exemple, si quelqu'un quitte/rejoint)
  // Cela pourrait être amélioré pour essayer de conserver l'index si le participant est toujours là.
  useEffect(() => {
    setCurrentIndex(0);
  }, [participantsWithGrids.length]);


  const currentParticipant = participantsWithGrids[currentIndex];

  if (!currentParticipant || !currentParticipant.user) {
    return <p className="text-center text-muted-foreground">Données du participant non disponibles.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Informations et Navigation */}
      <div className="neumorphic-card flex items-center justify-between p-3">
        <Button variant="outline" size="icon" className="rounded-full" onClick={goToPrevious} disabled={totalGrids <= 1}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Grille de</p>
          <p className="font-semibold text-lg max-w-xs sm:max-w-sm mx-auto whitespace-normal overflow-hidden line-clamp-2 text-center break-all">{currentParticipant.user.username || "Participant"}</p>
          <p className="text-xs text-muted-foreground">({currentIndex + 1} / {totalGrids})</p>
        </div>
        <Button variant="outline" size="icon" className="rounded-full" onClick={goToNext} disabled={totalGrids <= 1}>
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Conteneur pour le Swipe */}
      <div {...handlers} className="overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Affichage de la grille actuelle */}
        {currentParticipant.bingoCard ? (
          <ParticipantBingoGridDisplay
            key={currentParticipant.bingoCard.id + '-' + currentIndex} // Clé change pour forcer le re-render si nécessaire
            bingoCardId={currentParticipant.bingoCard.id}
            initialCardData={currentParticipant.bingoCard.parsedCardData || 
                Array.from({ length: 9 }, (_, i) => ({ id: i + 1, text: "N/A", status: "PENDING" }))
            }
            eventId={eventId}
            canEditStatus={currentUserIsActualParticipant}
            participantUserId={currentParticipant.userId}
            currentAuthUserId={currentAuthUserId}
          />
        ) : (
          <div className="neumorphic-card text-center py-10 px-6 h-[300px] flex flex-col items-center justify-center"> {/* Hauteur fixe pour la cohérence */}
            <p className="text-muted-foreground">{currentParticipant.user.username} n'a pas encore créé de grille.</p>
            {currentAuthUserId === currentParticipant.userId && (
                <Button asChild className="mt-4">
                    <Link href={`/events/${eventId}/my-card`}>Créer ma grille</Link>
                </Button>
            )}
          </div>
        )}
      </div>

      {/* Indicateurs de pagination (points) */}
      {totalGrids > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalGrids }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                currentIndex === index ? "bg-primary" : "bg-muted hover:bg-muted-foreground/50"
              )}
              aria-label={`Aller à la grille ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
