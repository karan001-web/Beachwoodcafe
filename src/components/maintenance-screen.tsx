import { Lock, Phone, MessageCircle, MapPin, Clock, AlertTriangle, UtensilsCrossed, Sparkles } from "lucide-react";
import { site } from "../lib/site-content";
import type { MaintenanceConfig } from "../lib/admin-store";

export function MaintenanceScreen({ config }: { config: MaintenanceConfig }) {
  return (
    <div className="min-h-screen bg-[#ede4d5] text-[#191918] flex flex-col justify-between selection:bg-[#d99214] selection:text-[#191918] relative overflow-hidden">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a3b6b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Top Simple Header */}
      <header className="py-6 px-4 border-b border-[#1a3b6b]/15 bg-white/40 backdrop-blur-xs relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1a3b6b] text-[#d99214] flex items-center justify-center font-bold shadow-xs">
              <UtensilsCrossed className="size-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-base uppercase tracking-wider text-[#1a3b6b] block leading-tight">
                Beachwood Cafe
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#d99214] block">
                Hollywood Hills, Los Angeles
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d99214]/20 border border-[#d99214]/40 text-[#b87508] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#d99214] animate-ping" />
            <span>Temporarily Paused</span>
          </div>
        </div>
      </header>

      {/* Main Notice Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 my-8">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-[#1a3b6b]/15 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Animated emblem */}
          <div className="w-20 h-20 rounded-full bg-[#ede4d5] border-2 border-[#d99214] text-[#1a3b6b] flex items-center justify-center mx-auto shadow-md relative">
            <UtensilsCrossed className="size-9 text-[#1a3b6b]" />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#d99214] text-[#191918] shadow-xs">
              <Sparkles className="size-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d99214]">
              KITCHEN & WEBSITE UPDATE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1a3b6b] leading-tight">
              We'll Be Right Back!
            </h1>
            <p className="text-xs sm:text-sm text-[#595347] max-w-md mx-auto leading-relaxed pt-1">
              {config.message ||
                "Beachwood Cafe online ordering and website are temporarily paused for maintenance. We will be back online shortly!"}
            </p>
          </div>

          {/* Contact & Urgent Assistance Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#ede4d5]/50 border border-[#c9bba6] text-xs space-y-3">
            <p className="font-bold text-[#191918]">
              Need immediate assistance, takeaway, or have an urgent question?
            </p>
            <p className="text-[#595347]">
              Our telephone line and WhatsApp are always reachable directly by our staff:
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5 justify-center">
              <a
                href={site.phoneHref}
                className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#1a3b6b] hover:bg-[#132c52] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="size-4 text-[#d99214]" />
                <span>Call Us: {site.phone}</span>
              </a>

              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#16a34a] hover:bg-[#15803d] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="size-4" />
                <span>WhatsApp Message</span>
              </a>
            </div>
          </div>

          {/* Location & Regular Hours */}
          <div className="pt-2 text-xs text-[#767064] space-y-1">
            <p className="flex items-center justify-center gap-1.5 font-medium text-[#191918]">
              <MapPin className="size-3.5 text-[#d99214]" />
              <span>{site.address}</span>
            </p>
            <p className="text-[0.7rem] text-[#767064]">
              Serving modern American food & coffee in Hollywood Hills
            </p>
          </div>
        </div>
      </main>

      {/* Footer with Staff Login Link */}
      <footer className="py-4 px-4 text-center border-t border-[#1a3b6b]/10 bg-white/30 text-xs text-[#767064] relative z-10 flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto w-full gap-2">
        <span>© {new Date().getFullYear()} Beachwood Cafe. All rights reserved.</span>

        <a
          href="/admin"
          className="inline-flex items-center gap-1 font-semibold text-[#1a3b6b] hover:text-[#d99214] transition-colors"
          title="Staff and management login"
        >
          <Lock className="size-3 text-[#d99214]" />
          <span>Staff / Admin Login (Turn Site Back Online)</span>
        </a>
      </footer>
    </div>
  );
}
