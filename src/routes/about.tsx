import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Coffee,
  Heart,
  MapPin,
  Sparkles,
  Utensils,
} from "lucide-react";
import { images } from "../lib/site-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Beachwood Cafe | Beachwood Canyon" },
      {
        name: "description",
        content:
          "Meet Beachwood Cafe, a Barbara Bestor-designed neighborhood restaurant serving modern American food since 2012.",
      },
      { property: "og:title", content: "About Beachwood Cafe" },
      {
        property: "og:description",
        content: "Food, design and neighborhood character in Beachwood Canyon since 2012.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-10 sm:space-y-14 pb-20 md:pb-28">
      {/* Hero Header Section */}
      <section className="site-container pt-8 sm:pt-12 md:pt-14 text-center max-w-4xl mx-auto">
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3b6b]/10 border border-[#1a3b6b]/20 text-[#1a3b6b] text-xs font-extrabold uppercase tracking-widest shadow-xs">
          <Sparkles className="size-3.5 text-[#d99214]" />
          <span>Since 2012 · Hollywood Hills</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="editorial-title mt-4 sm:mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191918] leading-[1.12]">
          A neighborhood café with a point of view.
        </h1>

        {/* Lead Paragraph */}
        <p className="mt-4 sm:mt-5 text-lg sm:text-xl lg:text-2xl font-medium text-[#2f2b25] leading-relaxed max-w-3xl mx-auto">
          A bright, welcoming room in Beachwood Canyon, built around thoughtful food, iconic
          architecture, and the timeless pleasure of gathering.
        </p>
      </section>

      {/* The Room Section (Shifted Up): Balanced Side-by-Side with Compact Photo */}
      <section className="site-container -mt-2 sm:-mt-4">
        <div className="bg-[#f7f3eb] rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#ded3c1] shadow-xl shadow-stone-900/5 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Photo: Compact, Smaller, Tastefully Framed */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[#cfc3af] bg-[#e6dcce] group">
              <img
                src={images.interior}
                alt="The colorful Barbara Bestor-designed Beachwood Cafe interior"
                className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-[#191918] text-xs font-bold border border-white/70 w-fit">
                <Sparkles className="size-3.5 text-[#d99214]" />
                <span>Barbara Bestor Design</span>
              </div>
            </div>
          </div>

          {/* Text: Bigger, Bolder, Beautifully Placed */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1a3b6b]">
              <Award className="size-4 text-[#d99214]" />
              <span>The Room</span>
            </div>

            <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191918] leading-[1.15]">
              Unmistakably Beachwood.
            </h2>

            <p className="text-base sm:text-lg lg:text-xl font-medium text-[#2d2924] leading-relaxed">
              Award-winning architect <strong className="font-bold text-[#191918]">Barbara Bestor</strong> transformed
              the historic Village Coffee Shop into a playful, modern space alive with custom graphic tile, warm timber
              beams, natural Southern California light, and the relaxed cadence of the canyon.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#49443b] leading-relaxed">
              Every detail—from the vintage-inspired banquettes to the hand-crafted wood counters—was designed to make
              you feel instantly at home, whether you're grabbing a morning cortado or savoring a slow weekend brunch.
            </p>

            <div className="pt-3 flex flex-wrap gap-2.5 text-xs font-bold text-[#1a3b6b]">
              <span className="px-3 py-1.5 rounded-full bg-white/80 border border-[#dcd1be] shadow-xs">
                Geometric Custom Tile
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/80 border border-[#dcd1be] shadow-xs">
                Natural Sunlit Atrium
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/80 border border-[#dcd1be] shadow-xs">
                Mid-Century Canyon Warmth
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Highlights Strip */}
      <section className="site-container">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#f7f3eb] border border-[#ded3c1] text-center shadow-xs hover:-translate-y-1 transition-all duration-300">
            <span className="text-xl sm:text-2xl font-black text-[#1a3b6b] block">2012</span>
            <span className="text-xs font-bold text-[#443f36] uppercase tracking-wider mt-0.5 block">
              Established
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f7f3eb] border border-[#ded3c1] text-center shadow-xs hover:-translate-y-1 transition-all duration-300">
            <span className="text-xl sm:text-2xl font-black text-[#d99214] block">Bestor</span>
            <span className="text-xs font-bold text-[#443f36] uppercase tracking-wider mt-0.5 block">
              Architecture
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f7f3eb] border border-[#ded3c1] text-center shadow-xs hover:-translate-y-1 transition-all duration-300">
            <span className="text-xl sm:text-2xl font-black text-[#1a3b6b] block">Organic</span>
            <span className="text-xs font-bold text-[#443f36] uppercase tracking-wider mt-0.5 block">
              Local Kitchen
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f7f3eb] border border-[#ded3c1] text-center shadow-xs hover:-translate-y-1 transition-all duration-300">
            <span className="text-xl sm:text-2xl font-black text-[#d99214] block">Canyon</span>
            <span className="text-xs font-bold text-[#443f36] uppercase tracking-wider mt-0.5 block">
              Sanctuary
            </span>
          </div>
        </div>
      </section>

      {/* The Kitchen Section: Culinary Story with Compact Photo */}
      <section className="site-container">
        <div className="bg-[#ede4d5] rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#dcd1be] shadow-xl shadow-stone-900/5 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text: Bigger, Bolder, Highly Legible */}
          <div className="lg:col-span-7 space-y-5 lg:order-1 order-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1a3b6b]">
              <Utensils className="size-4 text-[#d99214]" />
              <span>The Kitchen</span>
            </div>

            <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191918] leading-[1.15]">
              Modern American, broadly inspired.
            </h2>

            <p className="text-base sm:text-lg lg:text-xl font-medium text-[#2d2924] leading-relaxed">
              Our kitchen moves effortlessly between morning breakfast, sunny lunches, and weekend dinners—drawing from
              Asian, Scandinavian, and Mediterranean flavors without ever compromising its California freshness.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#49443b] leading-relaxed">
              Organic ingredients, locally sourced California produce, and house-made components anchor food that is
              colorful, nourishing, and deeply considered.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#191918]">
                <div className="size-2 rounded-full bg-emerald-600" />
                <span>100% Organic Local Produce</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#191918]">
                <div className="size-2 rounded-full bg-emerald-600" />
                <span>Daily House-Baked Pastries</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#191918]">
                <div className="size-2 rounded-full bg-emerald-600" />
                <span>Specialty Craft Coffee & Teas</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#191918]">
                <div className="size-2 rounded-full bg-emerald-600" />
                <span>House-Crafted Dressings & Sauces</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1a3b6b] text-white font-bold text-sm tracking-wide shadow-md hover:bg-[#122b50] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Explore the full menu</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Photo: Compact, Smaller, Tastefully Framed */}
          <div className="lg:col-span-5 flex justify-center lg:order-2 order-1">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[#cfc3af] bg-[#e6dcce] group">
              <img
                src={images.food}
                alt="Artful dishes prepared freshly at Beachwood Cafe"
                className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-[#191918] text-xs font-bold border border-white/70 w-fit">
                <Utensils className="size-3.5 text-[#d99214]" />
                <span>Fresh Farm-to-Table Kitchen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Neighborhood Section: Compact Exterior Card with Community Story */}
      <section className="site-container">
        <div className="bg-[#f7f3eb] rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#ded3c1] shadow-xl shadow-stone-900/5 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Photo: Compact Exterior Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[16/11] rounded-2xl overflow-hidden shadow-xl border border-[#cfc3af] bg-[#e6dcce] group">
              <img
                src={images.exterior}
                alt="Beachwood Cafe exterior on North Beachwood Drive"
                className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-[#191918] text-xs font-bold border border-white/70 w-fit">
                <MapPin className="size-3.5 text-[#d99214]" />
                <span>North Beachwood Drive</span>
              </div>
            </div>
          </div>

          {/* Text: Bigger, Bolder, Perfectly Structured */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1a3b6b]">
              <MapPin className="size-4 text-[#d99214]" />
              <span>The Neighborhood</span>
            </div>

            <h2 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191918] leading-[1.15]">
              At home in the canyon.
            </h2>

            <p className="text-base sm:text-lg lg:text-xl font-medium text-[#2d2924] leading-relaxed">
              Close to the Hollywood Sign, yet grounded in the quiet, historic rhythms of a real hillside community—morning
              coffee conversations, familiar neighborhood faces, and tables worth returning to week after week.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#49443b] leading-relaxed">
              Whether you are a longtime canyon resident or visiting for the first time, Beachwood Cafe remains a sunny
              meeting spot for neighbors, creatives, and wanderers alike.
            </p>

            {/* Quick Visitor Tips Card */}
            <div className="p-4 rounded-2xl bg-white/80 border border-[#ded3c1] grid sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#1a3b6b] block">Walk-Ins</span>
                <span className="text-xs font-bold text-[#191918] mt-0.5 block">Always Welcome</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-[#ded3c1] pt-2 sm:pt-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#1a3b6b] block">Outdoor Seating</span>
                <span className="text-xs font-bold text-[#191918] mt-0.5 block">Dog-Friendly Benches</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-[#ded3c1] pt-2 sm:pt-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#1a3b6b] block">Parking</span>
                <span className="text-xs font-bold text-[#191918] mt-0.5 block">Shared Lot & Street</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Quote Callout */}
      <section className="site-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a3b6b] to-[#122b50] p-8 sm:p-12 lg:p-16 text-white text-center shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-4">
            <Heart className="size-8 text-[#d99214] mx-auto opacity-90 animate-pulse" />
            <blockquote className="editorial-title text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug tracking-tight text-white/95">
              “A sun-drenched canyon living room where thoughtful food, award-winning design, and neighborhood life meet.”
            </blockquote>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#d99214] pt-2">
              Good Food · Good People · Hollywood Hills
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
