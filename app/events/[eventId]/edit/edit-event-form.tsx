// app/events/[eventId]/edit/edit-event-form.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateEventAction } from "./actions"; // Server Action que nous allons créer
import type { Event as PrismaEvent } from "@prisma/client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EditEventFormProps {
  event: PrismaEvent;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  // Formater la date pour l'input type="date" (AAAA-MM-JJ)
  const initialEventDate = event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : "";
  const [eventDate, setEventDate] = useState<string>(initialEventDate);
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [accessCode, setAccessCode] = useState(event.accessCode || "");


  const handleSubmit = (eventSubmit: FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom de l'événement est requis.");
      return;
    }

    const dateObject = eventDate ? new Date(eventDate) : null;
    if (eventDate && (!dateObject || isNaN(dateObject.getTime()))) {
            toast.error("La date de l'événement n'est pas valide.");
        return;
    }

    startTransition(() => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (dateObject) {
        formData.append("eventDate", dateObject.toISOString());
      } else {
        formData.append("eventDate", ""); // Envoyer une chaîne vide si pas de date pour la supprimer
      }
      formData.append("isPublic", String(isPublic));
      if (!isPublic && accessCode.trim()) { // N'envoyer le code d'accès que si l'événement est privé et que le code est fourni
        formData.append("accessCode", accessCode.trim());
      } else if (isPublic) {
        formData.append("accessCode", ""); // Effacer le code d'accès si l'événement devient public
      }


      updateEventAction(event.id, formData).then(result => {
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          toast.success(`Événement "${result.data.name}" mis à jour avec succès !`);
          router.push(`/events/${event.id}`); // Rediriger vers la page de détail de l'événement
          router.refresh();
        }
      }).catch(err => {
        toast.error("Une erreur inattendue s'est produite lors de la mise à jour.");
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nom de l'événement</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
          className="mt-1 neumorphic-input"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          className="mt-1 neumorphic-input"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="eventDate">Date de l'événement (optionnel)</Label>
        <Input
          id="eventDate"
          name="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          disabled={isPending}
          className="mt-1 neumorphic-input"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          name="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
          disabled={isPending}
        />
        <Label htmlFor="isPublic" className="font-normal">
          Événement public (visible par tous)
        </Label>
      </div>

      {!isPublic && (
        <div>
          <Label htmlFor="accessCode">Code d'accès (si privé et si vous souhaitez le modifier/définir)</Label>
          <Input
            id="accessCode"
            name="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={isPending || isPublic}
            className="mt-1 neumorphic-input"
            placeholder="Laissez vide pour aucun code"
          />
           <p className="text-xs text-muted-foreground mt-1">Un code d'accès permet de restreindre qui peut rejoindre un événement privé.</p>
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Mise à jour en cours..." : "Sauvegarder les modifications"}
      </Button>
    </form>
  );
}
