// app/events/[eventId]/my-card/bingo-card-form.tsx
"use client";

import { useState, useTransition, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { saveBingoCardAction } from "./actions"; // Server Action
import type { BingoCardData, BingoCell, CellStatus } from "./page"; // Importer les types

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BingoCardFormProps {
  eventId: string;
  eventParticipantId: string;
  existingBingoCardId: string | null;
  initialCardData: BingoCardData; // Tableau de 9 BingoCell avec 'status'
  userId: string;
}

export function BingoCardForm({
  eventId,
  eventParticipantId,
  existingBingoCardId,
  initialCardData,
  userId,
}: BingoCardFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [cardData, setCardData] = useState<BingoCardData>(initialCardData);

  const handleCellTextChange = (index: number, text: string) => {
    const newCardData = [...cardData];
    newCardData[index].text = text;
    setCardData(newCardData);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const filledCells = cardData.filter(cell => cell.text.trim() !== "").length;
    if (filledCells === 0) {
        toast.error("Veuillez remplir au moins une case de votre grille.");
        return;
    }

    // S'assurer que toutes les cases ont un statut (devrait être PENDING par défaut)
    const cardDataWithEnsuredStatus = cardData.map(cell => ({
      ...cell,
      status: cell.status || 'PENDING' // Assurer un statut par défaut si manquant
    }));

    startTransition(() => {
      saveBingoCardAction({
        eventId,
        eventParticipantId,
        bingoCardId: existingBingoCardId,
        cardData: cardDataWithEnsuredStatus, // Utiliser les données avec statut assuré
        userId,
      }).then(result => {
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          toast.success("Grille de bingo sauvegardée avec succès !");
          // Mettre à jour l'état local avec les données retournées si nécessaire,
          // notamment si l'ID a été créé ou si le serveur a modifié des choses.
          // Pour l'instant, router.refresh() va re-fetch les données de la page serveur.
          if (result.data.cardData) {
             // Assumons que result.data.cardData est du bon type BingoCardData
             // Cela peut nécessiter un parsing si c'est une chaîne JSON brute
             try {
                const parsedServerData = typeof result.data.cardData === 'string' 
                    ? JSON.parse(result.data.cardData) 
                    : result.data.cardData;
                if (Array.isArray(parsedServerData)) {
                    setCardData(parsedServerData as BingoCardData);
                }
             } catch (e) {
                console.error("Erreur parsing cardData du serveur:", e);
                router.refresh(); // Fallback sur refresh si le parsing échoue
             }
          } else {
            router.refresh();
          }
        }
      }).catch(err => {
        console.error("Erreur inattendue lors de la sauvegarde:", err);
        toast.error("Une erreur inattendue s'est produite lors de la sauvegarde.");
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {cardData.map((cell, index) => (
          <div key={cell.id} className="flex flex-col space-y-1">
            <Label htmlFor={`cell-text-${cell.id}`} className="sr-only">
              Case {cell.id}
            </Label>
            <Input
              id={`cell-text-${cell.id}`}
              name={`cell-text-${cell.id}`}
              value={cell.text}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleCellTextChange(index, e.target.value)
              }
              placeholder={`Case ${cell.id}`}
              className="neumorphic-input text-center text-sm md:text-base p-2 h-20 md:h-24"
              disabled={isPending}
              maxLength={50}
            />
            {/* La checkbox pour 'cochée' est supprimée. Le statut sera géré ailleurs. */}
            {/* Afficher le statut actuel (pour débogage ou info, peut être stylisé plus tard) */}
            {/* <p className="text-xs text-center text-muted-foreground">Statut: {cell.status}</p> */}
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? "Sauvegarde en cours..."
          : existingBingoCardId
          ? "Mettre à jour la grille"
          : "Créer ma grille"}
      </Button>
    </form>
  );
}
