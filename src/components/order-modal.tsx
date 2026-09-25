import { X, ShoppingBag, ExternalLink, Bike, MessageCircle, ArrowRight } from "lucide-react";
import { site } from "../lib/site-content";
import { useCart } from "../lib/cart-context";

export function OrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { totalCount, subtotal, setIsCartOpen } = useCart();
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#c9bba6] pb-4">
          <div>
            <span className="eyebrow-label text-[#1a3b6b]">Online Ordering</span>
            <h3 className="font-display text-2xl font-medium text-[#1a1c18] mt-1">
              Order from Beachwood
            </h3>
            <p className="text-xs text-[#767064] mt-0.5">Freshly prepared in Beachwood Canyon</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#767064] hover:text-[#1a1c18] p-1 rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {totalCount > 0 && (
            <button
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-[#1a3b6b] bg-[#1a3b6b] text-white hover:bg-[#132c52] transition-all group cursor-pointer shadow-md text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#d99214] text-[#191918]">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">
                    Checkout Current Cart ({totalCount} items)
                  </h4>
                  <p className="text-xs text-[#ede4d5]/80">
                    Subtotal: ${subtotal.toFixed(2)} • Fill details to confirm order
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-[#d99214] group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <a
            href="/menu"
            onClick={onClose}
            className="flex items-center justify-between p-4 rounded-xl border border-[#c9bba6] hover:border-[#1a3b6b] hover:bg-[#dfd2be] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#d99214]/15 text-[#b87508]">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#1a1c18] group-hover:text-[#1a3b6b]">
                  Online Menu & Cart
                </h4>
                <p className="text-xs text-[#767064]">
                  Browse our full menu, add dishes to cart, and order directly
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-[#767064] group-hover:text-[#1a3b6b]" />
          </a>

          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-[#c9bba6] hover:border-[#16a34a] hover:bg-[#16a34a]/10 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#16a34a]/15 text-[#16a34a]">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#1a1c18] group-hover:text-[#16a34a]">
                  Direct WhatsApp Order
                </h4>
                <p className="text-xs text-[#767064]">
                  Order takeaway or delivery instantly with our staff
                </p>
              </div>
            </div>
            <ExternalLink className="size-4 text-[#767064] group-hover:text-[#16a34a]" />
          </a>

          <a
            href="https://www.doordash.com/store/beachwood-cafe-los-angeles-368731/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 rounded border border-[#c9bba6] hover:border-[#1a3b6b] hover:bg-[#dfd2be] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-[#1a3b6b]/10 text-[#1a3b6b]">
                <Bike className="size-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#1a1c18] group-hover:text-[#1a3b6b]">
                  DoorDash Delivery
                </h4>
                <p className="text-xs text-[#767064]">
                  Delivered right to your door in Hollywood and surrounding areas
                </p>
              </div>
            </div>
            <ExternalLink className="size-4 text-[#767064] group-hover:text-[#1a3b6b]" />
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-[#c9bba6] text-center">
          <p className="text-xs text-[#767064]">
            Have a catering or large group order?{" "}
            <a href={site.phoneHref} className="underline text-[#1a1c18] font-medium">
              Call us at {site.phone}
            </a>
            {" or "}
            <a
              href={site.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#16a34a] font-medium"
            >
              WhatsApp us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
