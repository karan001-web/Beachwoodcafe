import { Check, Cookie, Eye, FileText, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "../lib/site-content";

export type PolicyType = "privacy" | "terms" | "accessibility" | "cookies";

interface PolicyModalProps {
  isOpen: boolean;
  initialPolicy?: PolicyType;
  onClose: () => void;
}

export function PolicyModal({ isOpen, initialPolicy = "privacy", onClose }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialPolicy);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialPolicy);
    }
  }, [isOpen, initialPolicy]);

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
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-[#f8f5ee] text-[#191918] shadow-2xl border border-[#ded3c1] max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#dfd2be] bg-[#f2ecdf]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-[#1a3b6b] text-white flex items-center justify-center shadow-xs">
              <Shield className="size-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#191918]">
                Beachwood Cafe Policies & Legal
              </h2>
              <p className="text-xs font-semibold text-[#767064]">
                2695 N Beachwood Dr, Los Angeles, CA 90068
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-white/70 hover:bg-white text-[#191918] flex items-center justify-center border border-[#d6c7b0] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#dfd2be] bg-[#ebe3d3] overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "privacy"
                ? "border-[#1a3b6b] text-[#1a3b6b] bg-[#f8f5ee]"
                : "border-transparent text-[#5c5446] hover:text-[#191918] hover:bg-white/40"
            }`}
          >
            <Shield className="size-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "terms"
                ? "border-[#1a3b6b] text-[#1a3b6b] bg-[#f8f5ee]"
                : "border-transparent text-[#5c5446] hover:text-[#191918] hover:bg-white/40"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("accessibility")}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "accessibility"
                ? "border-[#1a3b6b] text-[#1a3b6b] bg-[#f8f5ee]"
                : "border-transparent text-[#5c5446] hover:text-[#191918] hover:bg-white/40"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Accessibility (ADA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cookies")}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "cookies"
                ? "border-[#1a3b6b] text-[#1a3b6b] bg-[#f8f5ee]"
                : "border-transparent text-[#5c5446] hover:text-[#191918] hover:bg-white/40"
            }`}
          >
            <Cookie className="size-3.5" />
            <span>Cookie Policy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed text-[#2f2b25]">
          {activeTab === "privacy" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#d99214] block">
                  Last Updated: 2026
                </span>
                <h3 className="text-xl font-bold font-display text-[#191918] mt-1">
                  California Consumer Privacy Policy
                </h3>
              </div>

              <p>
                At <strong>Beachwood Cafe</strong> (“we,” “us,” or “our”), located at 2695 N Beachwood Dr,
                Los Angeles, CA 90068, we respect your privacy and are committed to protecting personal information
                collected through our website and in-restaurant operations.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">1. Information We Collect</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li><strong>Contact details:</strong> Name, email address, and phone number when placing pickup orders or table reservations.</li>
                <li><strong>Order & Transaction data:</strong> Items ordered, pickup times, and payment transaction references processed securely via PCI-compliant payment gateways.</li>
                <li><strong>Device & Browsing data:</strong> IP address, browser type, and interaction metrics to optimize site performance and accessibility.</li>
              </ul>

              <h4 className="text-base font-bold text-[#191918] pt-2">2. How We Use Your Information</h4>
              <p>
                We use collected information solely to prepare your food orders, honor your dining reservations,
                provide customer support, and communicate updates about cafe operating hours or seasonal menus.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">3. California Privacy Rights (CCPA/CPRA)</h4>
              <p>
                Under the California Consumer Privacy Act, California residents have the right to request access to their
                personal information, request deletion of collected data, and opt out of the sale or sharing of personal data.
                <strong> Beachwood Cafe does not sell or share personal information with third-party advertisers.</strong>
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">4. Contact Our Team</h4>
              <p>
                If you have questions regarding this Privacy Policy or wish to exercise your privacy rights, please call us directly
                at <a href={site.phoneHref} className="font-bold text-[#1a3b6b] underline">{site.phone}</a> or email us at{" "}
                <a href={site.emailHref} className="font-bold text-[#1a3b6b] underline">{site.email}</a>, or visit us at
                2695 N Beachwood Dr, Los Angeles, CA 90068.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#d99214] block">
                  Last Updated: 2026
                </span>
                <h3 className="text-xl font-bold font-display text-[#191918] mt-1">
                  Terms of Service & Dining Policies
                </h3>
              </div>

              <p>
                By using this website, ordering takeout, or dining at <strong>Beachwood Cafe</strong>, you agree to comply with
                and be bound by the following terms and operating policies.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">1. Reservations & Table Holding</h4>
              <p>
                Table reservations are managed via OpenTable. Reserved tables are held for up to 15 minutes past the scheduled
                reservation time. Walk-in guests are welcomed on a first-come, first-served basis.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">2. Online Ordering & Pickup</h4>
              <p>
                Orders placed online are freshly prepared for in-person pickup at our counter at 2695 N Beachwood Dr. Please ensure
                you arrive promptly during your designated pickup window for maximum freshness.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">3. Food Allergens & Dietary Requests</h4>
              <p>
                While we take utmost care to accommodate dietary needs and allergies, our kitchen handles nuts, dairy, gluten,
                eggs, and seafood. Please notify our staff of severe allergies prior to ordering.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">4. Governing Law</h4>
              <p>
                These terms are governed by and construed in accordance with the laws of the State of California and the County of
                Los Angeles.
              </p>
            </div>
          )}

          {activeTab === "accessibility" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#d99214] block">
                  Commitment to ADA Standards
                </span>
                <h3 className="text-xl font-bold font-display text-[#191918] mt-1">
                  Digital & Physical Accessibility Statement
                </h3>
              </div>

              <p>
                <strong>Beachwood Cafe</strong> is dedicated to ensuring that our website and physical dining spaces are accessible
                to all individuals, including people with disabilities, in accordance with the Americans with Disabilities Act
                (ADA Title III) and WCAG 2.1 Level AA guidelines.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">1. Digital Accessibility Efforts</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li>Clear semantic HTML hierarchy and high-contrast color pairings for maximum readability.</li>
                <li>Keyboard navigation compatibility across all interactive links, modals, and menus.</li>
                <li>Descriptive alternative text for photos of our dishes, interior, and canyon setting.</li>
                <li>A visible skip-to-content mechanism for screen reader users.</li>
              </ul>

              <h4 className="text-base font-bold text-[#191918] pt-2">2. In-Person Accessibility</h4>
              <p>
                Our café entrance and outdoor patio seating at 2695 N Beachwood Dr provide wheelchair accessibility. Service animals
                are welcomed on our premises.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">3. Need Accessibility Assistance?</h4>
              <p>
                If you encounter any difficulty accessing content on this website or require special accommodation when visiting, please
                call us directly at <a href={site.phoneHref} className="font-bold text-[#1a3b6b] underline">{site.phone}</a> or email us at{" "}
                <a href={site.emailHref} className="font-bold text-[#1a3b6b] underline">{site.email}</a>.
                We are always happy to assist you in person, over the phone, or via email.
              </p>
            </div>
          )}

          {activeTab === "cookies" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#d99214] block">
                  Transparency Notice
                </span>
                <h3 className="text-xl font-bold font-display text-[#191918] mt-1">
                  Cookie & Tracking Policy
                </h3>
              </div>

              <p>
                This website uses essential cookies and performance technologies to deliver an optimal browsing experience, remember
                user preferences, and ensure seamless navigation.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">1. Essential Cookies</h4>
              <p>
                Required for site security, session maintenance, and opening modal dialogues (such as online ordering and reservations).
                These cannot be turned off.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">2. Analytics & Preference Cookies</h4>
              <p>
                We use privacy-friendly analytics to count visits and traffic sources so we can measure and improve our site's loading
                speed and user interface. We do not track you across other websites.
              </p>

              <h4 className="text-base font-bold text-[#191918] pt-2">3. Managing Your Cookies</h4>
              <p>
                You can manage or disable cookies through your browser settings (Chrome, Safari, Firefox, Edge). Disabling essential
                cookies may affect some interactive site features.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f2ecdf] border-t border-[#dfd2be] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#5c5446]">
            <Check className="size-4 text-emerald-600" />
            <span className="font-semibold">Compliant with CA & Federal Laws</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#1a3b6b] text-white font-bold tracking-wide hover:bg-[#122b50] transition-colors cursor-pointer"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
}
