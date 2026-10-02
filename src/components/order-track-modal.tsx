import { useEffect, useState } from "react";
import {
  OrderTrackerView,
  OrderTrackErrorBoundary,
  formatPrice,
  safeOrderNumber,
} from "./order-tracker-view";

export { OrderTrackerView, OrderTrackErrorBoundary, formatPrice, safeOrderNumber };

export interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string | undefined;
}

export function OrderTrackModal({ isOpen, onClose, initialOrderNumber }: OrderTrackModalProps) {
  const [retryCount, setRetryCount] = useState(0);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Track Your Beachwood Cafe Order"
    >
      <div
        className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-2xl sm:rounded-3xl border border-[#1a3b6b]/20 shadow-2xl overflow-hidden flex flex-col my-auto text-[#191918]"
        style={{
          maxHeight: "min(820px, calc(100dvh - 2rem))",
          height: "min(820px, calc(100dvh - 2rem))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
          <OrderTrackErrorBoundary onClose={onClose} onRetry={() => setRetryCount((c) => c + 1)}>
            <OrderTrackerView
              key={`modal_track_${retryCount}_${initialOrderNumber || ""}`}
              initialOrderNumber={initialOrderNumber}
              isModal={true}
              onClose={onClose}
            />
          </OrderTrackErrorBoundary>
        </div>
      </div>
    </div>
  );
}
