/// app/events/[eventId]/actions.ts
"use server";

import { z } from "zod";
import { PrismaClient, type BingoCard as PrismaBingoCard } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BingoCardData, BingoCell, CellStatus } from "./my-card/page"; // Assurez-vous que ce chemin est correct

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

const UpdateCellStatusPayloadSchema = z.object({
  bingoCardId: z.string().uuid(),
  cellId: z.number().int().min(1).max(9),
  newStatus: z.enum(['PENDING', 'VALIDATED', 'REJECTED'] as [CellStatus, ...CellStatus[]]),
  eventId: z.string().uuid(),
});

interface UpdateCellStatusActionProps {
  bingoCardId: string;
  cellId: number;
  newStatus: CellStatus;
  eventId: string;
}

export async function updateBingoCellStatusAction(
  payload: UpdateCellStatusActionProps
): Promise<{ error?: string | null; data?: PrismaBingoCard | null }> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Utilisateur non authentifié.", data: null };
  }

  const validatedPayload = UpdateCellStatusPayloadSchema.safeParse(payload);

  if (!validatedPayload.success) {
    const errors = Object.values(validatedPayload.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Erreurs de validation: ${errors}`, data: null };
  }

  const { bingoCardId, cellId, newStatus, eventId } = validatedPayload.data;

  try {
    const currentUserParticipation = await prisma.eventParticipant.findUnique({
      where: {
        EventParticipant_event_id_user_id_key: {
          eventId: eventId,
          userId: authUser.id,
        },
      },
    });

    if (!currentUserParticipation) {
      return { error: "Action non autorisée : vous devez participer à cet événement.", data: null };
    }

    const bingoCardToUpdate = await prisma.bingoCard.findUnique({
      where: { id: bingoCardId },
      include: { eventParticipant: { select: { eventId: true } } },
    });

    if (!bingoCardToUpdate) {
      return { error: "Grille de bingo non trouvée.", data: null };
    }

    if (bingoCardToUpdate.eventParticipant?.eventId !== eventId) {
      return { error: "Action non autorisée : cette grille n'appartient pas à l'événement spécifié.", data: null };
    }

    let currentCardData = (
      typeof bingoCardToUpdate.cardData === 'string'
        ? JSON.parse(bingoCardToUpdate.cardData)
        : bingoCardToUpdate.cardData
    ) as BingoCardData | undefined;

    if (!currentCardData || !Array.isArray(currentCardData)) {
      return { error: "Format des données de la grille incorrect.", data: null };
    }

    const cellIndex = currentCardData.findIndex(cell => cell.id === cellId);
    if (cellIndex === -1) {
      return { error: `Case avec ID ${cellId} non trouvée dans la grille.`, data: null };
    }

    currentCardData[cellIndex].status = newStatus;

    // Calculer le nouveau score
    const newScore = currentCardData.filter(cell => cell.status === 'VALIDATED').length;

    const updatedBingoCard = await prisma.bingoCard.update({
      where: { id: bingoCardId },
      data: {
        cardData: currentCardData as any, // Prisma attend JsonValue
        score: newScore, // Mettre à jour le score
      },
    });

    // Envoyer une notification à l'organisateur de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true }
    });

    if (event) {
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Mise à jour de grille',
            body: `Une case a été mise à jour dans une grille de l'événement`,
            url: `/events/${eventId}`,
            userIds: [event.creatorId]
          })
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error);
      }
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/leaderboard`); // Revalider aussi la page de classement

    return { error: null, data: updatedBingoCard };

  } catch (e: any) {
    console.error("Database error updating cell status and score:", e);
    return { error: "Erreur de base de données lors de la mise à jour du statut et du score de la case.", data: null };
  }
}
export async function joinEventAction(eventId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser || authUser.id !== userId) {
    return { error: "Action non autorisée ou utilisateur non authentifié." };
  }

  try {
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: {
        EventParticipant_event_id_user_id_key: { // Nom de la contrainte unique
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (existingParticipant) {
      return { error: "Vous participez déjà à cet événement." };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return { error: "Événement non trouvé." };
    }

    await prisma.eventParticipant.create({
      data: {
        eventId: eventId,
        userId: userId,
      },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    return { success: true };
  } catch (e: any) {
    console.error("Erreur en rejoignant l'événement:", e);
    if (e.code === 'P2002') {
        return { error: "Vous participez déjà à cet événement (erreur base de données)." };
    }
    return { error: "Impossible de rejoindre l'événement pour le moment." };
  }
}

export async function leaveEventAction(eventId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser || authUser.id !== userId) {
    return { error: "Action non autorisée ou utilisateur non authentifié." };
  }

  try {
    await prisma.eventParticipant.delete({
      where: {
        EventParticipant_event_id_user_id_key: { // Nom de la contrainte unique
          eventId: eventId,
          userId: userId,
        },
      },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    return { success: true };
  } catch (e: any) {
    console.error("Erreur en quittant l'événement:", e);
     if (e.code === 'P2025') {
        return { error: "Vous ne participez pas à cet événement ou avez déjà quitté." };
    }
    return { error: "Impossible de quitter l'événement pour le moment." };
  }
}
