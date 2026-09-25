import { createFileRoute } from "@tanstack/react-router";
import {
  Car,
  Check,
  Clock,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Instagram,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { images, site } from "../lib/site-content";

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.49-.07 1.49-.61 1.7-.85.22-.24.22-.44.15-.57-.06-.12-.22-.19-.47-.32" />
    </svg>
  );
}

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Visit Beachwood Cafe | Hours & Directions" },
      {
        name: "description",
        content:
          "Find Beachwood Cafe at 2695 N Beachwood Dr. Get current hours, parking guidance, directions, and inquiries.",
      },
      { property: "og:title", content: "Visit Beachwood Cafe" },
      {
        property: "og:description",
        content: "Hours, directions and parking for Beachwood Cafe in Beachwood Canyon.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("2695 N Beachwood Dr, Los Angeles, CA 90068");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <>
      {/* Main Title Section */}
      <section className="site-container pt-12 pb-8 md:pt-18 md:pb-12">
        <h1 className="editorial-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#191918]">
          Meet us in the canyon.
        </h1>
      </section>

      {/* Main Visit & Details Grid */}
      <section className="site-container pb-24 lg:pb-32">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Exterior Photo Card with Location Badge */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-2xl border border-[#cfc3af] bg-[#e6dcce] min-h-[260px] sm:min-h-[500px] flex flex-col justify-end group">
            <img
              src={images.exterior}
              alt="Beachwood Cafe exterior on North Beachwood Drive"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />
            
            {/* Floating Location Pill */}
            <div className="relative z-10 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/60 text-[#191918]">
                <MapPin className="size-4 text-[#d99214] shrink-0" />
                <span className="text-xs font-bold tracking-wide">Historic Beachwood Canyon · Los Angeles</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Redesigned Details Card */}
          <div className="lg:col-span-6 bg-[#f7f3eb] rounded-3xl p-7 sm:p-10 lg:p-11 border border-[#dcd1be] shadow-xl shadow-stone-900/5 flex flex-col justify-between">
            {/* Header & Status Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#dfd2be]">
              <div>
                <span className="text-[0.72rem] font-extrabold uppercase tracking-widest text-[#1a3b6b] block">
                  Location & Schedule
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#191918]">
                  Beachwood Canyon Sanctuary
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300/80 text-emerald-900 text-xs font-bold shrink-0 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Open Daily</span>
              </div>
            </div>

            {/* Info Blocks Grid */}
            <div className="grid gap-7 sm:grid-cols-2 py-8">
              {/* Phone & WhatsApp */}
              <div className="space-y-2.5 sm:col-span-2 bg-white/70 p-5 rounded-2xl border border-[#dfd2be]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#1a3b6b]/10 text-[#1a3b6b]">
                    <Phone className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                    Direct Phone & WhatsApp
                  </h2>
                </div>
                <div>
                  <a
                    href={site.phoneHref}
                    className="text-lg sm:text-xl font-extrabold text-[#191918] hover:text-[#1a3b6b] transition-colors block"
                  >
                    {site.phone}
                  </a>
                  <span className="text-xs font-semibold text-[#5a5449] mt-0.5 block">
                    Direct telephone line & instant WhatsApp assistance
                  </span>
                </div>
                {/* 2 Buttons: Direct Call & WhatsApp with pre-typed message "Hello Cafe" */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href={site.phoneHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a3b6b] hover:bg-[#122b50] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Phone className="size-3.5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={site.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <WhatsAppIcon className="size-4" />
                    <span>Chat on WhatsApp</span>
                    <span className="text-[0.68rem] bg-black/15 px-2 py-0.5 rounded-full font-medium">
                      "Hello Cafe"
                    </span>
                  </a>
                </div>
              </div>

              {/* Email Us */}
              <div className="space-y-2.5 sm:col-span-2 bg-white/70 p-5 rounded-2xl border border-[#dfd2be]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#d99214]/15 text-[#b87508]">
                    <Mail className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                    Email Inquiries
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <a
                      href={site.gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-bold text-[#191918] hover:text-[#1a3b6b] transition-colors underline-offset-4 hover:underline block break-all"
                    >
                      {site.email}
                    </a>
                    <span className="text-xs font-semibold text-[#5a5449] mt-0.5 block">
                      Click to compose in Gmail or your device's default mail app
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={site.gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1a3b6b] hover:bg-[#122b50] text-white font-bold text-xs uppercase tracking-wider shadow-sm shrink-0 transition-all hover:scale-105 active:scale-95"
                    >
                      <Mail className="size-3.5" />
                      <span>Open in Gmail</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                    <a
                      href={site.emailHref}
                      onClick={() => {
                        window.location.href = site.emailHref;
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-[#191918] font-bold text-xs uppercase tracking-wider border border-[#dfd2be] shadow-sm shrink-0 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Mail App</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#1a3b6b]/10 text-[#1a3b6b]">
                    <MapPin className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                    Address
                  </h2>
                </div>
                <address className="not-italic text-[0.95rem] font-bold text-[#191918] leading-snug">
                  2695 N Beachwood Dr
                  <br />
                  <span className="text-[#3b362f] font-semibold">Los Angeles, CA 90068</span>
                </address>
              </div>

              {/* Hours */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#1a3b6b]/10 text-[#1a3b6b]">
                    <Clock className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                    Hours
                  </h2>
                </div>
                <div className="space-y-1 text-sm font-semibold text-[#2d2924]">
                  <p>
                    <span className="font-bold text-[#191918]">Monday — Thursday:</span>{" "}
                    <span className="font-extrabold text-[#191918]">8am — 4pm</span>
                  </p>
                  <p>
                    <span className="font-bold text-[#191918]">Friday — Sunday:</span>{" "}
                    <span className="font-extrabold text-[#191918]">8am — 9pm</span>
                  </p>
                </div>
              </div>

              {/* Parking */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#1a3b6b]/10 text-[#1a3b6b]">
                    <Car className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                    Parking Guidance
                  </h2>
                </div>
                <div className="text-xs font-semibold text-[#3b362f] leading-relaxed space-y-1.5">
                  <p>
                    <strong className="font-bold text-[#191918]">Shared Lot:</strong> Behind café on Belden Dr (with Beachwood Market).
                  </p>
                  <p>
                    <strong className="font-bold text-[#191918]">Street:</strong> Free on weekdays without restrictions; weekends south on Beachwood Dr.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar: "Get directions", "Copy address" and Social Media */}
            <div className="pt-6 border-t border-[#dfd2be] flex flex-wrap items-center justify-between gap-3.5">
              <div className="flex flex-wrap items-center gap-3.5">
                <a
                  href={site.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1a3b6b] text-white font-bold text-sm tracking-wide shadow-md hover:bg-[#122b50] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Navigation className="size-4" />
                  <span>Get directions</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border-2 border-[#1a3b6b]/25 bg-white/90 hover:bg-white text-[#1a3b6b] font-bold text-sm tracking-wide hover:border-[#1a3b6b] hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-emerald-600" />
                      <span className="text-emerald-700">Address copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy address</span>
                    </>
                  )}
                </button>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1a3b6b] uppercase tracking-wider mr-1">Social:</span>
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center size-10 rounded-full border border-[#1a3b6b]/20 bg-white hover:bg-[#1a3b6b] text-[#1a3b6b] hover:text-white shadow-xs transition-all duration-200"
                >
                  <Instagram className="size-4" />
                </a>
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center justify-center size-10 rounded-full border border-[#1a3b6b]/20 bg-white hover:bg-[#1a3b6b] text-[#1a3b6b] hover:text-white font-bold text-sm leading-none shadow-xs transition-all duration-200"
                >
                  f
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
