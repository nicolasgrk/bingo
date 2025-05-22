// app/events/[eventId]/my-card/actions.ts
"use server";

import { z } from "zod";
import { PrismaClient, type BingoCard as PrismaBingoCard } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BingoCardData, BingoCell, CellStatus } from "./page";

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Schéma de validation pour une case de bingo avec status
const BingoCellSchema = z.object({
  id: z.number().int().min(1).max(9),
  text: z.string().max(50, { message: "Le texte d'une case ne doit pas dépasser 50 caractères." }).trim(),
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED'] as [CellStatus, ...CellStatus[]]), // Utiliser l'enum de CellStatus
});

const BingoCardDataSchema = z.array(BingoCellSchema).length(9, { message: "Une grille de bingo doit contenir exactement 9 cases." });

const SaveBingoCardPayloadSchema = z.object({
  eventId: z.string().uuid(),
  eventParticipantId: z.string().uuid(),
  bingoCardId: z.string().uuid().nullable(),
  cardData: BingoCardDataSchema,
  userId: z.string().uuid(),
});

interface SaveBingoCardActionProps {
  eventId: string;
  eventParticipantId: string;
  bingoCardId: string | null;
  cardData: BingoCardData; // Attendu avec 'status'
  userId: string;
}

export async function saveBingoCardAction(
  payload: SaveBingoCardActionProps
): Promise<{ error?: string | null; data?: PrismaBingoCard | null }> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser || authUser.id !== payload.userId) {
    return { error: "Action non autorisée ou utilisateur non authentifié.", data: null };
  }
  
  // S'assurer que chaque case a un statut, par défaut PENDING si manquant.
  // Cela est important si le client envoie des données sans statut pour une nouvelle grille.
  const cardDataWithDefaults = payload.cardData.map(cell => ({
    id: cell.id,
    text: cell.text.trim(),
    status: cell.status || 'PENDING', // Assurer que status est toujours PENDING par défaut
  }));

  const validatedPayload = SaveBingoCardPayloadSchema.safeParse({
      ...payload,
      cardData: cardDataWithDefaults // Utiliser les données avec statuts assurés pour la validation
  });

  if (!validatedPayload.success) {
    console.error("Validation errors (saveBingoCardAction):", validatedPayload.error.flatten().fieldErrors);
    const errors = Object.values(validatedPayload.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Erreurs de validation: ${errors}`, data: null };
  }

  const { eventId, eventParticipantId, bingoCardId, cardData, userId } = validatedPayload.data;

  try {
    const participantRecord = await prisma.eventParticipant.findUnique({
      where: {
        id: eventParticipantId,
        AND: [{ userId: userId }, { eventId: eventId }]
      },
    });

    if (!participantRecord) {
      return { error: "Participation à l'événement non trouvée ou invalide.", data: null };
    }

    let savedCard: PrismaBingoCard;

    if (bingoCardId) {
      const existingCard = await prisma.bingoCard.findUnique({ where: { id: bingoCardId } });
      if (!existingCard || existingCard.eventParticipantId !== eventParticipantId) {
        return { error: "Grille invalide pour mise à jour.", data: null };
      }
      // Pour une mise à jour par le participant, on ne met à jour que le texte des cases.
      // Le statut est géré par l'organisateur via une autre action.
      // On doit donc fusionner les nouveaux textes avec les statuts existants.
      const existingCardData = (typeof existingCard.cardData === 'string' ? JSON.parse(existingCard.cardData) : existingCard.cardData) as BingoCardData | undefined;
      
      const updatedCardData = cardData.map(newCell => {
        const oldCell = existingCardData?.find(c => c.id === newCell.id);
        return {
          id: newCell.id,
          text: newCell.text,
          status: oldCell?.status || 'PENDING', // Conserver le statut existant, ou PENDING si nouveau/invalide
        };
      });


      savedCard = await prisma.bingoCard.update({
        where: { id: bingoCardId },
        data: { cardData: updatedCardData as any },
      });
    } else {
      // Création d'une nouvelle grille, toutes les cases auront status: 'PENDING' (assuré par cardDataWithDefaults)
      const existingCardForParticipant = await prisma.bingoCard.findUnique({
        where: { eventParticipantId: eventParticipantId }
      });
      if (existingCardForParticipant) {
        return { error: "Une grille existe déjà pour ce participant.", data: null };
      }
      savedCard = await prisma.bingoCard.create({
        data: {
          eventParticipantId: eventParticipantId,
          cardData: cardData as any, // cardData a déjà été traité par cardDataWithDefaults
        },
      });
    }

    revalidatePath(`/events/${eventId}/my-card`);
    revalidatePath(`/events/${eventId}`);
    return { error: null, data: savedCard };

  } catch (e: any) {
    console.error("Database error saving bingo card:", e);
    if (e.code === 'P2002' && e.meta?.target?.includes('eventParticipantId')) {
      return { error: "Une grille existe déjà pour votre participation.", data: null };
    }
    return { error: "Erreur de base de données lors de la sauvegarde de la grille.", data: null };
  }
}
