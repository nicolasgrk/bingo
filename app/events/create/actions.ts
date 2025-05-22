// app/events/create/actions.ts
"use server";

import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

const CreateEventSchema = z.object({
  name: z.string().min(3, { message: "Le nom doit contenir au moins 3 caractères." }).max(100),
  description: z.string().max(500, { message: "La description ne doit pas dépasser 500 caractères." }).optional(),
  eventDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date().optional()),
  isPublic: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
  creatorId: z.string().uuid({ message: "ID du créateur invalide." }),
});

export async function createEventAction(formData: FormData) {
  console.log("createEventAction: Début de l'action");
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("createEventAction: Utilisateur non authentifié.");
    return { error: "Utilisateur non authentifié.", data: null };
  }
  console.log("createEventAction: Utilisateur authentifié:", user.id);

  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
    isPublic: formData.get("isPublic"),
    creatorId: formData.get("creatorId"),
  };
  console.log("createEventAction: Données brutes du formulaire:", rawFormData);


  if (user.id !== rawFormData.creatorId) {
      console.error("createEventAction: L'ID du créateur ne correspond pas à l'utilisateur connecté.");
      return { error: "L'ID du créateur ne correspond pas à l'utilisateur connecté.", data: null };
  }

  const validatedFields = CreateEventSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("createEventAction: Erreurs de validation:", validatedFields.error.flatten().fieldErrors);
    return {
      error: "Erreur de validation: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', '),
      data: null,
    };
  }
  console.log("createEventAction: Données validées:", validatedFields.data);

  const { name, description, eventDate, isPublic, creatorId } = validatedFields.data;

  try {
    console.log("createEventAction: Début de la transaction Prisma.");
    const newEvent = await prisma.$transaction(async (tx) => {
      console.log("createEventAction: Dans la transaction - création de l'événement...");
      const createdEvent = await tx.event.create({
        data: {
          name,
          description: description || null,
          eventDate: eventDate || null,
          isPublic,
          creatorId,
        },
      });
      console.log("createEventAction: Événement créé:", createdEvent.id);

      console.log(`createEventAction: Tentative d'ajout du créateur (userId: ${creatorId}) comme participant à l'événement (eventId: ${createdEvent.id}).`);
      await tx.eventParticipant.create({
        data: {
          eventId: createdEvent.id,
          userId: creatorId,
        }
      });
      console.log("createEventAction: Créateur ajouté comme participant.");

      return createdEvent;
    });
    console.log("createEventAction: Transaction Prisma terminée avec succès. Événement créé:", newEvent.id);

    // Si l'événement est public, envoyer une notification à tous les utilisateurs
    if (newEvent.isPublic) {
      try {
        // Récupérer tous les utilisateurs qui ont activé les notifications
        const usersWithNotifications = await prisma.profile.findMany({
          where: {
            pushSubscriptions: {
              some: {} // Au moins une subscription
            }
          },
          select: {
            id: true
          }
        });

        if (usersWithNotifications.length > 0) {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Nouvel événement public',
              body: `Un nouvel événement "${newEvent.name}" a été créé`,
              url: `/events/${newEvent.id}`,
              userIds: usersWithNotifications.map(u => u.id)
            })
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
      }
    }

    revalidatePath("/events");
    revalidatePath(`/events/${newEvent.id}`);

    return { error: null, data: newEvent };
  } catch (e: any) {
    console.error("createEventAction: Erreur de base de données lors de la création de l'événement et du participant:", e);
    if (e.code === 'P2002') {
      return { error: "Erreur lors de la création de l'événement : une contrainte unique a été violée.", data: null };
    }
    return { error: "Erreur de base de données lors de la création de l'événement.", data: null };
  }
}