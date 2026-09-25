import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Utensils,
  CheckCircle,
  MessageCircle,
  Phone,
  CreditCard,
  Lock,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Printer,
  Sparkles,
  ShieldCheck,
  Bike,
  Store,
  ChevronRight,
} from "lucide-react";
import { useCart, parseItemPrice } from "../lib/cart-context";
import { site } from "../lib/site-content";
import { adminStore } from "../lib/admin-store";

type CheckoutStep = "items" | "checkout" | "confirmed";
type FulfilmentType = "pickup" | "delivery";
type PaymentMethod = "prepay" | "counter";
type TipType = "10" | "15" | "20" | "custom" | "none";

interface AppliedPromo {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
}

interface ConfirmedOrder {
  orderId: string;
  placedAt: string;
  estimatedTime: string;
  name: string;
  phone: string;
  email: string;
  fulfilmentType: FulfilmentType;
  deliveryAddress?: string;
  deliveryApt?: string;
  deliveryCity?: string;
  deliveryZip?: string;
  deliveryNotes?: string;
  includeUtensils: boolean;
  orderNote: string;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  discountAmount: number;
  tax: number;
  deliveryFee: number;
  tipAmount: number;
  grandTotal: number;
}

export function CartDrawer() {
  const {
    items,
    totalCount,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Navigation step inside the cart drawer
  const [activeStep, setActiveStep] = useState<CheckoutStep>("items");

  // Contact Information
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Fulfilment Options
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("pickup");
  const [includeUtensils, setIncludeUtensils] = useState<boolean>(true);
  const [orderNote, setOrderNote] = useState<string>("");

  // Delivery details
  const [deliveryStreet, setDeliveryStreet] = useState<string>("");
  const [deliveryApt, setDeliveryApt] = useState<string>("");
  const [deliveryCity, setDeliveryCity] = useState<string>("Los Angeles");
  const [deliveryZip, setDeliveryZip] = useState<string>("90068");
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepay");
  const [tipType, setTipType] = useState<TipType>("15");
  const [customTip, setCustomTip] = useState<string>("");

  // Credit Card fields (with autofill)
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExp, setCardExp] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");
  const [cardZip, setCardZip] = useState<string>("");

  // Validation & Processing
  interface CheckoutFormErrors {
    name?: string;
    phone?: string;
    email?: string;
    deliveryStreet?: string;
    deliveryZip?: string;
    cardNumber?: string;
  }
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  // Helper to completely reset checkout form fields
  const resetCheckoutForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setPromoInput("");
    setAppliedPromo(null);
    setPromoMessage(null);
    setFulfilmentType("pickup");
    setIncludeUtensils(true);
    setOrderNote("");
    setDeliveryStreet("");
    setDeliveryApt("");
    setDeliveryCity("Los Angeles");
    setDeliveryZip("90068");
    setDeliveryInstructions("");
    setPaymentMethod("prepay");
    setTipType("15");
    setCustomTip("");
    setCardNumber("");
    setCardExp("");
    setCardCvc("");
    setCardZip("");
    setErrors({});
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("beachwood_checkout_info");
      } catch (err) {
        console.error("Failed to remove saved checkout info", err);
      }
    }
  };

  // Ensure previous checkout details are erased from localStorage for clean new sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("beachwood_checkout_info");
      } catch (err) {
        console.error("Failed to clear checkout info", err);
      }
    }
  }, []);

  // When a user adds items to cart for a new order, ensure previous checkout info is erased
  const prevItemsCountRef = useRef(items.length);
  useEffect(() => {
    if (prevItemsCountRef.current === 0 && items.length > 0) {
      if (confirmedOrder) {
        setConfirmedOrder(null);
      }
      resetCheckoutForm();
      setActiveStep("items");
    }
    prevItemsCountRef.current = items.length;
  }, [items.length, confirmedOrder]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        if (confirmedOrder) {
          setConfirmedOrder(null);
          resetCheckoutForm();
          setActiveStep("items");
        }
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setIsCartOpen, confirmedOrder]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // When cart has no items and wasn't just confirmed, return to items step
  useEffect(() => {
    if (items.length === 0 && activeStep !== "confirmed") {
      setActiveStep("items");
    }
  }, [items.length, activeStep]);

  // Financial Calculations
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountPercent) {
      return (subtotal * appliedPromo.discountPercent) / 100;
    }
    if (appliedPromo.discountFixed) {
      return Math.min(subtotal, appliedPromo.discountFixed);
    }
    return 0;
  }, [subtotal, appliedPromo]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedTax = discountedSubtotal * 0.095; // 9.5% Los Angeles Sales Tax

  const deliveryFee = useMemo(() => {
    if (fulfilmentType !== "delivery") return 0;
    return discountedSubtotal >= 50 ? 0 : 3.99;
  }, [fulfilmentType, discountedSubtotal]);

  const tipAmount = useMemo(() => {
    if (tipType === "none") return 0;
    if (tipType === "10") return discountedSubtotal * 0.1;
    if (tipType === "15") return discountedSubtotal * 0.15;
    if (tipType === "20") return discountedSubtotal * 0.2;
    if (tipType === "custom") {
      const val = parseFloat(customTip);
      return isNaN(val) || val < 0 ? 0 : val;
    }
    return 0;
  }, [tipType, discountedSubtotal, customTip]);

  const grandTotal = Math.max(0, discountedSubtotal + estimatedTax + deliveryFee + tipAmount);

  // Promo Code Validation
  const handleApplyPromo = () => {
    setPromoMessage(null);
    const cleaned = promoInput.trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === "BEACHWOOD10") {
      setAppliedPromo({ code: "BEACHWOOD10", discountPercent: 10 });
      setPromoMessage({ text: "Promo code BEACHWOOD10 applied! (10% off)", isError: false });
    } else if (cleaned === "BEACHWOOD20") {
      setAppliedPromo({ code: "BEACHWOOD20", discountPercent: 20 });
      setPromoMessage({ text: "Promo code BEACHWOOD20 applied! (20% off)", isError: false });
    } else if (cleaned === "WELCOME5") {
      setAppliedPromo({ code: "WELCOME5", discountFixed: 5 });
      setPromoMessage({ text: "Welcome reward applied! ($5.00 off)", isError: false });
    } else if (cleaned === "FREECOFFEE") {
      setAppliedPromo({ code: "FREECOFFEE", discountFixed: 5.5 });
      setPromoMessage({ text: "Free Coffee credit applied! ($5.50 off)", isError: false });
    } else {
      setPromoMessage({ text: "Invalid promo or gift code. Try 'BEACHWOOD10'", isError: true });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMessage(null);
  };

  // Demo Autofill Function (fills required fields seamlessly for testing)
  const handleAutofill = () => {
    setName("Jane Doe");
    setPhone("(323) 871-1717");
    setEmail("jane.doe@example.com");
    if (fulfilmentType === "delivery" && !deliveryStreet) {
      setDeliveryStreet("2695 Beachwood Dr");
      setDeliveryApt("Apt 4B");
      setDeliveryCity("Los Angeles");
      setDeliveryZip("90068");
      setDeliveryInstructions("Please leave by the front door. Ring the bell.");
    }
    setCardNumber("4242 •••• •••• 4242");
    setCardExp("12/28");
    setCardCvc("888");
    setCardZip("90068");
    setErrors({});
  };

  // Form Validation & Order Submission
  const validateForm = (): boolean => {
    const newErrors: CheckoutFormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Please enter your full name.";
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!phone.trim() || cleanPhone.length < 7) {
      newErrors.phone = "Please enter a valid phone number (at least 7 digits).";
    }

    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Please enter a valid email address for your receipt.";
    }

    if (fulfilmentType === "delivery") {
      if (!deliveryStreet.trim() || deliveryStreet.trim().length < 4) {
        newErrors.deliveryStreet = "Please enter your street address for delivery.";
      }
      if (!deliveryZip.trim() || deliveryZip.trim().length < 4) {
        newErrors.deliveryZip = "Please enter a valid postal / zip code.";
      }
    }

    if (paymentMethod === "prepay") {
      if (!cardNumber.trim() || cardNumber.replace(/[^0-9]/g, "").length < 12) {
        newErrors.cardNumber = "Please enter a valid card number (or click Autofill).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) {
      // Scroll to the first error or top of the checkout container
      const errorContainer = document.getElementById("checkout-form-container");
      if (errorContainer) {
        errorContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setIsSubmitting(true);

    // Clear any previous saved checkout info from localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("beachwood_checkout_info");
      } catch (err) {
        console.error("Failed to remove checkout info", err);
      }
    }

    // Simulate server order placement
    setTimeout(() => {
      const randomId = "BWC-" + Math.floor(10000 + Math.random() * 90000);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const readyMinutes = fulfilmentType === "pickup" ? 30 : 45;
      const readyDate = new Date(now.getTime() + readyMinutes * 60000);
      const readyTimeStr = readyDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const orderData: ConfirmedOrder = {
        orderId: randomId,
        placedAt: timeStr,
        estimatedTime: readyTimeStr,
        name,
        phone,
        email,
        fulfilmentType,
        deliveryAddress: deliveryStreet,
        deliveryApt,
        deliveryCity,
        deliveryZip,
        deliveryNotes: deliveryInstructions,
        includeUtensils,
        orderNote,
        paymentMethod,
        cardLast4: cardNumber.replace(/[^0-9]/g, "").slice(-4) || "4242",
        items: items.map(({ item, quantity }) => {
          const unitPrice = parseItemPrice(item.price);
          return {
            name: item.name,
            quantity,
            unitPrice,
            total: unitPrice * quantity,
          };
        }),
        subtotal,
        discountAmount,
        tax: estimatedTax,
        deliveryFee,
        tipAmount,
        grandTotal,
      };

      // Persist order in Admin Store
      try {
        adminStore.addOrder({
          orderNumber: randomId,
          placedAt: `Today, ${timeStr}`,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          fulfilmentType,
          deliveryAddress: deliveryStreet,
          deliveryApt,
          deliveryCity,
          deliveryZip,
          deliveryNotes: deliveryInstructions,
          includeUtensils,
          orderNote,
          paymentMethod,
          cardLast4: cardNumber.replace(/[^0-9]/g, "").slice(-4) || "4242",
          items: orderData.items,
          subtotal,
          discountAmount,
          tax: estimatedTax,
          deliveryFee,
          tipAmount,
          grandTotal,
        });
      } catch (err) {
        console.error("Failed to record order in admin store:", err);
      }

      setConfirmedOrder(orderData);
      setIsSubmitting(false);
      setActiveStep("confirmed");
      // Clear cart items and erase form inputs so any subsequent order starts completely fresh
      clearCart();
      resetCheckoutForm();
    }, 900);
  };

  const handleFinishAndClear = () => {
    clearCart();
    setConfirmedOrder(null);
    resetCheckoutForm();
    setActiveStep("items");
    setIsCartOpen(false);
  };

  if (!isCartOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={() => {
        if (confirmedOrder) {
          setConfirmedOrder(null);
          resetCheckoutForm();
          setActiveStep("items");
        }
        setIsCartOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart & Checkout"
    >
      <div
        className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-full sm:max-w-xl md:max-w-2xl bg-[#ede4d5] text-[#191918] shadow-2xl flex flex-col border-l border-[#1a3b6b]/20 animate-in slide-in-from-right duration-300">
          {/* ========================================================================= */}
          {/* 1. HEADER */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-b border-[#1a3b6b]/15 bg-[#ede4d5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#1a3b6b] text-white shadow-xs">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#1a3b6b] leading-tight">
                  {activeStep === "confirmed"
                    ? "Order Confirmed!"
                    : activeStep === "checkout"
                      ? "Complete Your Order"
                      : "Your Beachwood Order"}
                </h2>
                <p className="text-xs text-[#595347]">
                  {activeStep === "confirmed"
                    ? "Thank you for dining with Beachwood Cafe"
                    : `${totalCount} ${totalCount === 1 ? "item" : "items"} selected`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeStep === "checkout" && (
                <button
                  onClick={handleAutofill}
                  className="px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider bg-[#16a34a] text-white hover:bg-[#15803d] rounded-md flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  title="Autofill sample order data for fast testing"
                >
                  <Sparkles className="size-3" />
                  <span>Autofill Demo</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (confirmedOrder) {
                    setConfirmedOrder(null);
                    resetCheckoutForm();
                    setActiveStep("items");
                  }
                  setIsCartOpen(false);
                }}
                className="p-2 rounded-full text-[#595347] hover:text-[#1a3b6b] hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Stepper Bar (visible when items are present and not in confirmed state) */}
          {items.length > 0 && activeStep !== "confirmed" && (
            <div className="bg-[#e4d7c5] px-4 py-2 border-b border-[#1a3b6b]/15 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStep("items")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeStep === "items"
                      ? "bg-[#1a3b6b] text-white shadow-xs"
                      : "text-[#595347] hover:bg-black/5"
                  }`}
                >
                  <span>1. Review Items</span>
                  <span className="text-[0.65rem] opacity-80">({totalCount})</span>
                </button>

                <ChevronRight className="size-3.5 text-[#8f8576]" />

                <button
                  onClick={() => setActiveStep("checkout")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeStep === "checkout"
                      ? "bg-[#1a3b6b] text-white shadow-xs"
                      : "text-[#595347] hover:bg-black/5"
                  }`}
                >
                  <Lock className="size-3" />
                  <span>2. Checkout & Details</span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-[0.7rem] text-[#767064]">Total:</span>{" "}
                <span className="font-display font-bold text-[#1a3b6b]">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. BODY CONTENT (ITEMS / CHECKOUT / CONFIRMED) */}
          {/* ========================================================================= */}
          <div
            id="checkout-form-container"
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
          >
            {/* ----------------------------------------------------------------------- */}
            {/* STEP 1: REVIEW ITEMS */}
            {/* ----------------------------------------------------------------------- */}
            {activeStep === "items" && (
              <>
                {items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-[#dfd2be] rounded-full flex items-center justify-center mx-auto text-[#767064]">
                      <Utensils className="size-8 text-[#d99214]" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#1a3b6b]">
                      Your cart is empty
                    </h3>
                    <p className="text-xs text-[#5c574c] max-w-xs mx-auto">
                      Looks like you haven&apos;t added any dishes yet. Browse our California menu to
                      select your favorites!
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="btn-olive px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md mt-2 cursor-pointer"
                    >
                      Explore Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#595347]">
                        Selected Dishes ({totalCount})
                      </span>
                      <button
                        onClick={clearCart}
                        className="text-[0.72rem] font-bold text-[#767064] hover:text-[#d32f2f] transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    {items.map(({ item, quantity }) => {
                      const unitPrice = parseItemPrice(item.price);
                      const itemTotal = unitPrice * quantity;

                      return (
                        <div
                          key={item.name}
                          className="p-3.5 rounded-xl bg-white/90 border border-[#1a3b6b]/12 flex gap-3.5 items-center justify-between shadow-2xs hover:border-[#1a3b6b]/30 transition-all"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#c9bba6]/50 shadow-2xs"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-sm font-bold text-[#191918] truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[#d99214] font-bold mt-0.5">
                              {item.price} each
                            </p>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="inline-flex items-center rounded-md border border-[#1a3b6b]/20 bg-[#ede4d5]/60 overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.name, quantity - 1)}
                                  className="p-1 px-2 text-[#1a3b6b] hover:bg-[#1a3b6b]/10 transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="px-2.5 text-xs font-bold text-[#191918]">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.name, quantity + 1)}
                                  className="p-1 px-2 text-[#1a3b6b] hover:bg-[#1a3b6b]/10 transition-colors cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.name)}
                                className="p-1.5 text-[#767064] hover:text-[#d32f2f] transition-colors cursor-pointer"
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-display text-base font-bold text-[#1a3b6b]">
                              ${itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Preparation notes */}
                    <div className="pt-2">
                      <label
                        htmlFor="cart-order-notes"
                        className="block text-xs font-bold text-[#595347] mb-1"
                      >
                        Special Preparation / Allergy Notes:
                      </label>
                      <textarea
                        id="cart-order-notes"
                        rows={2}
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        placeholder="e.g. dressing on the side, allergies to nuts, extra napkins..."
                        className="w-full p-2.5 text-xs rounded-lg bg-white/80 border border-[#1a3b6b]/15 focus:outline-none focus:border-[#1a3b6b] text-[#191918]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* STEP 2: CHECKOUT & FILL ORDER DETAILS (MATCHING SCREENSHOT) */}
            {/* ----------------------------------------------------------------------- */}
            {activeStep === "checkout" && (
              <div className="space-y-6">
                {/* Back to items button */}
                <div className="flex items-center justify-between pb-1 border-b border-[#1a3b6b]/10">
                  <button
                    onClick={() => setActiveStep("items")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a3b6b] hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Cart Items</span>
                  </button>
                  <span className="text-xs text-[#595347] font-semibold">
                    {totalCount} items • ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Validation Error Banner */}
                {Object.keys(errors).length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#fee2e2] border border-[#ef4444]/40 text-[#b91c1c] text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Please complete the required details:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {Object.values(errors).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 1. Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#1a3b6b]/15">
                    <h3 className="font-display text-lg font-bold text-[#191918]">
                      Contact Information
                    </h3>
                    {(name || phone || email || deliveryStreet) && (
                      <button
                        type="button"
                        onClick={resetCheckoutForm}
                        className="text-[0.68rem] text-[#767064] hover:text-[#d32f2f] font-semibold underline cursor-pointer"
                        title="Erase all filled contact and delivery details"
                      >
                        Clear Details
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label
                        htmlFor="cust-name"
                        className="block text-xs font-bold text-[#191918] mb-1"
                      >
                        Name: <span className="text-[#d32f2f]">*</span>
                      </label>
                      <input
                        id="cust-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                        }}
                        placeholder="Your full name"
                        className={`w-full p-2.5 text-xs rounded-md bg-white border ${
                          errors.name ? "border-[#ef4444] ring-1 ring-[#ef4444]" : "border-[#c9bba6]"
                        } focus:outline-none focus:border-[#1a3b6b] text-[#191918]`}
                      />
                      {errors.name && (
                        <p className="text-[0.68rem] text-[#ef4444] mt-0.5">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="cust-phone"
                        className="block text-xs font-bold text-[#191918] mb-1"
                      >
                        Phone: <span className="text-[#d32f2f]">*</span>
                      </label>
                      <input
                        id="cust-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        placeholder="e.g. (323) 871-1717"
                        className={`w-full p-2.5 text-xs rounded-md bg-white border ${
                          errors.phone ? "border-[#ef4444] ring-1 ring-[#ef4444]" : "border-[#c9bba6]"
                        } focus:outline-none focus:border-[#1a3b6b] text-[#191918]`}
                      />
                      {errors.phone && (
                        <p className="text-[0.68rem] text-[#ef4444] mt-0.5">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="cust-email"
                        className="block text-xs font-bold text-[#191918] mb-1"
                      >
                        Email (for order confirmation receipt):{" "}
                        <span className="text-[#d32f2f]">*</span>
                      </label>
                      <input
                        id="cust-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="e.g. name@example.com"
                        className={`w-full p-2.5 text-xs rounded-md bg-white border ${
                          errors.email ? "border-[#ef4444] ring-1 ring-[#ef4444]" : "border-[#c9bba6]"
                        } focus:outline-none focus:border-[#1a3b6b] text-[#191918]`}
                      />
                      {errors.email && (
                        <p className="text-[0.68rem] text-[#ef4444] mt-0.5">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="promo-code"
                        className="block text-xs font-bold text-[#191918] mb-1"
                      >
                        Promo/Gift Code:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="promo-code"
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="e.g. BEACHWOOD10 or WELCOME5"
                          className="flex-1 p-2.5 text-xs uppercase rounded-md bg-white border border-[#c9bba6] focus:outline-none focus:border-[#1a3b6b] text-[#191918]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="px-4 py-2.5 text-xs font-bold rounded-md bg-[#1a3b6b] text-white hover:bg-[#132c52] transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      {promoMessage && (
                        <p
                          className={`text-[0.7rem] mt-1 font-semibold ${
                            promoMessage.isError ? "text-[#ef4444]" : "text-[#16a34a]"
                          }`}
                        >
                          {promoMessage.text}
                        </p>
                      )}

                      {appliedPromo && (
                        <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#16a34a]/15 text-[#16a34a] border border-[#16a34a]/30 text-xs font-bold">
                          <Tag className="size-3" />
                          <span>
                            {appliedPromo.code} Applied: -$
                            {discountAmount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemovePromo}
                            className="text-[#16a34a] hover:text-[#b91c1c] ml-1 cursor-pointer"
                            aria-label="Remove promo code"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Fulfilment Options (Matching Screenshot) */}
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-bold text-[#191918]">
                    Fulfilment Options
                  </h3>

                  {/* Tabs: Pick Up / Delivery */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfilmentType("pickup")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        fulfilmentType === "pickup"
                          ? "border-2 border-[#1a3b6b] text-[#1a3b6b] bg-white shadow-xs"
                          : "border border-[#c9bba6] text-[#595347] bg-white/60 hover:bg-white"
                      }`}
                    >
                      <Store className="size-3.5" />
                      <span>Pick Up</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfilmentType("delivery")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        fulfilmentType === "delivery"
                          ? "border-2 border-[#1a3b6b] text-[#1a3b6b] bg-white shadow-xs"
                          : "border border-[#c9bba6] text-[#595347] bg-white/60 hover:bg-white"
                      }`}
                    >
                      <Bike className="size-3.5" />
                      <span>Delivery</span>
                    </button>
                  </div>

                  {/* Fulfilment Details Card */}
                  <div className="p-4 rounded-xl bg-white/80 border border-[#c9bba6] space-y-3 text-xs">
                    {fulfilmentType === "pickup" ? (
                      <>
                        <div className="space-y-1">
                          <p className="font-semibold text-[#191918] flex items-center gap-1.5">
                            <Clock className="size-3.5 text-[#d99214]" />
                            <span>Estimate: 25-30min.</span>
                          </p>
                          <p className="text-[#595347] flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-[#1a3b6b] shrink-0 mt-0.5" />
                            <span>
                              From:{" "}
                              <a
                                href={site.directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium text-[#1a3b6b] hover:text-[#0052cc]"
                              >
                                {site.address}
                              </a>
                            </span>
                          </p>
                          <p className="text-[0.72rem] text-[#16a34a] font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                            <span>Kitchen is open • Fresh orders accepted now</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1 pb-2 border-b border-[#1a3b6b]/10">
                          <p className="font-semibold text-[#191918] flex items-center gap-1.5">
                            <Clock className="size-3.5 text-[#d99214]" />
                            <span>Estimate: 40-50min.</span>
                          </p>
                          <p className="text-[#595347]">
                            Delivery Fee:{" "}
                            {deliveryFee === 0 ? (
                              <strong className="text-[#16a34a]">FREE (orders $50+)</strong>
                            ) : (
                              <strong>${deliveryFee.toFixed(2)}</strong>
                            )}
                          </p>
                        </div>

                        {/* Delivery address input fields */}
                        <div className="space-y-2 pt-1">
                          <div>
                            <label
                              htmlFor="delivery-address"
                              className="block text-xs font-bold text-[#191918] mb-1"
                            >
                              Street Address: <span className="text-[#d32f2f]">*</span>
                            </label>
                            <input
                              id="delivery-address"
                              type="text"
                              value={deliveryStreet}
                              onChange={(e) => {
                                setDeliveryStreet(e.target.value);
                                if (errors.deliveryStreet)
                                  setErrors((prev) => ({ ...prev, deliveryStreet: "" }));
                              }}
                              placeholder="e.g. 2695 Beachwood Dr"
                              className={`w-full p-2.5 text-xs rounded-md bg-white border ${
                                errors.deliveryStreet
                                  ? "border-[#ef4444] ring-1 ring-[#ef4444]"
                                  : "border-[#c9bba6]"
                              } focus:outline-none focus:border-[#1a3b6b] text-[#191918]`}
                            />
                            {errors.deliveryStreet && (
                              <p className="text-[0.68rem] text-[#ef4444] mt-0.5">
                                {errors.deliveryStreet}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor="delivery-apt"
                                className="block text-xs font-bold text-[#191918] mb-1"
                              >
                                Apt / Suite:
                              </label>
                              <input
                                id="delivery-apt"
                                type="text"
                                value={deliveryApt}
                                onChange={(e) => setDeliveryApt(e.target.value)}
                                placeholder="Apt 4B"
                                className="w-full p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-[#191918]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="delivery-zip"
                                className="block text-xs font-bold text-[#191918] mb-1"
                              >
                                Zip Code: <span className="text-[#d32f2f]">*</span>
                              </label>
                              <input
                                id="delivery-zip"
                                type="text"
                                value={deliveryZip}
                                onChange={(e) => setDeliveryZip(e.target.value)}
                                placeholder="90068"
                                className="w-full p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-[#191918]"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="delivery-notes"
                              className="block text-xs font-bold text-[#191918] mb-1"
                            >
                              Delivery Instructions:
                            </label>
                            <input
                              id="delivery-notes"
                              type="text"
                              value={deliveryInstructions}
                              onChange={(e) => setDeliveryInstructions(e.target.value)}
                              placeholder="e.g. Gate code #1234, leave at front door"
                              className="w-full p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-[#191918]"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Utensils Checkbox (Exact match with screenshot) */}
                    <div className="pt-2 border-t border-[#1a3b6b]/10">
                      <label className="inline-flex items-center gap-2 p-2 rounded-md border border-[#1a3b6b] bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeUtensils}
                          onChange={(e) => setIncludeUtensils(e.target.checked)}
                          className="size-4 text-[#1a3b6b] rounded border-gray-300 focus:ring-[#1a3b6b]"
                        />
                        <span className="font-bold text-xs text-[#191918]">
                          Include Utensils?
                        </span>
                      </label>
                      <p className="text-[0.68rem] text-[#767064] mt-1">
                        Eco-friendly practice: We only include napkins and cutlery if selected.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Payment (Matching Screenshot) */}
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-bold text-[#191918]">Payment</h3>

                  {/* Payment Method Tabs */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("prepay")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        paymentMethod === "prepay"
                          ? "border-2 border-[#1a3b6b] text-[#1a3b6b] bg-white shadow-xs"
                          : "border border-[#c9bba6] text-[#595347] bg-white/60 hover:bg-white"
                      }`}
                    >
                      PrePay (Credit Card)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("counter")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        paymentMethod === "counter"
                          ? "border-2 border-[#1a3b6b] text-[#1a3b6b] bg-white shadow-xs"
                          : "border border-[#c9bba6] text-[#595347] bg-white/60 hover:bg-white"
                      }`}
                    >
                      Pay at Counter / Pickup
                    </button>
                  </div>

                  {/* Payment Details Container */}
                  <div className="p-4 rounded-xl bg-white/80 border border-[#c9bba6] space-y-4">
                    {/* Add a tip section */}
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#191918]">Add a tip:</h4>
                        <p className="text-[0.7rem] text-[#595347] italic">
                          100% goes to staff, thank you!
                        </p>
                      </div>

                      {/* Tip Buttons Grid */}
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {/* 10% */}
                        <button
                          type="button"
                          onClick={() => setTipType("10")}
                          className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                            tipType === "10"
                              ? "border-2 border-[#1a3b6b] bg-[#1a3b6b]/10 font-bold"
                              : "border-[#c9bba6] bg-white hover:bg-[#ede4d5]/50"
                          }`}
                        >
                          <span className="block text-xs font-bold text-[#191918]">10%</span>
                          <span className="block text-[0.65rem] text-[#595347]">
                            ${(discountedSubtotal * 0.1).toFixed(2)}
                          </span>
                        </button>

                        {/* 15% */}
                        <button
                          type="button"
                          onClick={() => setTipType("15")}
                          className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                            tipType === "15"
                              ? "border-2 border-[#1a3b6b] bg-[#1a3b6b]/10 font-bold"
                              : "border-[#c9bba6] bg-white hover:bg-[#ede4d5]/50"
                          }`}
                        >
                          <span className="block text-xs font-bold text-[#191918]">15%</span>
                          <span className="block text-[0.65rem] text-[#595347]">
                            ${(discountedSubtotal * 0.15).toFixed(2)}
                          </span>
                        </button>

                        {/* 20% */}
                        <button
                          type="button"
                          onClick={() => setTipType("20")}
                          className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                            tipType === "20"
                              ? "border-2 border-[#1a3b6b] bg-[#1a3b6b]/10 font-bold"
                              : "border-[#c9bba6] bg-white hover:bg-[#ede4d5]/50"
                          }`}
                        >
                          <span className="block text-xs font-bold text-[#191918]">20%</span>
                          <span className="block text-[0.65rem] text-[#595347]">
                            ${(discountedSubtotal * 0.2).toFixed(2)}
                          </span>
                        </button>

                        {/* Custom */}
                        <button
                          type="button"
                          onClick={() => setTipType("custom")}
                          className={`p-2 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            tipType === "custom"
                              ? "border-2 border-[#1a3b6b] bg-[#1a3b6b]/10 font-bold"
                              : "border-[#c9bba6] bg-white hover:bg-[#ede4d5]/50"
                          }`}
                        >
                          <span className="text-xs font-bold text-[#191918]">custom</span>
                        </button>

                        {/* Not now */}
                        <button
                          type="button"
                          onClick={() => setTipType("none")}
                          className={`p-2 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            tipType === "none"
                              ? "border-2 border-[#1a3b6b] bg-[#1a3b6b]/10 font-bold"
                              : "border-[#c9bba6] bg-white hover:bg-[#ede4d5]/50"
                          }`}
                        >
                          <span className="text-[0.7rem] font-bold text-[#595347]">not now</span>
                        </button>
                      </div>

                      {/* Custom tip input field */}
                      {tipType === "custom" && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-xs font-bold text-[#191918]">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={customTip}
                            onChange={(e) => setCustomTip(e.target.value)}
                            placeholder="Enter tip amount"
                            className="w-32 p-1.5 text-xs rounded-md bg-white border border-[#c9bba6] text-[#191918]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Credit Card Input Section (when PrePay is active) */}
                    {paymentMethod === "prepay" ? (
                      <div className="space-y-2.5 pt-2 border-t border-[#1a3b6b]/10">
                        <label className="block text-xs font-bold text-[#191918]">
                          Credit Card: <span className="text-[#d32f2f]">*</span>
                        </label>

                        {/* Card Number Container with Autofill button (Exact match to screenshot) */}
                        <div
                          className={`flex items-center rounded-md bg-white border ${
                            errors.cardNumber
                              ? "border-[#ef4444] ring-1 ring-[#ef4444]"
                              : "border-[#c9bba6]"
                          } px-3 py-1.5 shadow-2xs`}
                        >
                          <CreditCard className="size-4 text-[#767064] mr-2 shrink-0" />
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => {
                              setCardNumber(e.target.value);
                              if (errors.cardNumber)
                                setErrors((prev) => ({ ...prev, cardNumber: "" }));
                            }}
                            placeholder="Card number"
                            className="flex-1 text-xs text-[#191918] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAutofill}
                            className="px-2 py-0.5 text-[0.65rem] font-bold rounded bg-[#16a34a] text-white hover:bg-[#15803d] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Autofill</span>
                            <ChevronRight className="size-3" />
                          </button>
                        </div>
                        {errors.cardNumber && (
                          <p className="text-[0.68rem] text-[#ef4444]">{errors.cardNumber}</p>
                        )}

                        {/* Expiry / CVC / Zip inputs */}
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            placeholder="MM / YY"
                            className="p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-center text-[#191918]"
                          />
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="CVC"
                            className="p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-center text-[#191918]"
                          />
                          <input
                            type="text"
                            value={cardZip}
                            onChange={(e) => setCardZip(e.target.value)}
                            placeholder="ZIP"
                            className="p-2 text-xs rounded-md bg-white border border-[#c9bba6] text-center text-[#191918]"
                          />
                        </div>

                        {/* Stripe Security Label */}
                        <div className="text-center pt-1">
                          <p className="text-[0.7rem] text-[#767064] flex items-center justify-center gap-1">
                            <Lock className="size-3 text-[#16a34a]" />
                            <span>securely processed by stripe</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-[#dfd2be]/50 text-xs text-[#595347] flex items-center gap-2">
                        <Store className="size-4 text-[#1a3b6b] shrink-0" />
                        <span>
                          You can pay via Card, Cash, or Apple Pay at the Beachwood Cafe counter upon
                          pickup.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Complete Order Cost Breakdown */}
                <div className="p-4 rounded-xl bg-white/90 border border-[#1a3b6b]/15 space-y-2 text-xs">
                  <div className="flex justify-between text-[#595347]">
                    <span>Items Subtotal ({totalCount})</span>
                    <span className="font-semibold text-[#191918]">${subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#16a34a] font-semibold">
                      <span>Promo Discount ({appliedPromo?.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#595347]">
                    <span>Estimated LA Sales Tax (9.5%)</span>
                    <span className="font-semibold text-[#191918]">${estimatedTax.toFixed(2)}</span>
                  </div>

                  {fulfilmentType === "delivery" && (
                    <div className="flex justify-between text-[#595347]">
                      <span>Delivery Fee</span>
                      <span className="font-semibold text-[#191918]">
                        {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  {tipAmount > 0 && (
                    <div className="flex justify-between text-[#595347]">
                      <span>Staff Tip</span>
                      <span className="font-semibold text-[#191918]">${tipAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-[#1a3b6b] pt-2 border-t border-[#1a3b6b]/15">
                    <span>Estimated Total</span>
                    <span className="font-display text-lg">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* 5. Big Action Button: Place your Order (Exact Match to Screenshot) */}
                <div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#4b5563] hover:bg-[#374151] text-white shadow-lg flex flex-col items-center justify-center transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Placing your Order...
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="font-display text-base font-bold">
                          Place your Order • ${grandTotal.toFixed(2)}
                        </span>
                        <span className="text-[0.7rem] text-white/80 mt-0.5 truncate max-w-xs sm:max-w-sm">
                          {fulfilmentType === "pickup"
                            ? site.address
                            : `Deliver to: ${deliveryStreet || "Enter delivery address"}`}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[0.68rem] text-center text-[#767064] mt-1.5">
                    By placing your order, you agree to our terms & freshly prepared policy.
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* STEP 3: ORDER CONFIRMED & LIVE RECEIPT (fr i usda order confirm hove) */}
            {/* ----------------------------------------------------------------------- */}
            {activeStep === "confirmed" && confirmedOrder && (
              <div className="py-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                {/* Header Success Badge */}
                <div className="text-center space-y-2 bg-white/90 p-5 rounded-2xl border border-[#16a34a]/30 shadow-md">
                  <div className="w-16 h-16 bg-[#16a34a]/15 text-[#16a34a] rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="size-8" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[0.68rem] font-extrabold uppercase tracking-wider bg-[#16a34a] text-white">
                    Order Placed & Confirmed
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#1a3b6b]">
                    Thank you, {confirmedOrder.name}!
                  </h3>
                  <p className="text-xs text-[#595347] max-w-md mx-auto">
                    Your order{" "}
                    <strong className="text-[#191918]">#{confirmedOrder.orderId}</strong> has been
                    received and sent directly to our kitchen staff.
                  </p>
                </div>

                {/* Progress Status Bar */}
                <div className="p-4 rounded-xl bg-white/80 border border-[#c9bba6] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#191918]">
                    <span>Status Tracker</span>
                    <span className="text-[#16a34a] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-ping" />
                      Kitchen Preparing Fresh
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <div className="h-1.5 rounded-full bg-[#16a34a]" />
                    <div className="h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                    <div className="h-1.5 rounded-full bg-[#c9bba6]/40" />
                  </div>
                  <div className="flex justify-between text-[0.65rem] text-[#767064] pt-1 font-semibold">
                    <span className="text-[#16a34a]">1. Placed</span>
                    <span className="text-[#16a34a]">2. In Kitchen</span>
                    <span>
                      {confirmedOrder.fulfilmentType === "pickup"
                        ? "3. Ready for Pickup"
                        : "3. Out for Delivery"}
                    </span>
                  </div>
                </div>

                {/* Fulfilment & Timing Details */}
                <div className="p-4 rounded-xl bg-white/80 border border-[#c9bba6] space-y-2.5 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064]">
                        Fulfilment Type
                      </span>
                      <p className="font-bold text-sm text-[#1a3b6b] capitalize mt-0.5">
                        {confirmedOrder.fulfilmentType === "pickup" ? "Pick Up at Cafe" : "Delivery"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064]">
                        Estimated Ready Time
                      </span>
                      <p className="font-bold text-sm text-[#d99214] mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="size-3.5" />
                        <span>Approx. {confirmedOrder.estimatedTime}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1a3b6b]/10 space-y-1">
                    <p className="text-[#595347]">
                      <strong className="text-[#191918]">Location / Address:</strong>{" "}
                      {confirmedOrder.fulfilmentType === "pickup"
                        ? site.address
                        : `${confirmedOrder.deliveryAddress} ${confirmedOrder.deliveryApt ? `(${confirmedOrder.deliveryApt})` : ""}, ${confirmedOrder.deliveryCity} ${confirmedOrder.deliveryZip}`}
                    </p>
                    <p className="text-[#595347]">
                      <strong className="text-[#191918]">Contact:</strong> {confirmedOrder.phone} •{" "}
                      {confirmedOrder.email}
                    </p>
                    <p className="text-[#595347]">
                      <strong className="text-[#191918]">Utensils:</strong>{" "}
                      {confirmedOrder.includeUtensils
                        ? "Included (Eco-cutlery & napkins)"
                        : "No utensils requested"}
                    </p>
                    {confirmedOrder.orderNote && (
                      <p className="text-[#595347]">
                        <strong className="text-[#191918]">Notes:</strong>{" "}
                        {confirmedOrder.orderNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Itemized Receipt Table */}
                <div className="p-4 rounded-xl bg-white/90 border border-[#c9bba6] space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1a3b6b]/10">
                    <span className="font-bold text-[#191918]">Itemized Receipt</span>
                    <span className="text-[0.7rem] text-[#767064]">
                      Paid via:{" "}
                      {confirmedOrder.paymentMethod === "prepay"
                        ? `Card (•••• ${confirmedOrder.cardLast4})`
                        : "Pay at counter"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {confirmedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[#595347]">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-semibold text-[#191918]">
                          ${it.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#1a3b6b]/10 space-y-1 text-[#595347]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${confirmedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {confirmedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-[#16a34a]">
                        <span>Discount</span>
                        <span>-${confirmedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>LA Sales Tax (9.5%)</span>
                      <span>${confirmedOrder.tax.toFixed(2)}</span>
                    </div>
                    {confirmedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>${confirmedOrder.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {confirmedOrder.tipAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Staff Tip</span>
                        <span>${confirmedOrder.tipAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[#1a3b6b] pt-1 border-t border-[#1a3b6b]/10">
                      <span>Grand Total</span>
                      <span className="font-display text-base">
                        ${confirmedOrder.grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Actions (WhatsApp / Phone / Print / Done) */}
                <div className="space-y-2 pt-1">
                  <a
                    href={`https://wa.me/917814485357?text=${encodeURIComponent(
                      `*Beachwood Cafe - Confirmed Order #${confirmedOrder.orderId}*\n\n` +
                        `*Customer:* ${confirmedOrder.name} (${confirmedOrder.phone})\n` +
                        `*Fulfilment:* ${confirmedOrder.fulfilmentType === "pickup" ? "Pick Up" : `Delivery to ${confirmedOrder.deliveryAddress}`}\n` +
                        `*Ready Approx:* ${confirmedOrder.estimatedTime}\n` +
                        `*Utensils:* ${confirmedOrder.includeUtensils ? "Yes" : "No"}\n\n` +
                        `*Items:*\n` +
                        confirmedOrder.items
                          .map((i) => `• ${i.quantity}x ${i.name} ($${i.total.toFixed(2)})`)
                          .join("\n") +
                        `\n\n*Total Amount:* $${confirmedOrder.grandTotal.toFixed(2)}` +
                        (confirmedOrder.orderNote
                          ? `\n*Note:* ${confirmedOrder.orderNote}`
                          : "")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      adminStore.trackWhatsAppClick(
                        "Order Receipt Copy",
                        `Order #${confirmedOrder.orderId} - ${confirmedOrder.name} ($${confirmedOrder.grandTotal.toFixed(2)})`
                      );
                    }}
                    className="w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white bg-[#16a34a] hover:bg-[#15803d] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="size-4" />
                    <span>Send Order Copy to WhatsApp</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={site.phoneHref}
                      className="py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1a3b6b] bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Phone className="size-3.5" />
                      <span>Call Cafe</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#595347] bg-white border border-[#c9bba6] hover:bg-[#ede4d5] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="size-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const placedOrderNumber = confirmedOrder.orderId;
                      clearCart();
                      setConfirmedOrder(null);
                      resetCheckoutForm();
                      setActiveStep("items");
                      setIsCartOpen(false);
                      window.dispatchEvent(
                        new CustomEvent("bwc_open_track_modal", {
                          detail: { orderNumber: placedOrderNumber },
                        })
                      );
                    }}
                    className="btn-olive w-full py-2.5 text-xs font-bold rounded-xl mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Clock className="size-4 text-[#d99214]" />
                    <span>Track Order Live (1-Min Cancel Window)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishAndClear}
                    className="btn-outline-dark w-full py-2.5 text-xs font-bold rounded-xl mt-1.5 cursor-pointer"
                  >
                    Clear Cart & Place Another Order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. STICKY FOOTER (WHEN VIEWING ITEMS) */}
          {/* ========================================================================= */}
          {items.length > 0 && activeStep === "items" && (
            <div className="p-4 sm:p-5 border-t border-[#1a3b6b]/15 bg-white/95 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#595347]">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-[#191918]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#595347]">
                  <span>Estimated LA Tax (9.5%)</span>
                  <span className="font-semibold text-[#191918]">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1a3b6b] pt-1.5 border-t border-[#1a3b6b]/10">
                  <span>Estimated Total</span>
                  <span className="font-display text-lg">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep("checkout")}
                className="btn-olive w-full py-3.5 text-xs font-extrabold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-4" />
              </button>

              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[0.72rem] font-bold text-[#767064] hover:text-[#d32f2f] transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="text-[0.72rem] font-bold text-[#1a3b6b] hover:underline cursor-pointer"
                >
                  + Add More Dishes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
