import { useEffect } from "react";
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

export function OrderTrackModal({
  isOpen,
  onClose,
  initialOrderNumber,
}: OrderTrackModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Track Your Beachwood Cafe Order"
    >
      <div
        className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-3xl border border-[#1a3b6b]/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#191918]"
        onClick={(e) => e.stopPropagation()}
      >
        <OrderTrackErrorBoundary onClose={onClose}>
          <OrderTrackerView
            initialOrderNumber={initialOrderNumber}
            isModal={true}
            onClose={onClose}
          />
        </OrderTrackErrorBoundary>
      </div>
    </div>
  );
}
