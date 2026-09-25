import { useState } from "react";
import {
  X,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Sparkles,
  AlertCircle,
  Check,
  MapPin,
  MessageSquare,
  MessageCircle,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";
import { site } from "../lib/site-content";
import { adminStore } from "../lib/admin-store";

export function ReservationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("2 guests");
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("7:00 PM (Dinner)");
  const [seating, setSeating] = useState("Any Table");
  const [specialRequests, setSpecialRequests] = useState("");
  const [confirmedResNumber, setConfirmedResNumber] = useState<string>("");

  // Validation & Submission State
  interface FormTouched {
    fullName?: boolean;
    phone?: boolean;
    email?: boolean;
  }
  const [touched, setTouched] = useState<FormTouched>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Field validation helpers
  const isNameValid = fullName.trim().length >= 2;
  const rawPhoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = rawPhoneDigits.length >= 7;
  const isEmailValid = email.trim().length >= 5 && email.includes("@") && email.includes(".");

  // Form validity
  const isFormValid = isNameValid && isPhoneValid && isEmailValid;

  const handleBlur = (field: keyof FormTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleAutofill = () => {
    setFullName("Sarah Jenkins");
    setPhone("(323) 555-0142");
    setEmail("sarah.j@example.com");
    setPartySize("2 guests");
    setDate("Today");
    setTime("7:30 PM (Dinner)");
    setSeating("Outdoor Patio");
    setSpecialRequests("Anniversary dinner, window or patio booth please.");
    setTouched({});
    setSubmitAttempted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitAttempted(true);

    // Mark all required fields as touched
    setTouched({
      fullName: true,
      phone: true,
      email: true,
    });

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = adminStore.addReservation({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        partySize,
        date,
        time,
        seating,
        specialRequests: specialRequests.trim() || undefined,
        createdAt: new Date().toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setConfirmedResNumber(res.reservationNumber);
    } catch (err) {
      console.error("Failed to record reservation in admin store:", err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 450);
  };

  const handleReset = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setPartySize("2 guests");
    setDate("Today");
    setTime("7:00 PM (Dinner)");
    setSeating("Any Table");
    setSpecialRequests("");
    setTouched({});
    setSubmitAttempted(false);
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop z-50 fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleReset}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-[#fdfbf7] text-[#191918] rounded-2xl shadow-2xl border border-[#c9bba6]/70 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Top Header Banner */}
        <div className="relative bg-gradient-to-r from-[#141b26] via-[#1a2536] to-[#111722] text-white p-5 sm:p-6 border-b border-[#e5a924]/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e5a924]/15 border border-[#e5a924]/30 text-[#e5a924] text-[0.62rem] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="size-3" />
                <span>TABLE RESERVATIONS</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-normal text-white mt-1.5 tracking-tight">
                Reserve at Beachwood
              </h3>
              <p className="text-xs text-[#ede4d5]/75 flex items-center gap-1.5 mt-1">
                <MapPin className="size-3 text-[#e5a924]" />
                <span>Hollywood Hills · 2695 N Beachwood Dr</span>
              </p>
            </div>

            <button
              onClick={handleReset}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-[#ede4d5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close reservation dialog"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            /* ============================================================ */
            /* SUCCESS CONFIRMATION RECEIPT */
            /* ============================================================ */
            <div className="py-4 text-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="size-16 rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="size-9 animate-in zoom-in duration-300" />
              </div>

              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#d99214]">
                  BOOKING REQUEST CONFIRMED
                </span>
                <h4 className="font-display text-2xl sm:text-3xl text-[#191918] font-normal mt-0.5">
                  We'll See You Soon, {fullName.split(" ")[0]}!
                </h4>
                <p className="text-xs text-[#5f594e] max-w-md mx-auto mt-1.5 leading-relaxed">
                  Your table request has been received. Instant notification sent to{" "}
                  <strong className="text-[#191918] font-semibold">{phone}</strong> and{" "}
                  <strong className="text-[#191918] font-semibold">{email}</strong>.
                </p>
              </div>

              {/* Booking Summary Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#f4eee4] border border-[#d9cbb7] text-left text-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#ded2bd]">
                  <span className="font-semibold uppercase tracking-wider text-[0.68rem] text-[#767064]">
                    Reservation #{confirmedResNumber || "CONFIRMED"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[0.6rem] uppercase tracking-wider">
                    Confirmed in System
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#767064] text-[0.68rem] block">Party & Table</span>
                    <span className="font-bold text-[#191918] text-sm">
                      {partySize} · {seating}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#767064] text-[0.68rem] block">Schedule</span>
                    <span className="font-bold text-[#191918] text-sm">
                      {date}, {time.split(" ")[0]} {time.split(" ")[1]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#767064] text-[0.68rem] block">Primary Guest</span>
                    <span className="font-semibold text-[#191918]">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#767064] text-[0.68rem] block">Contact</span>
                    <span className="font-semibold text-[#191918]">{phone}</span>
                  </div>
                </div>

                {specialRequests && (
                  <div className="pt-2 border-t border-[#ded2bd]">
                    <span className="text-[#767064] text-[0.68rem] block">Special Notes:</span>
                    <span className="text-[#49443b] italic">"{specialRequests}"</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/917814485357?text=${encodeURIComponent(
                    `Hello Beachwood Cafe! 🍽️ I just placed a table booking request:\n\n📋 Booking Ref: #${confirmedResNumber || "CONFIRMED"}\n👤 Guest Name: ${fullName}\n📞 Phone: ${phone}\n📅 Date: ${date}\n⏰ Time: ${time}\n👥 Party: ${partySize}\n🪑 Seating: ${seating}${specialRequests ? `\n📝 Special Requests: ${specialRequests}` : ""}\n\nPlease confirm my table reservation. Thank you!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    adminStore.trackWhatsAppClick(
                      "Customer Reservation WhatsApp Share",
                      `#${confirmedResNumber || "CONFIRMED"}`
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0f7a6e] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span>Send Booking Details to Cafe WhatsApp</span>
                </a>

                <a
                  href={site.reserveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d99214] to-[#c4800b] hover:from-[#e5a924] hover:to-[#d99214] text-[#191918] font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Sync Instant Booking on OpenTable</span>
                  <ArrowRight className="size-4" />
                </a>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#ede4d5] hover:bg-[#e4d7c3] text-[#49443b] hover:text-[#191918] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* RESERVATION INPUT FORM WITH FULL VALIDATION */
            /* ============================================================ */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Row 1: Guest Contact Information (Mandatory) */}
              <div className="space-y-3 pb-3 border-b border-[#e5dacf]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1a3b6b]">
                    1. Guest Contact Information
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutofill}
                      className="px-2 py-0.5 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-[0.65rem] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Autofill test guest information"
                    >
                      <Sparkles className="size-3" />
                      <span>⚡ Quick Demo Fill</span>
                    </button>
                    <span className="text-[0.62rem] text-rose-600 font-semibold">* Required</span>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#2c2822] mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#767064]">
                      <User className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      placeholder="e.g. Sophia Montgomery"
                      className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-base sm:text-xs bg-white border transition-all ${
                        touched.fullName && !isNameValid
                          ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                          : touched.fullName && isNameValid
                          ? "border-emerald-500 bg-emerald-50/20 text-[#191918] focus:ring-2 focus:ring-emerald-500/20"
                          : "border-[#c9bba6] text-[#191918] focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20"
                      } focus:outline-none`}
                    />
                    {touched.fullName && isNameValid && (
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-600">
                        <Check className="size-3.5" />
                      </div>
                    )}
                  </div>
                  {touched.fullName && !isNameValid && (
                    <p className="text-[0.7rem] text-rose-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>Please enter your full name (minimum 2 characters).</span>
                    </p>
                  )}
                </div>

                {/* Phone & Email Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2c2822] mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#767064]">
                        <Phone className="size-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        placeholder="e.g. (323) 555-0192"
                        className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-base sm:text-xs bg-white border transition-all ${
                          touched.phone && !isPhoneValid
                            ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                            : touched.phone && isPhoneValid
                            ? "border-emerald-500 bg-emerald-50/20 text-[#191918] focus:ring-2 focus:ring-emerald-500/20"
                            : "border-[#c9bba6] text-[#191918] focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20"
                        } focus:outline-none`}
                      />
                      {touched.phone && isPhoneValid && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-600">
                          <Check className="size-3.5" />
                        </div>
                      )}
                    </div>
                    {touched.phone && !isPhoneValid && (
                      <p className="text-[0.7rem] text-rose-600 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>Phone number is required (min. 7 digits).</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2c2822] mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#767064]">
                        <Mail className="size-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur("email")}
                        placeholder="e.g. sophia@example.com"
                        className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-base sm:text-xs bg-white border transition-all ${
                          touched.email && !isEmailValid
                            ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                            : touched.email && isEmailValid
                            ? "border-emerald-500 bg-emerald-50/20 text-[#191918] focus:ring-2 focus:ring-emerald-500/20"
                            : "border-[#c9bba6] text-[#191918] focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20"
                        } focus:outline-none`}
                      />
                      {touched.email && isEmailValid && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-600">
                          <Check className="size-3.5" />
                        </div>
                      )}
                    </div>
                    {touched.email && !isEmailValid && (
                      <p className="text-[0.7rem] text-rose-600 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>Valid email address is required.</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Table Specifications */}
              <div className="space-y-3">
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1a3b6b] block">
                  2. Table & Party Details
                </span>

                {/* Party Size */}
                <div>
                  <label className="block text-xs font-semibold text-[#2c2822] mb-1 flex items-center gap-1.5">
                    <Users className="size-3.5 text-[#d99214]" />
                    <span>Party Size</span>
                  </label>
                  <div className="relative">
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl text-xs bg-white border border-[#c9bba6] text-[#191918] focus:outline-none focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20 appearance-none cursor-pointer"
                    >
                      <option value="1 guest">1 guest · Solo Dining</option>
                      <option value="2 guests">2 guests · Cozy Table</option>
                      <option value="3 guests">3 guests · Standard Dining</option>
                      <option value="4 guests">4 guests · Booth or Table</option>
                      <option value="5 guests">5 guests · Group Table</option>
                      <option value="6 guests">6 guests · Large Table</option>
                      <option value="Large party (7+ guests)">7+ guests · Special Event Party</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#767064]">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2c2822] mb-1 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#d99214]" />
                      <span>Reservation Date</span>
                    </label>
                    <div className="relative">
                      <select
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl text-xs bg-white border border-[#c9bba6] text-[#191918] focus:outline-none focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20 appearance-none cursor-pointer"
                      >
                        <option value="Today">Today (Same-day service)</option>
                        <option value="Tomorrow">Tomorrow</option>
                        <option value="This Friday">This Friday</option>
                        <option value="This Saturday">This Saturday (Weekend Brunch/Dinner)</option>
                        <option value="This Sunday">This Sunday (Weekend Brunch/Dinner)</option>
                        <option value="Next Week">Next Week</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#767064]">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2c2822] mb-1 flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[#d99214]" />
                      <span>Service Time</span>
                    </label>
                    <div className="relative">
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl text-xs bg-white border border-[#c9bba6] text-[#191918] focus:outline-none focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20 appearance-none cursor-pointer"
                      >
                        <option value="8:30 AM (Breakfast)">8:30 AM (Breakfast)</option>
                        <option value="9:30 AM (Brunch)">9:30 AM (Brunch)</option>
                        <option value="11:00 AM (Brunch)">11:00 AM (Brunch)</option>
                        <option value="12:30 PM (Lunch)">12:30 PM (Lunch)</option>
                        <option value="2:00 PM (Afternoon)">2:00 PM (Afternoon)</option>
                        <option value="5:30 PM (Dinner)">5:30 PM (Sunset Dinner)</option>
                        <option value="7:00 PM (Dinner)">7:00 PM (Evening Dinner)</option>
                        <option value="8:15 PM (Dinner)">8:15 PM (Late Evening)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#767064]">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seating Preference Segmented Control */}
                <div>
                  <label className="block text-xs font-semibold text-[#2c2822] mb-1.5 flex items-center gap-1.5">
                    <UtensilsCrossed className="size-3.5 text-[#d99214]" />
                    <span>Seating Atmosphere</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { key: "Any Table", label: "Any Table", sub: "First Available" },
                      { key: "Sunlit Room", label: "Sunlit Room", sub: "Indoor Charm" },
                      { key: "Patio Garden", label: "Patio Garden", sub: "Outdoor Breeze" },
                    ].map((opt) => {
                      const isSelected = seating === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setSeating(opt.key)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-[#d99214]/15 border-[#d99214] text-[#191918] shadow-sm ring-1 ring-[#d99214]"
                              : "bg-white border-[#c9bba6] text-[#5f594e] hover:border-[#1a3b6b] hover:bg-[#f4eee4]"
                          }`}
                        >
                          <span className="font-bold text-[0.72rem] block">{opt.label}</span>
                          <span className="text-[0.62rem] opacity-75 block">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Special Requests */}
                <div>
                  <label className="block text-[0.72rem] font-semibold text-[#49443b] mb-1 flex items-center gap-1">
                    <MessageSquare className="size-3 text-[#767064]" />
                    <span>Dietary or Celebration Notes (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Birthday celebration, vegan options, quiet corner..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#c9bba6] text-[#191918] placeholder-[#767064]/60 focus:outline-none focus:border-[#d99214] focus:ring-2 focus:ring-[#d99214]/20"
                  />
                </div>
              </div>

              {/* Submit & Secondary Actions */}
              <div className="pt-2 space-y-2.5">
                {/* Mobile Error Feedback Right Above Submit Button */}
                {submitAttempted && !isFormValid && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-800 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold text-rose-900">Please complete the required details:</p>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-[0.72rem]">
                          {!isNameValid && <li>Enter your full name (at least 2 letters)</li>}
                          {!isPhoneValid && <li>Enter a valid phone number (at least 7 digits)</li>}
                          {!isEmailValid && <li>Enter a valid email address (e.g. name@example.com)</li>}
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutofill}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Sparkles className="size-3.5" />
                      <span>⚡ Autofill Details to Book Table Instantly</span>
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d99214] to-[#c4800b] hover:from-[#e5a924] hover:to-[#d99214] text-[#191918] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#d99214]/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-4 border-2 border-[#191918] border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Table Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Table Reservation</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[0.68rem] text-[#767064] pt-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>No deposit required for standard tables</span>
                  </span>
                  <a
                    href={site.reserveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a3b6b] hover:text-[#d99214] font-semibold underline underline-offset-2 transition-colors"
                  >
                    Direct OpenTable Portal
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
