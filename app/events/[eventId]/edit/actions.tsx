// app/events/[eventId]/edit/actions.ts
"use server";

import { z } from "zod";
import { PrismaClient, type Event as PrismaEvent } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Pour la redirection si besoin

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;
// Schéma de validation similaire à la création, mais tous les champs sont optionnels pour l'update partiel
// Cependant, ici on met à jour tous les champs modifiables du formulaire
const UpdateEventSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères.").max(100),
  description: z.string().max(500, "La description ne doit pas dépasser 500 caractères.").optional().nullable(),
  eventDate: z.preprocess((arg) => {
    if (typeof arg === "string" && arg.trim() !== "") return new Date(arg);
    if (arg instanceof Date) return arg;
    return null; // Permettre de supprimer la date
  }, z.date().nullable()),
  isPublic: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
  accessCode: z.string().max(50, "Code d'accès trop long").optional().nullable(),
});

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<{ error?: string | null; data?: PrismaEvent | null }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié.", data: null };
  }

  // Récupérer l'événement existant pour vérifier le créateur
  const eventToUpdate = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!eventToUpdate) {
    return { error: "Événement non trouvé.", data: null };
  }

  if (eventToUpdate.creatorId !== user.id) {
    return { error: "Action non autorisée : vous n'êtes pas le créateur de cet événement.", data: null };
  }
  
  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description") || null, // Assurer null si vide
    eventDate: formData.get("eventDate") || null,     // Assurer null si chaîne vide
    isPublic: formData.get("isPublic"),
    accessCode: formData.get("accessCode") || null, // Assurer null si vide
  };

  const validatedFields = UpdateEventSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation errors (updateEventAction):", validatedFields.error.flatten().fieldErrors);
    const errors = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Erreurs de validation: ${errors}`, data: null };
  }

  const { name, description, eventDate, isPublic, accessCode } = validatedFields.data;

  try {
    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId,
        creatorId: user.id, // Double sécurité
      },
      data: {
        name,
        description: description, // Prisma gère bien les null
        eventDate: eventDate,     // Prisma gère bien les null pour supprimer la date
        isPublic,
        accessCode: isPublic ? null : (accessCode || null), // Si public, code d'accès est null
      },
    });

    revalidatePath(`/events/${eventId}/edit`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/my-events");
    revalidatePath("/");


    return { error: null, data: updatedEvent };
  } catch (e: any) {
    console.error("Database error updating event:", e);
    return { error: "Erreur de base de données lors de la mise à jour de l'événement.", data: null };
  }
}
