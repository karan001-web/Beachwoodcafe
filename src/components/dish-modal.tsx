import { useState } from "react";
import { X, Sparkles, ShoppingBag, Check } from "lucide-react";
import { useCart } from "../lib/cart-context";

export interface FeaturedDish {
  name: string;
  subtitle: string;
  image: string;
  category: string;
  price: string;
  description: string;
  ingredients: string[];
  tags: string[];
}

export function DishModal({ dish, onClose }: { dish: FeaturedDish | null; onClose: () => void }) {
  const { addToCart, setIsCartOpen, getItemQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (!dish) return null;

  const currentQty = getItemQuantity(dish.name);

  const handleAdd = () => {
    addToCart({
      name: dish.name,
      price: dish.price,
      description: dish.description,
      tags: dish.tags,
      image: dish.image,
      ingredients: dish.ingredients,
      subtitle: dish.subtitle,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1c1e19]">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close dish details"
          >
            <X className="size-4" />
          </button>
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
            {dish.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold uppercase tracking-wider bg-white/90 text-[#1a1c18] backdrop-blur-sm shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow-label text-[#1a3b6b]">{dish.category}</span>
              <h3 className="font-display text-2xl font-medium text-[#1a1c18] mt-0.5">
                {dish.name}
              </h3>
              <p className="text-xs text-[#767064] italic">{dish.subtitle}</p>
            </div>
            <span className="font-display text-2xl text-[#1a3b6b] font-medium">{dish.price}</span>
          </div>

          <p className="text-sm leading-relaxed text-[#49443b]">{dish.description}</p>

          <div>
            <h4 className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#767064] mb-2 flex items-center gap-1">
              <Sparkles className="size-3 text-[#d99214]" /> Key Ingredients
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {dish.ingredients.map((ing) => (
                <span key={ing} className="px-2 py-1 bg-[#dfd2be] rounded text-xs text-[#38342c]">
                  {ing}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#c9bba6] flex flex-wrap items-center justify-between gap-2.5">
            <button
              onClick={handleAdd}
              className="btn-olive flex-1 text-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              {justAdded ? (
                <>
                  <Check className="size-4 mr-1" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="size-3.5 mr-1" />
                  {currentQty > 0 ? `Add Another (${currentQty} in cart)` : "Add to Cart"}
                </>
              )}
            </button>
            <button
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              className="btn-cobalt py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
            >
              View Cart
            </button>
            <button onClick={onClose} className="btn-outline-dark py-2.5 px-3 text-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
