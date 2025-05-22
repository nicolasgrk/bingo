// app/events/[eventId]/participant-bingo-grid-display.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRef } from 'react';
import type { BingoCardData, BingoCell, CellStatus } from './my-card/page'; // Types depuis la page de création de carte
import { updateBingoCellStatusAction } from './actions'; // L'action que nous avons créée
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Lock, CheckCircle, XCircle, HelpCircle } from 'lucide-react'; // Icônes

interface ParticipantBingoGridDisplayProps {
  bingoCardId: string;
  initialCardData: BingoCardData;
  eventId: string; // Nécessaire pour l'action de mise à jour (vérification des permissions)
  canEditStatus: boolean; // L'utilisateur actuel peut-il modifier les statuts ?
  participantUserId: string; // L'ID de l'utilisateur à qui appartient cette grille
  currentAuthUserId: string | null; // L'ID de l'utilisateur actuellement connecté
}

const statusColors: Record<CellStatus, string> = {
  PENDING: 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600',
  VALIDATED: 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 text-green-700 dark:text-green-300 border-green-500',
  REJECTED: 'bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-300 border-red-500',
};

const statusIcons: Record<CellStatus, JSX.Element> = {
    PENDING: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
    VALIDATED: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
    REJECTED: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
}

export function ParticipantBingoGridDisplay({
  bingoCardId,
  initialCardData,
  eventId,
  canEditStatus,
  participantUserId,
  currentAuthUserId,
}: ParticipantBingoGridDisplayProps) {
  const [cardData, setCardData] = useState<BingoCardData>(initialCardData);
  const [isPending, startTransition] = useTransition();
  const [modalCellText, setModalCellText] = useState<string | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  const getNextStatus = (currentStatus: CellStatus): CellStatus => {
    if (currentStatus === 'PENDING') return 'VALIDATED';
    if (currentStatus === 'VALIDATED') return 'REJECTED';
    if (currentStatus === 'REJECTED') return 'PENDING';
    return 'PENDING'; // Fallback
  };

  const handleCellClick = (cell: BingoCell) => {
    if (!canEditStatus || isPending) return; // Seuls les participants autorisés peuvent éditer

    const newStatus = getNextStatus(cell.status);

    // Optimistic update de l'UI
    const optimisticCardData = cardData.map(c =>
      c.id === cell.id ? { ...c, status: newStatus } : c
    );
    setCardData(optimisticCardData);

    startTransition(() => {
      updateBingoCellStatusAction({
        bingoCardId,
        cellId: cell.id,
        newStatus,
        eventId, // Passé pour la vérification des permissions dans l'action
      }).then(result => {
        if (result.error) {
          toast.error(result.error);
          // Revenir à l'état précédent en cas d'erreur
          setCardData(cardData);
        } else if (result.data?.cardData) {
          // Mettre à jour avec les données du serveur pour être sûr
          try {
            const serverCardData = typeof result.data.cardData === 'string' 
                ? JSON.parse(result.data.cardData) 
                : result.data.cardData;
            if(Array.isArray(serverCardData)){
                setCardData(serverCardData as BingoCardData);
            }
          } catch(e){
            console.error("Erreur parsing server card data on success:", e);
            // On a déjà fait une mise à jour optimiste, on peut la laisser.
          }
          // toast.success(`Case ${cell.id} mise à jour à ${newStatus}`); // Peut-être trop verbeux
        }
      }).catch(err => {
        toast.error("Erreur de communication avec le serveur.");
        setCardData(cardData); // Revenir à l'état précédent
      });
    });
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="neumorphic-card grid grid-cols-3 gap-3 p-3 sm:p-6 w-full max-w-xs sm:max-w-md aspect-square">
          {cardData.map((cell) => (
            <button
              key={cell.id}
              onClick={() => handleCellClick(cell)}
              disabled={!canEditStatus || isPending}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center p-2 sm:p-4 text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-150 text-sm sm:text-base",
                statusColors[cell.status],
                canEditStatus ? 'cursor-pointer' : 'cursor-not-allowed'
              )}
              aria-label={`Case ${cell.id}: ${cell.text}, statut: ${cell.status}`}
              onMouseDown={(e) => {
                if (e.button !== 0) return; // seulement clic gauche
                longPressTimeout.current = setTimeout(() => setModalCellText(cell.text || "Vide"), 500);
              }}
              onMouseUp={() => { if (longPressTimeout.current) clearTimeout(longPressTimeout.current); }}
              onMouseLeave={() => { if (longPressTimeout.current) clearTimeout(longPressTimeout.current); }}
              onTouchStart={() => { longPressTimeout.current = setTimeout(() => setModalCellText(cell.text || "Vide"), 500); }}
              onTouchEnd={() => { if (longPressTimeout.current) clearTimeout(longPressTimeout.current); }}
            >
              <span className="font-medium mb-1 w-full h-full break-words overflow-hidden text-ellipsis line-clamp-2 flex items-center justify-center text-center">
                {cell.text || "Vide"}
              </span>
              <div className="mt-auto opacity-80">
                {statusIcons[cell.status]}
              </div>
            </button>
          ))}
        </div>
      </div>
      {modalCellText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalCellText(null)}
        >
          <div
            className="neumorphic-card max-w-md w-[90vw] p-8 rounded-3xl text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-2xl sm:text-3xl font-bold break-words mb-4">{modalCellText}</div>
            <button
              className="mt-2 px-6 py-2 neumorphic-btn rounded-full text-base"
              onClick={() => setModalCellText(null)}
              autoFocus
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
