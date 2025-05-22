// app/events/[eventId]/join-leave-event-button.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Pour le code d'accès
import { joinEventAction, leaveEventAction } from './actions'; // Server Actions
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge"; // Importer Badge

interface JoinLeaveEventButtonProps {
  eventId: string;
  userId: string;
  isPublic: boolean;
  accessCode?: string | null; // Le vrai code d'accès de l'événement
  isParticipant: boolean;
  isCreator: boolean;
}

export function JoinLeaveEventButton({
  eventId,
  userId,
  isPublic,
  accessCode: actualAccessCode,
  isParticipant,
  isCreator,
}: JoinLeaveEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [enteredAccessCode, setEnteredAccessCode] = useState("");

  const handleJoin = () => { // Retirer async d'ici
    setError(null);
    if (!isPublic && !actualAccessCode) {
        setError("Cet événement privé ne peut pas être rejoint pour le moment.");
        return;
    }

    if (!isPublic && actualAccessCode && enteredAccessCode !== actualAccessCode) {
      setError("Code d'accès incorrect.");
      return;
    }

    startTransition(() => { // La fonction passée à startTransition ne doit pas être async elle-même
      // L'appel à la fonction async se fait à l'intérieur
      joinEventAction(eventId, userId).then(result => {
        if (result.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
        setShowAccessCodeInput(false);
      }).catch(err => {
        // Gérer les erreurs inattendues de l'action elle-même si nécessaire
        setError("Une erreur inattendue s'est produite.");
        setShowAccessCodeInput(false);
      });
    });
  };

  const handleLeave = () => { // Retirer async d'ici
    setError(null);
    startTransition(() => { // La fonction passée à startTransition ne doit pas être async elle-même
      leaveEventAction(eventId, userId).then(result => {
        if (result.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      }).catch(err => {
        setError("Une erreur inattendue s'est produite.");
      });
    });
  };

  if (isCreator) {
    return <Badge variant="default">Vous êtes le créateur</Badge>;
  }

  if (isParticipant) {
    return (
      <div className="flex flex-col items-start space-y-2">
        <Button variant="destructive" onClick={handleLeave} disabled={isPending} className="w-full md:w-auto rounded-full">
          {isPending ? "Traitement..." : "Quitter l'événement"}
        </Button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (!isPublic) {
    return (
      <Dialog open={showAccessCodeInput} onOpenChange={setShowAccessCodeInput}>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full md:w-auto rounded-full" onClick={() => {setError(null); setEnteredAccessCode(""); setShowAccessCodeInput(true);}}>
            Rejoindre (Privé)
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rejoindre l'événement privé</DialogTitle>
            <DialogDescription>
              Cet événement nécessite un code d'accès pour être rejoint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access-code-input" className="text-right">
                Code
              </Label>
              <Input
                id="access-code-input"
                value={enteredAccessCode}
                onChange={(e) => setEnteredAccessCode(e.target.value)}
                className="col-span-3 neumorphic-input"
                disabled={isPending}
              />
            </div>
          </div>
           {error && <p className="text-xs text-center text-red-500 pb-2">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" className="rounded-full" onClick={() => setError(null)}>Annuler</Button>
            </DialogClose>
            <Button type="button" variant="outline" className="rounded-full" onClick={handleJoin} disabled={isPending}>
              {isPending ? "Vérification..." : "Rejoindre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Événement public
  return (
     <div className="flex flex-col items-start space-y-2">
        <Button variant="default" className="w-full md:w-auto rounded-full" onClick={handleJoin} disabled={isPending}>
        {isPending ? "Traitement..." : "Rejoindre l'événement"}
        </Button>
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
