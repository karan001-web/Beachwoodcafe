import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { images, site } from "../lib/site-content";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery | Beachwood Cafe Hollywood" },
      {
        name: "description",
        content:
          "Step inside Beachwood Cafe through scenes of its food, coffee, colorful interior and Beachwood Canyon setting.",
      },
      { property: "og:title", content: "Gallery | Beachwood Cafe" },
      { property: "og:description", content: "Food, coffee, color and life in Beachwood Canyon." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

type GalleryItem = {
  id: number;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  category: "all" | "interior" | "food" | "canyon";
  tag: string;
};

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    src: images.hero,
    alt: "The light-filled dining room at Beachwood Cafe",
    title: "The Dining Room",
    subtitle: "Morning light pouring over custom graphic tiles and mid-century timber",
    category: "interior",
    tag: "Interior & Architecture",
  },
  {
    id: 2,
    src: images.brunch,
    alt: "A bright brunch spread served at Beachwood Cafe",
    title: "At the Table",
    subtitle: "A colorful California morning spread of seasonal dishes and house pastries",
    category: "food",
    tag: "Brunch & Kitchen",
  },
  {
    id: 3,
    src: images.coffee,
    alt: "Coffee enjoyed in natural light",
    title: "Coffee, Slowly",
    subtitle: "Artisanal espresso and pour-overs made with care for quiet canyon mornings",
    category: "food",
    tag: "Coffee & Drinks",
  },
  {
    id: 4,
    src: images.interior,
    alt: "Colorful architectural details inside Beachwood Cafe",
    title: "Designed in Color",
    subtitle: "Barbara Bestor's iconic geometric floor and playful modernist palette",
    category: "interior",
    tag: "Design Details",
  },
  {
    id: 5,
    src: images.food,
    alt: "A freshly prepared Beachwood Cafe dish",
    title: "From the Kitchen",
    subtitle: "Scratch-made dishes rooted in organic local produce and vibrant flavors",
    category: "food",
    tag: "Seasonal Food",
  },
  {
    id: 6,
    src: images.lifestyle,
    alt: "A relaxed café moment in Beachwood Canyon",
    title: "Canyon Afternoons",
    subtitle: "Neighbors and creatives sharing tables under the warm Hollywood sun",
    category: "canyon",
    tag: "Canyon Life",
  },
  {
    id: 7,
    src: images.exterior,
    alt: "The exterior of Beachwood Cafe with guests outside",
    title: "2695 N Beachwood",
    subtitle: "Our historic Hollywood Hills storefront welcoming visitors since 2012",
    category: "canyon",
    tag: "Historic Facade",
  },
];

const categories = [
  { id: "all", label: "All Photos" },
  { id: "interior", label: "Interior & Design" },
  { id: "food", label: "Brunch & Kitchen" },
  { id: "canyon", label: "Canyon Life" },
] as const;

function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems =
    activeCategory === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredItems.length]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 md:pb-32">
      {/* Header Section */}
      <section className="site-container pt-8 sm:pt-14 md:pt-18 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3b6b]/10 border border-[#1a3b6b]/20 text-[#1a3b6b] text-xs font-extrabold uppercase tracking-widest shadow-xs">
          <Camera className="size-3.5 text-[#d99214]" />
          <span>Visual Story · Canyon Moments</span>
        </div>

        <h1 className="editorial-title mt-4 sm:mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191918] leading-[1.12]">
          A day at Beachwood.
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl font-medium text-[#2f2b25] leading-relaxed max-w-2xl mx-auto">
          Morning light, full tables, artisanal coffee arriving, and the unmistakable warmth and color
          of this historic corner of Los Angeles.
        </p>

        {/* Category Filter Pills with smooth horizontal swipe */}
        <div className="mt-8 flex items-center sm:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0 w-full max-w-full">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#1a3b6b] text-white shadow-md scale-105"
                    : "bg-[#f7f3eb] text-[#443f36] border border-[#ded3c1] hover:bg-white hover:border-[#1a3b6b]/40 hover:text-[#1a3b6b]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Multi-Column Gallery Grid with Compact Photo Sizes */}
      <section className="site-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(index)}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-[#f7f3eb] border border-[#ded3c1] shadow-lg shadow-stone-900/5 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
            >
              {/* Image Frame: Compact, Uniform, Beautifully Proportioned */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e8decf]">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading={index < 3 ? "eager" : "lazy"}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Subtle Gradient & Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Top Badge: Category Tag */}
                <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-[#1a1918] text-[0.7rem] font-bold border border-white/60">
                  <Sparkles className="size-3 text-[#d99214]" />
                  <span>{item.tag}</span>
                </div>

                {/* Hover Expand Icon */}
                <div className="absolute bottom-3.5 right-3.5 size-9 rounded-full bg-white/95 backdrop-blur-md text-[#1a3b6b] flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300">
                  <Maximize2 className="size-4" />
                </div>
              </div>

              {/* Text Card Body: High Contrast, Bold, Well-Positioned */}
              <div className="p-5 sm:p-6 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#191918] group-hover:text-[#1a3b6b] transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-xs font-black text-[#1a3b6b] px-2 py-0.5 rounded-full bg-[#1a3b6b]/10 shrink-0">
                    {String(item.id).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#49443b] leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Instagram Callout Banner */}
      <section className="site-container">
        <div className="rounded-3xl bg-[#ede4d5] border border-[#ded3c1] p-8 sm:p-12 text-center shadow-lg shadow-stone-900/5 max-w-3xl mx-auto space-y-4">
          <div className="size-12 rounded-full bg-[#1a3b6b] text-white flex items-center justify-center mx-auto shadow-md">
            <Instagram className="size-6" />
          </div>
          <h2 className="editorial-title text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#191918]">
            Capture your canyon story.
          </h2>
          <p className="text-sm sm:text-base font-medium text-[#49443b] max-w-lg mx-auto leading-relaxed">
            Tag <strong className="font-bold text-[#1a3b6b]">@beachwoodcafe</strong> in your photos on Instagram to be
            featured in our community collection.
          </p>
          <div className="pt-2">
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a3b6b] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:bg-[#122b50] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Follow on Instagram</span>
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Lightbox Modal */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 z-60 size-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close image preview"
          >
            <X className="size-6" />
          </button>

          {/* Prev Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1
              );
            }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-60 size-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0
              );
            }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-60 size-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>

          {/* Lightbox Content Card */}
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/20 bg-black max-h-[75vh]">
              <img
                src={filteredItems[lightboxIndex]!.src}
                alt={filteredItems[lightboxIndex]!.alt}
                className="w-auto h-auto max-h-[75vh] max-w-full object-contain mx-auto"
              />
            </div>

            {/* Modal Caption */}
            <div className="mt-4 text-center text-white space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#d99214]">
                  {filteredItems[lightboxIndex]!.tag}
                </span>
                <span className="text-xs text-white/50">·</span>
                <span className="text-xs text-white/70">
                  {lightboxIndex + 1} of {filteredItems.length}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display">
                {filteredItems[lightboxIndex]!.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-medium">
                {filteredItems[lightboxIndex]!.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
