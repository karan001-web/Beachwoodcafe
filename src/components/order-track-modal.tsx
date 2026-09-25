import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  MapPin,
  Utensils,
  Store,
  Bike,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Printer,
  Check,
  Sparkles,
} from "lucide-react";
import { adminStore, type AdminOrder, type OrderStatus } from "../lib/admin-store";
import { site } from "../lib/site-content";
import { printOrderReceipt } from "../lib/receipt-printer";

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string | undefined;
}

export function OrderTrackModal({
  isOpen,
  onClose,
  initialOrderNumber,
}: OrderTrackModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetOrderNumber, setTargetOrderNumber] = useState<string | null>(
    initialOrderNumber || null
  );
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const selectedOrderRef = useRef<AdminOrder | null>(selectedOrder);
  selectedOrderRef.current = selectedOrder;

  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [searchError, setSearchError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Sync initialOrderNumber prop changes
  useEffect(() => {
    if (initialOrderNumber) {
      setTargetOrderNumber(initialOrderNumber);
      const match = adminStore.findOrder(initialOrderNumber);
      if (match) setSelectedOrder(match);
    }
  }, [initialOrderNumber]);

  // Helper to refresh order list and selection
  const refreshData = (forceOrderNumber?: string) => {
    const allOrders = adminStore.getOrders();
    let recents = adminStore.getCustomerRecentOrders();
    // Only fall back to allOrders if admin user is viewing the track modal
    if (adminStore.isAuthenticated() && recents.length === 0 && allOrders.length > 0) {
      recents = allOrders.slice(0, 10);
    }
    setRecentOrders(recents);

    // 1. If a specific order was explicitly requested, prioritize it
    if (forceOrderNumber) {
      const match = adminStore.findOrder(forceOrderNumber);
      if (match) {
        setTargetOrderNumber(match.orderNumber);
        setSelectedOrder(match);
        return;
      }
    }

    // 2. If actively tracking an order, keep tracking THAT exact order
    const activeTarget =
      targetOrderNumber ||
      initialOrderNumber ||
      selectedOrderRef.current?.orderNumber;

    if (activeTarget) {
      const match = adminStore.findOrder(activeTarget);
      if (match) {
        setTargetOrderNumber(match.orderNumber);
        setSelectedOrder(match);
        return;
      }
    }

    // 3. Otherwise select last placed order
    const lastId = adminStore.getCustomerLastOrderId();
    if (lastId) {
      const match = adminStore.findOrder(lastId);
      if (match) {
        setTargetOrderNumber(match.orderNumber);
        setSelectedOrder(match);
        return;
      }
    }

    // 4. Otherwise pick top recent order
    if (recents.length > 0 && recents[0]) {
      setTargetOrderNumber(recents[0].orderNumber);
      setSelectedOrder(recents[0]);
    }
  };

  // Load orders and initial selection on open, with cloud server sync
  useEffect(() => {
    if (!isOpen) return;

    setCancelFeedback(null);
    setSearchError("");
    setStatusFeedback(null);

    refreshData();

    // Pull latest data from cloud server immediately
    adminStore.syncWithServer().then(() => {
      refreshData();
    }).catch(() => {});

    // Live poller every 1s as reliable backup to instant SSE cloud events
    const pollInterval = setInterval(async () => {
      try {
        await adminStore.syncWithServer();
        const current = selectedOrderRef.current;
        if (current) {
          const refreshed =
            adminStore.findOrder(current.orderNumber) || adminStore.findOrder(current.id);
          if (
            refreshed &&
            (refreshed.status !== current.status ||
              refreshed.cancelledBy !== current.cancelledBy ||
              refreshed.cancelledAt !== current.cancelledAt)
          ) {
            setSelectedOrder(refreshed);
          }
        }
      } catch {
        // silent catch
      }
    }, 1000);

    const handleOrderChange = (e?: any) => {
      const changedOrderNum = e?.detail?.orderNumber;
      const changedOrderId = e?.detail?.orderId;
      const current = selectedOrderRef.current;

      // If we are currently tracking an order:
      if (current) {
        const currentNum = current.orderNumber.replace(/^#/, "").trim().toLowerCase();
        const currentId = current.id.trim().toLowerCase();

        // If this event has a specific orderNumber or orderId, check if it belongs to OUR order
        if (changedOrderNum || changedOrderId) {
          const evNum = changedOrderNum ? String(changedOrderNum).replace(/^#/, "").trim().toLowerCase() : "";
          const evId = changedOrderId ? String(changedOrderId).trim().toLowerCase() : "";

          // If it is NOT our order, DO NOT change or switch our view!
          if ((evNum && evNum !== currentNum) || (evId && evId !== currentId)) {
            // Background update recent orders list without changing active order
            const recents = adminStore.getCustomerRecentOrders();
            setRecentOrders(recents);
            return;
          }
        }

        // It is our order, refresh its state in place
        const refreshed =
          adminStore.findOrder(current.orderNumber) || adminStore.findOrder(current.id);
        if (refreshed) {
          setSelectedOrder(refreshed);
        }
        const recents = adminStore.getCustomerRecentOrders();
        setRecentOrders(recents);
      } else {
        // No order selected yet, initial load
        refreshData();
      }
    };

    window.addEventListener("bwc_order_change", handleOrderChange);
    window.addEventListener("storage", handleOrderChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("bwc_order_change", handleOrderChange);
      window.removeEventListener("storage", handleOrderChange);
    };
  }, [isOpen, initialOrderNumber]);

  // Close on Escape
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

  // Search handler (with cloud sync fallback)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setCancelFeedback(null);

    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Please enter an Order Number or Phone Number.");
      return;
    }

    setTargetOrderNumber(query);
    let found = adminStore.findOrder(query);
    if (!found) {
      // Sync with cloud server in case order was placed from another device
      await adminStore.syncWithServer();
      found = adminStore.findOrder(query);
    }

    if (found) {
      setTargetOrderNumber(found.orderNumber);
      setSelectedOrder(found);
      adminStore.recordCustomerOrderId(found.orderNumber);
      setSearchQuery("");
    } else {
      setSearchError(
        `No order found matching "${query}". Please check your order ID (e.g. BWC-12345) or phone number.`
      );
    }
  };

  // Status Change Handler (allows clicking on Order Received, In Kitchen, Ready, Completed)
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    if (selectedOrder.status === newStatus) return;
    if (selectedOrder.status === "cancelled") {
      setCancelFeedback({
        success: false,
        message: "This order has been cancelled and its status cannot be changed.",
      });
      return;
    }

    setStatusUpdating(newStatus);
    const updatedOrder: AdminOrder = { ...selectedOrder, status: newStatus };
    setSelectedOrder(updatedOrder);

    // 1. Update in local store & broadcast
    adminStore.updateOrderStatus(selectedOrder.id, newStatus, selectedOrder.orderNumber);

    // 2. Push update directly to server API
    try {
      await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          status: newStatus,
        }),
      });
    } catch (e) {
      console.warn("Status sync error:", e);
    }

    const labelMap: Record<string, string> = {
      pending: "Order Received",
      kitchen: "In Kitchen",
      ready: "Ready for Pickup",
      completed: "Completed",
    };

    setStatusFeedback(`Live Status Updated: ${labelMap[newStatus] || newStatus}`);
    setTimeout(() => {
      setStatusUpdating(null);
      setTimeout(() => setStatusFeedback(null), 3000);
    }, 400);
  };

  // Cancellation logic
  const handleCustomerCancel = () => {
    if (!selectedOrder) return;

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to cancel Order #${selectedOrder.orderNumber}?\n\nThis will immediately inform the kitchen and halt preparation.`
    );
    if (!confirmed) return;

    setIsCancelling(true);
    setCancelFeedback(null);

    setTimeout(() => {
      const res = adminStore.cancelOrderByCustomer(
        selectedOrder.orderNumber,
        "Customer initiated cancellation within the 1-minute grace window"
      );

      setIsCancelling(false);
      setCancelFeedback({
        success: res.success,
        message: res.message,
      });

      if (res.order) {
        setSelectedOrder(res.order);
      }
    }, 350);
  };

  // 1-minute window calculation (60 seconds)
  const orderAgeMs = selectedOrder ? Math.max(0, now - selectedOrder.timestamp) : 0;
  const ONE_MIN_MS = 60 * 1000;
  const remainingSeconds = Math.max(0, Math.ceil((ONE_MIN_MS - orderAgeMs) / 1000));
  const canCancel =
    selectedOrder &&
    selectedOrder.status !== "cancelled" &&
    selectedOrder.status !== "completed" &&
    remainingSeconds > 0;

  // Stepper progress definition
  const steps = [
    { key: "pending", label: "Order Received", desc: "Sent to kitchen" },
    { key: "kitchen", label: "In Kitchen", desc: "Chef preparing" },
    { key: "ready", label: "Ready", desc: selectedOrder?.fulfilmentType === "pickup" ? "Ready for pick up" : "Out for delivery" },
    { key: "completed", label: "Completed", desc: "Enjoy your meal!" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "kitchen":
        return 1;
      case "ready":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.status) : 0;
  const isAdminUser = typeof window !== "undefined" && adminStore.isAuthenticated();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Track Your Beachwood Cafe Order"
    >
      <div
        className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-3xl border border-[#1a3b6b]/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#191918]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================================== */}
        {/* 1. MODAL HEADER */}
        {/* ===================================================================== */}
        <div className="bg-[#1a3b6b] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#d99214] text-[#191918] flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <span className="text-[0.68rem] font-extrabold uppercase tracking-widest text-[#d99214] block">
                Beachwood Cafe • Live Operations
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                Track & Manage Order
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close tracking modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
          {/* ===================================================================== */}
          {/* 2. SEARCH & QUICK SELECTOR */}
          {/* ===================================================================== */}
          <div className="space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#767064]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Order # (e.g. BWC-12345) or Phone"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-white border border-[#c9bba6] focus:border-[#1a3b6b] focus:ring-2 focus:ring-[#1a3b6b]/20 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-olive py-2.5 px-4 text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs"
              >
                Track
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}

            {/* Recent Orders Pills (if multiple available) */}
            {recentOrders.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                <span className="text-[0.68rem] font-bold text-[#767064] shrink-0 uppercase tracking-wider">
                  Your Orders:
                </span>
                {recentOrders.map((ord) => {
                  const isSelected = selectedOrder?.orderNumber === ord.orderNumber;
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        setTargetOrderNumber(ord.orderNumber);
                        setSelectedOrder(ord);
                        setCancelFeedback(null);
                        setSearchError("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#1a3b6b] text-white shadow-xs"
                          : "bg-white hover:bg-[#ede4d5] text-[#1a3b6b] border border-[#1a3b6b]/15"
                      }`}
                    >
                      <span>#{ord.orderNumber}</span>
                      <span
                        className={`size-1.5 rounded-full ${
                          ord.status === "cancelled"
                            ? "bg-rose-500"
                            : ord.status === "ready"
                              ? "bg-emerald-500"
                              : "bg-[#d99214]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback Toast */}
          {cancelFeedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in ${
                cancelFeedback.success
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {cancelFeedback.success ? (
                <CheckCircle2 className="size-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{cancelFeedback.message}</span>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 3. SELECTED ORDER STATUS VIEW */}
          {/* ===================================================================== */}
          {selectedOrder ? (
            <div className="space-y-4">
              {/* Order Header Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a3b6b]/10 pb-3">
                  <div>
                    <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064]">
                      Order Identification
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-display text-xl sm:text-2xl font-bold text-[#1a3b6b]">
                        #{selectedOrder.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[0.68rem] font-extrabold uppercase ${
                          selectedOrder.fulfilmentType === "pickup"
                            ? "bg-[#ede4d5] text-[#b87508]"
                            : "bg-[#1a3b6b]/10 text-[#1a3b6b]"
                        }`}
                      >
                        {selectedOrder.fulfilmentType === "pickup" ? "Pick Up" : "Delivery"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064]">
                      Placed At
                    </span>
                    <p className="text-xs font-bold text-[#191918] mt-0.5">
                      {selectedOrder.placedAt}
                    </p>
                  </div>
                </div>

                {/* =================================================================== */}
                {/* 4. 1-MINUTE CANCELLATION WIDGET */}
                {/* =================================================================== */}
                {selectedOrder.status !== "cancelled" && (
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      canCancel
                        ? "bg-[#fffbeb] border-[#fde68a] text-[#92400e]"
                        : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                            canCancel
                              ? "bg-[#f59e0b] text-white animate-pulse"
                              : "bg-[#94a3b8] text-white"
                          }`}
                        >
                          <Clock className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">
                              {canCancel
                                ? `1-Minute Grace Window: ${remainingSeconds}s remaining`
                                : "Cancellation Window Closed (1-min limit passed)"}
                            </span>
                            {canCancel && (
                              <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] font-extrabold bg-[#ef4444] text-white">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[0.72rem] mt-0.5 leading-snug">
                            {canCancel
                              ? "You can cancel your order directly within 1 minute of placing it."
                              : "Your order is now being actively prepared by our culinary team."}
                          </p>
                        </div>
                      </div>

                      {canCancel ? (
                        <button
                          type="button"
                          onClick={handleCustomerCancel}
                          disabled={isCancelling}
                          className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`tel:${site.phone.replace(/[^0-9]/g, "")}`}
                            className="py-1.5 px-2.5 rounded-lg bg-white border border-[#c9bba6] text-[#191918] hover:bg-[#ede4d5] text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Phone className="size-3 text-[#1a3b6b]" />
                            <span>Call Cafe</span>
                          </a>
                          <a
                            href={`https://wa.me/917814485357?text=${encodeURIComponent(
                              `Hello Beachwood Cafe, I have an urgent question regarding my order #${selectedOrder.orderNumber}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="size-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancelled Alert Banner */}
                {selectedOrder.status === "cancelled" && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                        <ShieldAlert className="size-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-rose-700 block">
                          Order Status: Cancelled
                        </span>
                        <p className="font-bold text-sm text-rose-950">
                          This order was cancelled by{" "}
                          {selectedOrder.cancelledBy === "customer"
                            ? "YOU (Customer) via online tracking"
                            : "Cafe Management"}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.cancellationReason && (
                      <p className="text-xs text-rose-800 bg-white/70 p-2 rounded-lg border border-rose-200/60">
                        <strong>Reason:</strong> {selectedOrder.cancellationReason}
                      </p>
                    )}
                    {selectedOrder.cancelledAt && (
                      <p className="text-[0.68rem] text-rose-600">
                        Cancelled at:{" "}
                        {new Date(selectedOrder.cancelledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* =================================================================== */}
                {/* 5. VISUAL PROGRESS STEPPER */}
                {/* =================================================================== */}
                {selectedOrder.status !== "cancelled" && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064]">
                        Preparation & Delivery Status
                      </span>
                      {isAdminUser ? (
                        <span className="text-[0.65rem] font-bold text-[#1a3b6b] bg-[#1a3b6b]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="size-3 text-[#d99214]" />
                          <span>Tap stage to update live (Admin)</span>
                        </span>
                      ) : (
                        <span className="text-[0.65rem] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                          <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                          </span>
                          <span>Live Real-Time Kitchen Sync</span>
                        </span>
                      )}
                    </div>

                    {statusFeedback && (
                      <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>{statusFeedback}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
                      {steps.map((st, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        const isUpdatingThis = statusUpdating === st.key;

                        const stepContent = (
                          <>
                            {isUpdatingThis ? (
                              <div className="size-5 mb-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div className="flex justify-center mb-1.5">
                                {isDone ? (
                                  <div
                                    className={`size-6 rounded-full flex items-center justify-center ${
                                      isCurrent ? "bg-[#d99214] text-[#191918]" : "bg-emerald-600 text-white"
                                    }`}
                                  >
                                    <Check className="size-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="size-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-[0.65rem] font-bold text-gray-500">
                                    {idx + 1}
                                  </div>
                                )}
                              </div>
                            )}

                            <span
                              className={`text-xs font-bold block ${
                                isCurrent ? "text-white" : "text-[#191918]"
                              }`}
                            >
                              {st.label}
                            </span>
                            <span
                              className={`text-[0.62rem] mt-0.5 block ${
                                isCurrent ? "text-white/80" : "text-[#767064]"
                              }`}
                            >
                              {st.desc}
                            </span>

                            {isCurrent && (
                              <span className="mt-1 px-1.5 py-0.2 rounded-full text-[0.58rem] font-black uppercase tracking-wider bg-[#d99214] text-[#191918]">
                                CURRENT
                              </span>
                            )}
                          </>
                        );

                        return isAdminUser ? (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => handleStatusChange(st.key as OrderStatus)}
                            title={`Click to set status to: ${st.label}`}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center relative select-none ${
                              isCurrent
                                ? "bg-[#1a3b6b] text-white border-[#1a3b6b] shadow-md ring-2 ring-[#d99214] scale-[1.02]"
                                : isDone
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/70"
                                  : "bg-white text-[#767064] border-[#c9bba6]/60 hover:border-[#1a3b6b] hover:bg-[#ede4d5]/30 hover:text-[#191918]"
                            }`}
                          >
                            {stepContent}
                          </button>
                        ) : (
                          <div
                            key={st.key}
                            title={`Status: ${st.label}`}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-default flex flex-col items-center justify-center relative select-none ${
                              isCurrent
                                ? "bg-[#1a3b6b] text-white border-[#1a3b6b] shadow-md ring-2 ring-[#d99214] scale-[1.02]"
                                : isDone
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                  : "bg-white text-[#767064] border-[#c9bba6]/60"
                            }`}
                          >
                            {stepContent}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary & Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fulfilment Info */}
                <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/15 text-xs space-y-2">
                  <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064] block">
                    Fulfilment Details
                  </span>
                  <div className="space-y-1 text-[#595347]">
                    <p>
                      <strong className="text-[#191918]">Customer:</strong>{" "}
                      {selectedOrder.customerName}
                    </p>
                    <p>
                      <strong className="text-[#191918]">Phone:</strong>{" "}
                      {selectedOrder.customerPhone}
                    </p>
                    <p>
                      <strong className="text-[#191918]">Destination:</strong>{" "}
                      {selectedOrder.fulfilmentType === "pickup"
                        ? site.address
                        : `${selectedOrder.deliveryAddress} ${
                            selectedOrder.deliveryApt
                              ? `(${selectedOrder.deliveryApt})`
                              : ""
                          }, ${selectedOrder.deliveryCity} ${selectedOrder.deliveryZip}`}
                    </p>
                    <p>
                      <strong className="text-[#191918]">Utensils:</strong>{" "}
                      {selectedOrder.includeUtensils ? "Included" : "None requested"}
                    </p>
                    {selectedOrder.orderNote && (
                      <p className="text-[#b87508] bg-[#fffbeb] p-1.5 rounded-lg border border-[#fde68a]">
                        <strong>Notes:</strong> {selectedOrder.orderNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items & Payment Info */}
                <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/15 text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#767064] block">
                      Ordered Dishes ({selectedOrder.items.length})
                    </span>
                    <div className="divide-y divide-[#1a3b6b]/10 max-h-28 overflow-y-auto mt-1">
                      {selectedOrder.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex justify-between text-[#595347]">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-semibold text-[#191918]">
                            ${it.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1a3b6b]/10 flex justify-between items-baseline">
                    <span className="text-[0.7rem] text-[#767064]">
                      Paid via:{" "}
                      {selectedOrder.paymentMethod === "prepay"
                        ? `Card (•••• ${selectedOrder.cardLast4 || "4242"})`
                        : "Counter"}
                    </span>
                    <span className="font-display text-base font-bold text-[#1a3b6b]">
                      Total: ${selectedOrder.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-dashed border-[#c9bba6] p-6">
              <ShoppingBag className="size-10 text-[#c9bba6] mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-[#191918]">No Active Order Selected</h3>
                <p className="text-xs text-[#767064] mt-1 max-w-sm mx-auto">
                  Enter your Order Number (e.g. BWC-12345) or the phone number you used during
                  checkout above to track or cancel your order.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 6. MODAL FOOTER */}
        {/* ===================================================================== */}
        <div className="bg-[#ede4d5]/60 border-t border-[#1a3b6b]/15 p-3 sm:p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#767064]">
            <span className="size-2 rounded-full bg-[#16a34a] animate-ping" />
            <span>Live updates connected</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedOrder && (
              <button
                type="button"
                onClick={() => {
                  printOrderReceipt({
                    orderId: selectedOrder.orderNumber,
                    placedAt: selectedOrder.placedAt,
                    name: selectedOrder.customerName,
                    phone: selectedOrder.customerPhone,
                    email: selectedOrder.customerEmail,
                    fulfilmentType: selectedOrder.fulfilmentType,
                    deliveryAddress: selectedOrder.deliveryAddress,
                    deliveryApt: selectedOrder.deliveryApt,
                    deliveryCity: selectedOrder.deliveryCity,
                    deliveryZip: selectedOrder.deliveryZip,
                    includeUtensils: selectedOrder.includeUtensils,
                    orderNote: selectedOrder.orderNote,
                    paymentMethod: selectedOrder.paymentMethod,
                    cardLast4: selectedOrder.cardLast4,
                    items: selectedOrder.items,
                    subtotal: selectedOrder.subtotal,
                    discountAmount: selectedOrder.discountAmount,
                    tax: selectedOrder.tax,
                    deliveryFee: selectedOrder.deliveryFee,
                    tipAmount: selectedOrder.tipAmount,
                    grandTotal: selectedOrder.grandTotal,
                  });
                }}
                className="py-1.5 px-3 rounded-xl bg-white border border-[#c9bba6] hover:bg-[#ede4d5] text-[#191918] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="size-3.5 text-[#d99214]" />
                <span>Print Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-outline-dark py-1.5 px-4 text-xs font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
