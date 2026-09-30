import { createFileRoute } from "@tanstack/react-router";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { OrderTrackerView, OrderTrackErrorBoundary } from "../components/order-tracker-view";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Beachwood Cafe Hollywood" },
      {
        name: "description",
        content:
          "Track your Beachwood Cafe order in real-time. Follow preparation in the kitchen, monitor pickup or delivery status, and view or print your digital receipt.",
      },
      { property: "og:title", content: "Track Your Order | Beachwood Cafe" },
      {
        property: "og:description",
        content: "Live real-time order tracking and kitchen sync for Beachwood Cafe diners.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/track" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  return (
    <div className="min-h-[85vh] bg-[#faf8f5] py-8 sm:py-14">
      <div className="site-container max-w-3xl">
        {/* Intro Banner */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1a3b6b]/10 border border-[#1a3b6b]/20 text-[#1a3b6b] text-xs font-extrabold uppercase tracking-widest shadow-xs">
            <Clock className="size-3.5 text-[#d99214]" />
            <span>Live Kitchen Operations · Real-Time Sync</span>
          </div>
          <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191918] tracking-tight">
            Order Status & Live Tracking
          </h1>
          <p className="text-sm sm:text-base text-[#6b665c] max-w-xl mx-auto font-medium">
            Monitor your order as it moves from our kitchen to your table or doorstep. Enter your
            Order # or phone number below.
          </p>
        </div>

        {/* Tracker Card */}
        <div className="bg-[#fdfbf7] rounded-3xl border border-[#1a3b6b]/20 shadow-xl overflow-hidden">
          <OrderTrackErrorBoundary>
            <OrderTrackerView isModal={false} />
          </OrderTrackErrorBoundary>
        </div>

        {/* Help & Assurance Footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#767064]">
          <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/10 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-amber-50 text-[#b87508] shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div>
              <strong className="text-[#191918] block text-xs">1-Minute Cancellation</strong>
              <p className="mt-0.5 leading-relaxed">
                Changed your mind? You can cancel your order directly within 1 minute of placing it.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/10 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <strong className="text-[#191918] block text-xs">Direct Support</strong>
              <p className="mt-0.5 leading-relaxed">
                Need urgent modifications or have dietary questions? Call our cafe desk directly at
                (323) 871-1717.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
