import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Menu,
  ShoppingBag,
  X,
  Clock,
  Phone,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { ReservationModal } from "./reservation-modal";
import { OrderModal } from "./order-modal";
import { OrderTrackModal } from "./order-track-modal";
import { PolicyModal, type PolicyType } from "./policy-modal";
import { useCart } from "../lib/cart-context";
import { site } from "../lib/site-content";

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.49-.07 1.49-.61 1.7-.85.22-.24.22-.44.15-.57-.06-.12-.22-.19-.47-.32" />
    </svg>
  );
}

const nav = [
  ["Home", "/"],
  ["Menu", "/menu"],
  ["About", "/about"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const { totalCount, setIsCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Hysteresis buffer to eliminate stutter/flicker near threshold:
          // Shrink when scrollY > 45px; expand only when returning near top (scrollY < 15px)
          if (!isScrolledRef.current && scrollY > 45) {
            isScrolledRef.current = true;
            setIsScrolled(true);
          } else if (isScrolledRef.current && scrollY < 15) {
            isScrolledRef.current = false;
            setIsScrolled(false);
          }

          // Direct GPU transform update for progress bar (zero React re-renders during scroll)
          if (progressRef.current) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
            progressRef.current.style.transform = `scaleX(${progress})`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const handleOpenTrack = () => setTrackOpen(true);
    window.addEventListener("bwc_open_track_modal", handleOpenTrack);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("bwc_open_track_modal", handleOpenTrack);
    };
  }, []);

  return (
    <>
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <div
          className={`site-container flex items-center justify-between gap-2 sm:gap-6 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled ? "py-2.5 lg:py-3 min-h-[58px]" : "py-4 lg:py-5 min-h-[82px]"
          }`}
        >
          {/* Brand Logo with Hardware-Accelerated Smooth Scaling */}
          <Link
            to="/"
            className="brand-mark group"
            aria-label="Beachwood Cafe home"
          >
            <span>
              BEACHWOOD CAFE
            </span>
            <small>
              HOLLYWOOD
            </small>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {nav.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="nav-link font-bold"
                activeProps={{ className: "nav-link nav-link-active font-extrabold text-[#1a3b6b]" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop Action Buttons & Cart */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {/* Header Track Order Button */}
            <button
              onClick={() => setTrackOpen(true)}
              className={`relative inline-flex items-center gap-1.5 rounded-full border border-[#1a3b6b]/20 bg-white/90 hover:bg-[#ede4d5] text-[#1a3b6b] font-bold transition-all shadow-xs group cursor-pointer ${
                isScrolled ? "py-1.5 px-3 text-xs" : "py-2 px-3.5 text-xs"
              }`}
              aria-label="Track & Cancel Order"
              title="Track Order & 1-Min Cancellation"
            >
              <Clock className="size-3.5 text-[#d99214] group-hover:scale-110 transition-transform" />
              <span>Track Order</span>
            </button>

            {/* Header Cart Button with live count badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative inline-flex items-center gap-2 rounded-full border border-[#1a3b6b]/20 bg-[#ede4d5]/90 hover:bg-[#1a3b6b] hover:text-white hover:border-[#1a3b6b] text-[#1a3b6b] font-bold transition-all shadow-xs group cursor-pointer ${
                isScrolled ? "py-1.5 px-3.5 text-xs" : "py-2 px-4 text-xs"
              }`}
              aria-label={`Shopping cart with ${totalCount} items`}
            >
              <ShoppingBag className="size-4 text-[#d99214] group-hover:text-white transition-colors" />
              <span>Cart</span>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[0.7rem] font-extrabold rounded-full bg-[#d99214] text-[#191918] shadow-xs">
                  {totalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setReserveOpen(true)}
              className={`btn-olive font-extrabold transition-all duration-300 ${
                isScrolled ? "py-2 px-4 text-xs" : "py-2.5 px-5 text-xs"
              }`}
            >
              Reserve a Table
            </button>
          </div>

          {/* Mobile Action Buttons with Cart & Track */}
          <div className="flex items-center gap-1 sm:gap-2 lg:hidden shrink-0">
            {/* Mobile Track Order Icon - on screens >= 360px */}
            <button
              onClick={() => setTrackOpen(true)}
              className="hidden min-[360px]:flex size-8 sm:size-9 rounded-full border border-[#1a3b6b]/20 bg-white/90 text-[#1a3b6b] hover:bg-[#1a3b6b] hover:text-white items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Track Your Order"
              title="Track Order"
            >
              <Clock className="size-3.5 sm:size-4 text-[#d99214]" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative size-8 sm:size-9 rounded-full border border-[#1a3b6b]/20 bg-[#ede4d5] text-[#1a3b6b] hover:bg-[#1a3b6b] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label={`Shopping cart with ${totalCount} items`}
            >
              <ShoppingBag className="size-3.5 sm:size-4 text-[#1a3b6b]" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[0.62rem] font-extrabold rounded-full bg-[#d99214] text-[#191918] shadow-sm">
                  {totalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setOrderOpen(true)}
              className="btn-olive py-1.5 px-2.5 sm:px-3 text-xs font-extrabold shrink-0"
            >
              Order
            </button>
            <button
              className="size-8 sm:size-9 flex items-center justify-center rounded border border-[#1a3b6b]/20 bg-white/70 text-[#191918] shrink-0 cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Scroll Progress Bar (100% GPU Accelerated) */}
        <div
          ref={progressRef}
          className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#1a3b6b] via-[#d99214] to-[#1a3b6b] origin-left pointer-events-none transition-opacity duration-300 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: "scaleX(0)" }}
          aria-hidden="true"
        />

        {/* Mobile Dropdown Menu with Boutique Hospitality Actions */}
        {open && (
          <div className="mobile-menu lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="site-container flex flex-col py-5" aria-label="Mobile navigation">
              {nav.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="mobile-nav-link font-bold text-[#1a1c18]"
                >
                  <span>{label}</span>
                  <ArrowRight className="size-4 text-[#767064]" />
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-[#1a3b6b]/15 space-y-2.5">
                <button
                  onClick={() => {
                    setOpen(false);
                    setReserveOpen(true);
                  }}
                  className="btn-olive font-extrabold w-full text-center py-3 text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Reserve a Table
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setTrackOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white border border-[#1a3b6b]/20 text-[#1a3b6b] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#1a3b6b] hover:text-white transition-colors"
                  >
                    <Clock className="size-3.5 text-[#d99214]" />
                    <span>Track Order</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white border border-[#1a3b6b]/20 text-[#1a3b6b] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#1a3b6b] hover:text-white transition-colors"
                  >
                    <ShoppingBag className="size-3.5 text-[#1a3b6b]" />
                    <span>Cart ({totalCount})</span>
                  </button>
                </div>

                {/* Direct Calling & WhatsApp for mobile diners */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={site.phoneHref}
                    className="py-2.5 px-3 rounded-xl bg-white/90 border border-[#1a3b6b]/20 text-[#1a3b6b] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Phone className="size-3.5 text-[#d99214]" />
                    <span>Call Cafe</span>
                  </a>
                  <a
                    href={site.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <WhatsAppIcon className="size-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center text-[0.7rem] text-[#767064] flex items-center justify-center gap-1.5">
                  <MapPin className="size-3 text-[#d99214]" />
                  <span>2695 N Beachwood Dr · Open Daily 8am</span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Modals */}
      <ReservationModal isOpen={reserveOpen} onClose={() => setReserveOpen(false)} />
      <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} />
      <OrderTrackModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
    </>
  );
}

export function MobileActions() {
  return null;
}

export function SiteFooter() {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyType>("privacy");

  const openPolicy = (tab: PolicyType) => {
    setPolicyTab(tab);
    setPolicyOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="w-full bg-[#191918] text-[#ede4d5] border-t border-[#312e29] py-8 sm:py-10 overflow-hidden">
        <div className="site-container">
          {/* Bottom Bar: Copyright, Policy Shortcuts & Back to Top */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#ede4d5]/60">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
              <Link
                to="/"
                className="font-display font-bold text-sm tracking-wider text-[#ede4d5] hover:text-[#d99214] transition-colors"
              >
                BEACHWOOD CAFE
              </Link>
              <span className="hidden sm:inline">·</span>
              <p>© 2026 Beachwood Cafe. All rights reserved.</p>
              <span className="hidden sm:inline">·</span>
              <a
                href="/#faq"
                className="hover:text-[#d99214] text-[#ede4d5] font-semibold transition-colors cursor-pointer"
              >
                FAQ
              </a>
              <span className="hidden sm:inline">·</span>
              <button
                type="button"
                onClick={() => openPolicy("privacy")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => openPolicy("terms")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => openPolicy("accessibility")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Accessibility
              </button>
              <button
                type="button"
                onClick={() => openPolicy("cookies")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Cookies
              </button>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#d99214] hover:text-[#191918] text-[#ede4d5] text-xs font-bold transition-all duration-200 cursor-pointer shrink-0"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Policy Modal with Full Valid Text & Tabs */}
      <PolicyModal
        isOpen={policyOpen}
        initialPolicy={policyTab}
        onClose={() => setPolicyOpen(false)}
      />
    </>
  );
}

export function ActionLink({
  href,
  children,
  tone = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "outline" | "text";
  className?: string;
}) {
  const classes =
    tone === "primary"
      ? "btn-olive"
      : tone === "outline"
        ? "btn-outline-dark"
        : "border-b border-current pb-0.5 text-xs font-semibold uppercase tracking-wider";
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`${classes} ${className}`}
    >
      {children}
      {external && <ExternalLink aria-hidden="true" className="size-3.5 inline ml-1" />}
    </a>
  );
}

export function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <section className="site-container pb-14 pt-16 md:pb-20 md:pt-20">
      <p className="eyebrow-label">{eyebrow}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
        <h1 className="editorial-title text-4xl sm:text-5xl lg:text-6xl text-[#1a1c18]">{title}</h1>
        <p className="max-w-md text-sm leading-relaxed text-[#6b665c] lg:justify-self-end">
          {text}
        </p>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return null;
}
