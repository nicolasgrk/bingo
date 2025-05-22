// app/events/create/create-event-form.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEventAction } from "./actions"; // Server Action que nous allons créer

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
// Pour un DatePicker plus avancé (optionnel pour l'instant)
// import { Calendar as CalendarIcon } from "lucide-react"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { Calendar } from "@/components/ui/calendar"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"

interface CreateEventFormProps {
  userId: string; // ID de l'utilisateur connecté (creator_id)
}

export function CreateEventForm({ userId }: CreateEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // États pour les champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<string>(""); // Format YYYY-MM-DD
  const [isPublic, setIsPublic] = useState(true);
  // const [accessCode, setAccessCode] = useState(""); // Pour les événements privés

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError("Le nom de l'événement est requis.");
      return;
    }

    // Convertir la date en objet Date si elle est fournie, sinon null
    const dateObject = eventDate ? new Date(eventDate) : null;
    // Vérifier si la date est valide si elle est fournie
    if (eventDate && (!dateObject || isNaN(dateObject.getTime()))) {
        setError("La date de l'événement n'est pas valide.");
        return;
    }

    startTransition(() => {
      (async () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        if (dateObject) { // N'ajoutez que si la date est valide
          formData.append("eventDate", dateObject.toISOString());
        }
        formData.append("isPublic", String(isPublic));
        formData.append("creatorId", userId);
        // if (!isPublic && accessCode) {
        //   formData.append("accessCode", accessCode);
        // }

        const result = await createEventAction(formData);

        if (result.error) {
          setError(result.error);
          setSuccessMessage(null);
        } else if (result.data) {
          setSuccessMessage(`Événement "${result.data.name}" créé avec succès !`);
          setError(null);
          // Réinitialiser le formulaire
          setName("");
          setDescription("");
          setEventDate("");
          setIsPublic(true);
          // setAccessCode("");
          // Optionnel: rediriger vers la page de l'événement ou une liste d'événements
          // router.push(`/events/${result.data.id}`);
          router.push("/events"); // Pour l'instant, redirigeons vers une future page listant les événements
          router.refresh(); // Rafraîchir pour voir le nouvel événement si on reste sur une page qui les liste
        }
      })();
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
          type="date" // Simple input date
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          disabled={isPending}
          className="mt-1 neumorphic-input"
        />
        {/* Exemple pour un DatePicker Shadcn/ui plus avancé (à implémenter si souhaité) */}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !eventDate && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(new Date(eventDate), "PPP") : <span>Choisissez une date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={eventDate ? new Date(eventDate) : undefined}
              onSelect={(date) => setEventDate(date ? date.toISOString().split('T')[0] : "")}
              initialFocus
            />
          </PopoverContent>
        </Popover> */}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          name="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
          disabled={isPending}
          className="neumorphic-inset"
        />
        <Label htmlFor="isPublic" className="font-normal">
          Événement public (visible par tous)
        </Label>
      </div>

      {/* {!isPublic && (
        <div>
          <Label htmlFor="accessCode">Code d'accès (si privé)</Label>
          <Input
            id="accessCode"
            name="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={isPending || isPublic}
            className="mt-1"
            placeholder="Ex: BINGO123"
          />
        </div>
      )} */}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        {isPending ? "Création en cours..." : "Créer l'événement"}
      </Button>
    </form>
  );
}

