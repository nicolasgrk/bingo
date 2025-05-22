// app/events/[eventId]/my-card/page.tsx
import { PrismaClient, type BingoCard as PrismaBingoCard, type Event as PrismaEvent } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { BingoCardForm } from './bingo-card-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Définir les types pour les données de la grille
// Correspond à l'enum BingoCellStatus dans schema.prisma
export type CellStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface BingoCell {
  id: number; // 1 à 9
  text: string;
  status: CellStatus; // Remplacer 'checked' par 'status'
}
export type BingoCardData = BingoCell[];


export default async function MyBingoCardPage({ params }: MyBingoCardPageProps) { // MyBingoCardPageProps reste la même
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?message=Veuillez vous connecter pour voir votre grille.&next=/events/${eventId}/my-card`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, name: true }
  });

  if (!event) {
    notFound();
  }

  const participantRecord = await prisma.eventParticipant.findUnique({
    where: {
      EventParticipant_event_id_user_id_key: {
        eventId: eventId,
        userId: user.id,
      },
    },
    select: { id: true }
  });

  if (!participantRecord) {
    redirect(`/events/${eventId}?error=Vous devez participer à l'événement pour gérer votre grille.`);
  }

  let bingoCard: PrismaBingoCard | null = null;
  try {
    bingoCard = await prisma.bingoCard.findUnique({
      where: {
        eventParticipantId: participantRecord.id,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la grille de bingo:", error);
  }

  let initialCardData: BingoCardData | null = null;
  if (bingoCard && bingoCard.cardData) {
    try {
      const parsedData = typeof bingoCard.cardData === 'string'
        ? JSON.parse(bingoCard.cardData)
        : bingoCard.cardData;

      // Vérification plus robuste du format attendu
      if (
        Array.isArray(parsedData) &&
        parsedData.length > 0 && // Au moins une case pour vérifier la structure
        parsedData.every(cell => 
            typeof cell === 'object' &&
            cell !== null &&
            'id' in cell && typeof cell.id === 'number' &&
            'text' in cell && typeof cell.text === 'string' &&
            'status' in cell && (cell.status === 'PENDING' || cell.status === 'VALIDATED' || cell.status === 'REJECTED')
        )
      ) {
        initialCardData = parsedData as BingoCardData;
      } else {
          console.warn("cardData n'a pas le format attendu (avec status), réinitialisation.");
      }
    } catch (e) {
      console.error("Erreur lors du parsing de cardData:", e);
    }
  }
  
  if (!initialCardData) {
    initialCardData = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      text: "",
      status: "PENDING", // Initialiser avec PENDING
    }));
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
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center tracking-tight text-primary">Votre Grille Bingo</h1>
        <p className="text-center text-muted-foreground mb-8">Pour l'événement : <span className="font-semibold">{event.name}</span></p>
        <div className="neumorphic-card p-6 md:p-8">
          <BingoCardForm
            eventId={eventId}
            eventParticipantId={participantRecord.id}
            existingBingoCardId={bingoCard?.id || null}
            initialCardData={initialCardData}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  );
}

// Définition de MyBingoCardPageProps si elle n'est pas déjà définie ailleurs
interface MyBingoCardPageProps {
  params: {
    eventId: string;
  };
}
