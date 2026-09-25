import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Sparkles,
  Utensils,
  Coffee,
  Wine,
  Leaf,
  X,
  ChevronRight,
  ArrowRight,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { menuSections, type MenuItem } from "../lib/site-content";
import { DishModal, type FeaturedDish } from "../components/dish-modal";
import { OrderModal } from "../components/order-modal";
import { useCart } from "../lib/cart-context";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Daily Prices | Beachwood Cafe Hollywood" },
      {
        name: "description",
        content:
          "Explore breakfast, brunch, lunch, dinner, coffee and drinks with full pricing at Beachwood Cafe in the Hollywood Hills.",
      },
      { property: "og:title", content: "Menu & Prices | Beachwood Cafe" },
      {
        property: "og:description",
        content:
          "Full breakfast, brunch, lunch, dinner, specialty coffee and natural wine menu at Beachwood Cafe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/menu" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/menu" }],
  }),
  component: MenuPage,
});

type DietaryFilter = "all" | "featured" | "vegetarian" | "vegan" | "gluten-free";

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDish, setSelectedDish] = useState<FeaturedDish | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState<boolean>(false);
  const { addToCart, updateQuantity, getItemQuantity, totalCount, subtotal, setIsCartOpen } = useCart();


  // Filter menu sections and items dynamically based on search and dietary filter
  const filteredSections = useMemo(() => {
    return menuSections
      .filter((sec) => activeCategory === "all" || sec.id === activeCategory)
      .map((sec) => {
        const filteredGroups = sec.groups
          .map((grp) => {
            const filteredItems = grp.items.filter((item) => {
              // Search query check
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const nameMatch = item.name.toLowerCase().includes(query);
                const descMatch = item.description?.toLowerCase().includes(query);
                const ingMatch = item.ingredients?.some((ing) =>
                  ing.toLowerCase().includes(query)
                );
                const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(query));
                if (!nameMatch && !descMatch && !ingMatch && !tagMatch) {
                  return false;
                }
              }

              // Dietary filter check
              if (dietaryFilter === "featured") {
                return !!item.featured || item.tags?.includes("House Favorite") || item.tags?.includes("Best Seller") || item.tags?.includes("Chef Choice");
              }
              if (dietaryFilter === "vegetarian") {
                return (
                  item.tags?.some((t) => t.toLowerCase().includes("vegetarian")) ||
                  item.tags?.some((t) => t.toLowerCase().includes("vegan"))
                );
              }
              if (dietaryFilter === "vegan") {
                return item.tags?.some((t) => t.toLowerCase().includes("vegan"));
              }
              if (dietaryFilter === "gluten-free") {
                return item.tags?.some((t) => t.toLowerCase().includes("gluten-free"));
              }

              return true;
            });

            return {
              ...grp,
              items: filteredItems,
            };
          })
          .filter((grp) => grp.items.length > 0);

        return {
          ...sec,
          groups: filteredGroups,
        };
      })
      .filter((sec) => sec.groups.length > 0);
  }, [activeCategory, dietaryFilter, searchQuery]);

  // Total matching count
  const totalMatchingItems = useMemo(() => {
    return filteredSections.reduce(
      (acc, sec) => acc + sec.groups.reduce((gAcc, grp) => gAcc + grp.items.length, 0),
      0
    );
  }, [filteredSections]);

  const openItemInModal = (item: MenuItem, categoryName: string) => {
    setSelectedDish({
      name: item.name,
      subtitle: item.subtitle || "Handcrafted fresh daily in Beachwood Canyon",
      image: item.image || "/images/hero.jpg",
      category: categoryName,
      price: item.price,
      description: item.description || "Prepared with fresh organic California ingredients.",
      ingredients: item.ingredients || ["Organic Produce", "Chef's Seasonings", "Olive Oil"],
      tags: item.tags || ["Fresh Daily"],
    });
  };

  const getTagClass = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower.includes("vegetarian")) return "menu-tag-vegetarian";
    if (lower.includes("vegan")) return "menu-tag-vegan";
    if (lower.includes("gluten-free")) return "menu-tag-gluten-free";
    if (
      lower.includes("favorite") ||
      lower.includes("choice") ||
      lower.includes("best") ||
      lower.includes("signature")
    )
      return "menu-tag-favorite";
    return "menu-tag-default";
  };

  return (
    <div className="bg-[#ede4d5] text-[#191918] min-h-screen">


      {/* ========================================================================= */}
      {/* 3. STICKY CATEGORY NAV & REAL-TIME FILTERS */}
      {/* ========================================================================= */}
      <nav className="menu-nav-sticky py-3" aria-label="Menu categories">
        <div className="site-container flex flex-col gap-3">
          {/* Top row: Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveCategory("all")}
              className={`menu-tab-btn shrink-0 ${activeCategory === "all" ? "is-active" : ""}`}
            >
              <Sparkles className="size-3.5" />
              <span>All Menu</span>
            </button>
            {menuSections.map((sec) => {
              const count = sec.groups.reduce((acc, g) => acc + g.items.length, 0);
              const icon =
                sec.id === "breakfast" ? (
                  <Utensils className="size-3.5" />
                ) : sec.id === "lunch" ? (
                  <Leaf className="size-3.5" />
                ) : sec.id === "dinner" ? (
                  <Wine className="size-3.5" />
                ) : sec.id === "coffee" ? (
                  <Coffee className="size-3.5" />
                ) : (
                  <Wine className="size-3.5" />
                );

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveCategory(sec.id)}
                  className={`menu-tab-btn shrink-0 ${activeCategory === sec.id ? "is-active" : ""}`}
                >
                  {icon}
                  <span>{sec.title}</span>
                  <span className="menu-tab-badge">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom row: Search & Dietary Chips */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-[#1a3b6b]/10">
            {/* Dietary filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#595347] mr-1 hidden md:inline shrink-0">
                Filter:
              </span>
              <button
                onClick={() => setDietaryFilter("all")}
                className={`menu-filter-chip shrink-0 ${dietaryFilter === "all" ? "is-active" : ""}`}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter("featured")}
                className={`menu-filter-chip shrink-0 ${dietaryFilter === "featured" ? "is-active" : ""}`}
              >
                <Sparkles className="size-3 text-[#1a3b6b]" />
                Signatures
              </button>
              <button
                onClick={() => setDietaryFilter("vegetarian")}
                className={`menu-filter-chip shrink-0 ${dietaryFilter === "vegetarian" ? "is-active" : ""}`}
              >
                🌱 Vegetarian
              </button>
              <button
                onClick={() => setDietaryFilter("vegan")}
                className={`menu-filter-chip shrink-0 ${dietaryFilter === "vegan" ? "is-active" : ""}`}
              >
                🌿 Vegan
              </button>
              <button
                onClick={() => setDietaryFilter("gluten-free")}
                className={`menu-filter-chip shrink-0 ${dietaryFilter === "gluten-free" ? "is-active" : ""}`}
              >
                🌾 Gluten-Free
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#767064]" />
              <input
                type="text"
                placeholder="Search dish, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/80 border border-[#1a3b6b]/20 rounded-full focus:outline-none focus:border-[#1a3b6b] focus:ring-1 focus:ring-[#1a3b6b] text-[#191918] placeholder-[#767064]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#767064] hover:text-[#191918]"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 4. MAIN MENU ITEMS LISTING (2-COLUMN CARDS WITH PRICES) */}
      {/* ========================================================================= */}
      <main className="site-container py-12 lg:py-16">
        {/* Search / Filter Result Indicator */}
        {(searchQuery || dietaryFilter !== "all" || activeCategory !== "all") && (
          <div className="mb-8 flex items-center justify-between p-3.5 rounded-lg bg-white/70 border border-[#1a3b6b]/15">
            <p className="text-xs sm:text-sm text-[#433e36]">
              Showing <strong className="text-[#1a3b6b]">{totalMatchingItems}</strong> items
              {activeCategory !== "all" && (
                <> in <span className="font-semibold capitalize text-[#1a3b6b]">{activeCategory}</span></>
              )}
              {dietaryFilter !== "all" && (
                <> filtered by <span className="font-semibold text-[#d99214] capitalize">{dietaryFilter}</span></>
              )}
              {searchQuery && (
                <> matching &ldquo;{searchQuery}&rdquo;</>
              )}
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setDietaryFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-[#1a3b6b] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {filteredSections.length === 0 ? (
          <div className="py-20 text-center bg-white/50 rounded-xl border border-dashed border-[#c9bba6] p-8">
            <Utensils className="size-10 mx-auto text-[#d99214] mb-3" />
            <h3 className="font-display text-xl font-bold text-[#1a3b6b]">No menu items found</h3>
            <p className="text-sm text-[#5c574c] mt-1 max-w-md mx-auto">
              We couldn&apos;t find any items matching your current filters. Try changing your search
              term or resetting the dietary filters.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setDietaryFilter("all");
                setSearchQuery("");
              }}
              className="btn-olive mt-5 px-6 py-2.5 text-xs font-bold"
            >
              View Full Menu
            </button>
          </div>
        ) : (
          <div className="space-y-16 lg:space-y-24">
            {filteredSections.map((section, index) => (
              <section key={section.id} id={section.id} className="menu-section">
                {/* Section Header */}
                <div className="menu-section-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="eyebrow font-extrabold text-[#d99214] text-xs">
                        SECTION {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[#c9bba6]">•</span>
                      <span className="text-xs font-semibold text-[#1a3b6b] uppercase tracking-wider">
                        {section.service}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a3b6b] mt-1">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Sub-groups */}
                <div className="space-y-12">
                  {section.groups.map((group) => (
                    <div key={group.title}>
                      {/* Group Title Bar */}
                      <div className="flex items-center justify-between border-b border-[#1a3b6b]/20 pb-2.5 mb-6">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#1a3b6b] tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#d99214]" />
                          {group.title}
                        </h3>
                        {group.note && (
                          <span className="text-xs font-semibold text-[#b87508] bg-[#fef7e6] px-2.5 py-0.5 rounded-full border border-[#f5deaa]">
                            {group.note}
                          </span>
                        )}
                      </div>

                      {/* Item Cards Grid (2 Columns on large screens) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                        {group.items.map((item) => {
                          const currentQty = getItemQuantity(item.name);

                          return (
                            <article
                              key={item.name}
                              onClick={() => openItemInModal(item, section.title)}
                              className="menu-card cursor-pointer group flex flex-col justify-between"
                            >
                              <div className="flex gap-3 sm:gap-4 items-start">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-[#1a3b6b]/15 shadow-2xs group-hover:scale-105 transition-transform"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  {/* Header row: Dish Title & Prominent Price Badge */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-display text-lg sm:text-xl font-bold text-[#191918] group-hover:text-[#1a3b6b] transition-colors leading-snug">
                                          {item.name}
                                        </h4>
                                        {item.featured && (
                                          <span className="inline-flex items-center gap-1 text-[0.6rem] font-extrabold uppercase tracking-wider bg-[#d99214] text-[#191918] px-1.5 py-0.5 rounded">
                                            <Sparkles className="size-2.5" /> Signature
                                          </span>
                                        )}
                                      </div>
                                      {item.subtitle && (
                                        <p className="text-xs text-[#767064] italic mt-0.5">
                                          {item.subtitle}
                                        </p>
                                      )}
                                    </div>

                                    {/* Prominent Price Badge */}
                                    <div className="menu-price-badge shrink-0">
                                      {item.price}
                                    </div>
                                  </div>

                                  {/* Rich Description */}
                                  {item.description && (
                                    <p className="text-xs sm:text-sm text-[#4d483e] leading-relaxed mt-2 line-clamp-3">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Tags & Add to Cart Action Footer */}
                              <div className="mt-4 pt-3 border-t border-[#1a3b6b]/10 flex items-center justify-between gap-2.5 flex-wrap">
                                <div className="flex flex-wrap gap-1.5">
                                  {item.tags &&
                                    item.tags.map((tag) => (
                                      <span key={tag} className={`menu-tag-badge ${getTagClass(tag)}`}>
                                        {tag}
                                      </span>
                                    ))}
                                </div>

                                {/* Add to Cart or Quantity Stepper */}
                                <div className="flex items-center gap-2">
                                  {currentQty === 0 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item);
                                      }}
                                      className="btn-olive py-1.5 px-3 text-xs font-bold rounded-md flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                      aria-label={`Add ${item.name} to cart`}
                                    >
                                      <Plus className="size-3.5" />
                                      <span>Add to Cart</span>
                                    </button>
                                  ) : (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center rounded-md border border-[#1a3b6b]/30 bg-[#1a3b6b] text-white shadow-xs overflow-hidden"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(item.name, currentQty - 1)}
                                        className="p-1 px-2 hover:bg-white/20 transition-colors cursor-pointer text-white"
                                        aria-label={`Decrease ${item.name} quantity`}
                                      >
                                        <Minus className="size-3" />
                                      </button>
                                      <span className="px-2 text-xs font-extrabold text-[#ede4d5] min-w-[1.25rem] text-center">
                                        {currentQty}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(item.name, currentQty + 1)}
                                        className="p-1 px-2 hover:bg-white/20 transition-colors cursor-pointer text-white"
                                        aria-label={`Increase ${item.name} quantity`}
                                      >
                                        <Plus className="size-3" />
                                      </button>
                                    </div>
                                  )}

                                  <span className="text-[0.68rem] font-semibold text-[#767064] group-hover:text-[#1a3b6b] transition-colors hidden sm:inline">
                                    Details &rarr;
                                  </span>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. CALL TO ACTION & ALLERGY / POLICY NOTICE */}
        {/* ========================================================================= */}
        <div className="mt-20 p-6 sm:p-10 rounded-xl bg-[#f7f2e8] border border-[#1a3b6b]/15 shadow-sm text-center">
          <div className="max-w-3xl mx-auto">
            <span className="eyebrow font-extrabold text-[#d99214] text-xs inline-block">
              DIETARY & SOURCING PHILOSOPHY
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1a3b6b] mt-1.5">
              Fresh California Produce, Prepared with Care
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-[#5c574c] leading-relaxed max-w-2xl mx-auto">
              Please notify our staff of any allergies or dietary restrictions before ordering.
              Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may
              increase your risk of foodborne illness. We take pride in accommodating vegan,
              vegetarian, and gluten-sensitive diners.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Floating Bottom Cart Bar (when dishes are added) */}
      {totalCount > 0 && (
        <aside
          aria-label="Active order cart banner"
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-[92%] max-w-md bg-[#1a3b6b] text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-[#d99214]/60 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-[#d99214] text-[#191918] font-bold text-xs shrink-0 flex items-center justify-center shadow-xs">
              <ShoppingBag className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">
                {totalCount} {totalCount === 1 ? "dish" : "dishes"} in order
              </p>
              <p className="text-xs text-[#d99214] font-display font-bold">
                Subtotal: ${subtotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="btn-olive py-2 px-3.5 text-xs font-extrabold rounded-xl shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>View Cart & Checkout</span>
            <ArrowRight className="size-3.5" />
          </button>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALS FOR SELECTION, ORDERING & RESERVATIONS */}
      {/* ========================================================================= */}
      {selectedDish && (
        <DishModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
      )}
      <OrderModal isOpen={isOrderOpen} onClose={() => setIsOrderOpen(false)} />
    </div>
  );
}
