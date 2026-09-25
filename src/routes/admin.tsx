import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  ShoppingBag,
  Calendar,
  Users,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  ChevronDown,
  Store,
  Bike,
  Utensils,
  Printer,
  Smartphone,
  Monitor,
  Activity,
  ArrowRight,
  KeyRound,
  ExternalLink,
  Power,
  Radio,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Copy,
  Send,
} from "lucide-react";
import {
  adminStore,
  type AdminOrder,
  type AdminReservation,
  type OrderStatus,
  type ReservationStatus,
  type AdminNotification,
} from "../lib/admin-store";
import { site } from "../lib/site-content";
import { printKitchenTicket, printOrderReceipt } from "../lib/receipt-printer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal & Control Center | Beachwood Cafe" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type TabType = "overview" | "orders" | "reservations" | "visitors" | "whatsapp";

type ResWhatsAppTemplate =
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "reminder"
  | "custom";

// Helper: Clean phone number digits
function cleanPhoneDigits(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

// Helper: Format phone number for WhatsApp link
function formatWhatsAppTargetPhone(
  rawPhone: string,
  codeChoice: "auto" | "1" | "91" | "custom",
  customDigits?: string
): string {
  if (codeChoice === "custom" && customDigits) {
    return customDigits.replace(/[^0-9]/g, "");
  }

  const rawClean = rawPhone.replace(/[^0-9]/g, "");
  if (!rawClean) return "";

  if (rawPhone.trim().startsWith("+")) {
    return rawClean;
  }

  if (codeChoice === "1") {
    return rawClean.startsWith("1") ? rawClean : "1" + rawClean;
  }

  if (codeChoice === "91") {
    return rawClean.startsWith("91") ? rawClean : "91" + rawClean;
  }

  // Auto detect
  if (rawClean.length === 10) {
    // If starts with 7, 8, 9 (common mobile prefix)
    if (/^[7-9]/.test(rawClean)) {
      return "91" + rawClean;
    }
    // US area codes
    return "1" + rawClean;
  }

  return rawClean;
}

// Helper: Generate structured WhatsApp update message for reservations
function generateResWhatsAppMessage(
  res: AdminReservation,
  template: ResWhatsAppTemplate
): string {
  const cafeName = "Beachwood Cafe";
  const address = "2695 N Beachwood Dr, Los Angeles, CA 90068";
  const contact = "(323) 871-1717";

  switch (template) {
    case "confirmed":
      return `Hello ${res.fullName}! 🍽️

Greetings from ${cafeName}! Your table reservation has been CONFIRMED.

📋 Booking Ref: #${res.reservationNumber}
📅 Date: ${res.date}
⏰ Time: ${res.time}
👥 Party Size: ${res.partySize}
🪑 Seating Area: ${res.seating}
${res.specialRequests ? `📝 Special Notes: ${res.specialRequests}\n` : ""}📍 Location: ${address}
📞 Cafe Contact: ${contact}

If you need to make any changes or have questions, please reply directly to this chat or call us at ${contact}. We look forward to hosting you! ✨`;

    case "seated":
      return `Hello ${res.fullName}! 🍽️

Great news! Your table at ${cafeName} is now ready for your party of ${res.partySize} (${res.seating}).

📋 Booking Ref: #${res.reservationNumber}

Please check in with our front host desk when you arrive. We are excited to serve you! ✨`;

    case "reminder":
      return `Hello ${res.fullName}! 🍽️

This is a friendly reminder of your upcoming table reservation at ${cafeName}:

📋 Booking Ref: #${res.reservationNumber}
📅 Date: ${res.date}
⏰ Time: ${res.time}
👥 Party: ${res.partySize} · ${res.seating}
📍 Location: ${address}

See you soon! Reply to this WhatsApp message if you need directions or adjustments. ✨`;

    case "completed":
      return `Hello ${res.fullName}! 🌟

Thank you for dining with us today at ${cafeName}! We hope you and your party enjoyed your meal and experience.

We look forward to welcoming you back to Hollywood Hills soon! Have a wonderful day! ✨`;

    case "cancelled":
      return `Hello ${res.fullName},

This is an update that your table reservation #${res.reservationNumber} at ${cafeName} (${res.date} at ${res.time}) has been CANCELLED.

If this was done in error or you wish to re-book for another date, please feel free to message us here or call ${contact}.

Warm regards,
${cafeName} Team`;

    case "custom":
    default:
      return `Hello ${res.fullName}! Update from ${cafeName} regarding your table booking #${res.reservationNumber}: Your reservation status is currently ${res.status.toUpperCase()}.`;
  }
}

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Store data state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [visitorAnalytics, setVisitorAnalytics] = useState(adminStore.getVisitorAnalytics());
  const [whatsAppAnalytics, setWhatsAppAnalytics] = useState(adminStore.getWhatsAppAnalytics());

  // Site Operational Status (Maintenance / Kill Switch)
  const [maintenanceConfig, setMaintenanceConfig] = useState(() =>
    adminStore.getMaintenanceConfig()
  );
  const [customMaintenanceMsg, setCustomMaintenanceMsg] = useState(
    () => adminStore.getMaintenanceConfig().message
  );
  const [showEditMsg, setShowEditMsg] = useState<boolean>(false);

  // Search & Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [resStatusFilter, setResStatusFilter] = useState<string>("all");
  const [resSearch, setResSearch] = useState<string>("");

  // Modals & UI controls
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showAddResModal, setShowAddResModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>("");

  // Reservation WhatsApp update state
  const [whatsAppRes, setWhatsAppRes] = useState<AdminReservation | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<ResWhatsAppTemplate>("confirmed");
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>("");
  const [whatsAppCountryCode, setWhatsAppCountryCode] = useState<"auto" | "1" | "91" | "custom">("auto");
  const [whatsAppMessageText, setWhatsAppMessageText] = useState<string>("");
  const [sendWhatsAppOnSave, setSendWhatsAppOnSave] = useState<boolean>(true);
  const [statusUpdateToast, setStatusUpdateToast] = useState<{
    reservation: AdminReservation;
    status: ReservationStatus;
  } | null>(null);
  const [savedBookingBanner, setSavedBookingBanner] = useState<AdminReservation | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleOpenResWhatsApp = (
    res: AdminReservation,
    template: ResWhatsAppTemplate = "confirmed"
  ) => {
    setWhatsAppRes(res);
    const resolvedTemplate =
      template !== "custom"
        ? template
        : res.status === "seated"
          ? "seated"
          : res.status === "cancelled"
            ? "cancelled"
            : res.status === "completed"
              ? "completed"
              : "confirmed";
    setWhatsAppTemplate(resolvedTemplate);
    const digits = cleanPhoneDigits(res.phone);
    setWhatsAppPhone(digits);
    setWhatsAppCountryCode("auto");
    setWhatsAppMessageText(generateResWhatsAppMessage(res, resolvedTemplate));
    setIsCopied(false);
  };

  const handleSelectTemplate = (template: ResWhatsAppTemplate) => {
    setWhatsAppTemplate(template);
    if (whatsAppRes) {
      setWhatsAppMessageText(generateResWhatsAppMessage(whatsAppRes, template));
    }
  };

  // Settings Credentials state
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [settingsError, setSettingsError] = useState<string>("");

  // New manual reservation form state
  const [newResGuest, setNewResGuest] = useState("");
  const [newResPhone, setNewResPhone] = useState("");
  const [newResEmail, setNewResEmail] = useState("");
  const [newResParty, setNewResParty] = useState("2 guests");
  const [newResDate, setNewResDate] = useState("Today");
  const [newResTime, setNewResTime] = useState("7:00 PM");
  const [newResSeating, setNewResSeating] = useState("Indoor Booth");
  const [newResNotes, setNewResNotes] = useState("");

  // Real-time Notification System States
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveAlert, setLiveAlert] = useState<{
    id: string;
    type: "order" | "reservation" | "cancellation";
    title: string;
    message: string;
    refId: string;
    time: string;
    raw?: any;
  } | null>(null);

  // Play multi-tone restaurant kitchen chime via Web Audio API (No audio file required!)
  const playKitchenChime = (type: "order" | "reservation" | "cancellation" = "order") => {
    if (!adminStore.isSoundAlertEnabled() || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "order") {
        // High, joyful 3-tone restaurant chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
          gain.gain.setValueAtTime(0.28, ctx.currentTime + i * 0.13);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.13);
          osc.stop(ctx.currentTime + i * 0.13 + 0.65);
        });
      } else if (type === "reservation") {
        // Warm 2-tone dining chime (A4 -> C#5)
        const notes = [440, 554.37];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.75);
        });
      } else {
        // Alert tone for cancellation
        const notes = [587.33, 440];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.55);
        });
      }
    } catch (err) {
      console.warn("Kitchen chime could not be played:", err);
    }
  };

  // Flash browser tab title so admin notices even if working on another window
  const flashTabTitle = (alertText: string) => {
    if (typeof document === "undefined") return;
    let isAlert = true;
    const originalTitle = "Beachwood Cafe - Admin Portal";
    const interval = setInterval(() => {
      document.title = isAlert ? `🔔 ${alertText}` : originalTitle;
      isAlert = !isAlert;
    }, 1000);

    const stop = () => {
      clearInterval(interval);
      document.title = originalTitle;
      window.removeEventListener("focus", stop);
      window.removeEventListener("click", stop);
    };
    window.addEventListener("focus", stop);
    window.addEventListener("click", stop);
  };

  // Trigger HTML5 desktop notification if permitted
  const triggerDesktopNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body });
        } catch {}
      } else if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  // Check initial authentication
  useEffect(() => {
    const auth = adminStore.isAuthenticated();
    setIsAuthenticated(auth);
    if (auth) {
      loadData();
    }
  }, []);

  // Real-time synchronization for instant zero-delay updates (orders, cancellations, reservations)
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Order changes (New order, status change, cancellation)
    const handleOrderChange = (e: any) => {
      loadData();

      if (e?.detail?.action === "cancel") {
        playKitchenChime("cancellation");
        flashTabTitle(`ORDER CANCELLED (#${e.detail.orderNumber})`);

        const isCust = e.detail.by === "customer";
        const title = isCust
          ? `🚨 ORDER #${e.detail.orderNumber} CANCELLED BY CUSTOMER`
          : `Order #${e.detail.orderNumber} Cancelled`;
        const msg = isCust
          ? `Customer cancelled within 1-min window (${e.detail.elapsedSeconds || "a few"}s after placement)`
          : `Cancelled by staff/admin.`;

        showNotification(title);
        setLiveAlert({
          id: "alert_" + Date.now(),
          type: "cancellation",
          title,
          message: msg,
          refId: e.detail.orderNumber,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          raw: e.detail.order,
        });
      } else if (e?.detail?.action === "add") {
        playKitchenChime("order");
        flashTabTitle(`NEW ORDER #${e.detail.orderNumber}!`);
        triggerDesktopNotification(
          "Beachwood Cafe: New Online Order!",
          `Order #${e.detail.orderNumber} placed by ${e.detail.order?.customerName || "Customer"}`
        );

        const title = `🔔 NEW ONLINE ORDER #${e.detail.orderNumber}!`;
        const msg = `Customer: ${e.detail.order?.customerName} • $${e.detail.order?.grandTotal?.toFixed(2)} (${e.detail.order?.fulfilmentType?.toUpperCase()})`;

        showNotification(title);
        setLiveAlert({
          id: "alert_" + Date.now(),
          type: "order",
          title,
          message: msg,
          refId: e.detail.orderNumber,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          raw: e.detail.order,
        });
      }
    };

    // 2. Reservation changes (New table booking)
    const handleReservationChange = (e: any) => {
      loadData();

      if (e?.detail?.action === "add") {
        playKitchenChime("reservation");
        flashTabTitle(`NEW RESERVATION #${e.detail.reservationNumber}!`);
        triggerDesktopNotification(
          "Beachwood Cafe: New Table Booking!",
          `Table #${e.detail.reservationNumber} for ${e.detail.reservation?.fullName} (${e.detail.reservation?.partySize})`
        );

        const title = `📅 NEW TABLE RESERVATION #${e.detail.reservationNumber}!`;
        const msg = `Guest: ${e.detail.reservation?.fullName} • ${e.detail.reservation?.partySize} • ${e.detail.reservation?.date} at ${e.detail.reservation?.time}`;

        showNotification(title);
        setLiveAlert({
          id: "alert_" + Date.now(),
          type: "reservation",
          title,
          message: msg,
          refId: e.detail.reservationNumber,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          raw: e.detail.reservation,
        });
      }
    };

    // 3. Notification updates
    const handleNotificationAdded = (e: any) => {
      setNotifications(adminStore.getNotifications());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "bwc_admin_orders_v1" ||
        e.key === "bwc_site_maintenance_mode_v1" ||
        e.key === "bwc_admin_reservations_v1" ||
        e.key === "bwc_admin_notifications_v1"
      ) {
        loadData();
      }
    };

    window.addEventListener("bwc_order_change", handleOrderChange);
    window.addEventListener("bwc_reservation_change", handleReservationChange);
    window.addEventListener("bwc_notification_added", handleNotificationAdded);
    window.addEventListener("bwc_notification_updated", handleNotificationAdded);
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(loadData, 2500);

    return () => {
      window.removeEventListener("bwc_order_change", handleOrderChange);
      window.removeEventListener("bwc_reservation_change", handleReservationChange);
      window.removeEventListener("bwc_notification_added", handleNotificationAdded);
      window.removeEventListener("bwc_notification_updated", handleNotificationAdded);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, soundEnabled]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh data from storage and sync with server
  const loadData = () => {
    setOrders(adminStore.getOrders());
    setReservations(adminStore.getReservations());
    setVisitorAnalytics(adminStore.getVisitorAnalytics());
    setWhatsAppAnalytics(adminStore.getWhatsAppAnalytics());
    setNotifications(adminStore.getNotifications());
    setSoundEnabled(adminStore.isSoundAlertEnabled());
    const m = adminStore.getMaintenanceConfig();
    setMaintenanceConfig(m);
    setCustomMaintenanceMsg(m.message);

    // Background server sync for cross-device & mobile orders
    adminStore.syncWithServer().catch(() => {});
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await adminStore.syncWithServer();
      loadData();
      const totalChanges =
        res.syncedOrders + res.updatedOrders + res.syncedReservations + res.updatedReservations;
      if (totalChanges > 0) {
        showNotification(
          `🔄 Synced with cloud server: ${res.syncedOrders + res.updatedOrders} order(s), ${res.syncedReservations + res.updatedReservations} reservation(s).`
        );
      } else {
        showNotification("✅ Admin data is up to date with cloud server.");
      }
    } catch {
      showNotification("✅ Data synced.");
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 5000);
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    adminStore.setSoundAlertEnabled(next);
    if (next) {
      playKitchenChime("order");
      showNotification("🔔 Kitchen Sound Alerts ENABLED!");
    } else {
      showNotification("🔕 Sound Alerts MUTED.");
    }
  };

  const handleTestChime = () => {
    playKitchenChime("order");
    showNotification("🎶 Testing Restaurant Kitchen Chime (Ding-Dong)!");
  };

  const handleMarkAllRead = () => {
    adminStore.markNotificationsRead();
    setNotifications(adminStore.getNotifications());
  };

  const handleClearNotifications = () => {
    adminStore.clearNotifications();
    setNotifications([]);
    setShowNotifDropdown(false);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Toggle Website Online / Offline (Kill Switch)
  const handleToggleMaintenance = (newStatus?: boolean) => {
    const nextEnabled = newStatus !== undefined ? newStatus : !maintenanceConfig.enabled;
    const updated = adminStore.setMaintenanceMode(nextEnabled, customMaintenanceMsg);
    setMaintenanceConfig(updated);
    if (nextEnabled) {
      showNotification(
        "⛔ Website is now PAUSED (Maintenance Mode). Visitors cannot access the site."
      );
    } else {
      showNotification(
        "✅ Website is now LIVE & ACTIVE! Normal visitors can browse, order, and book."
      );
    }
  };

  const handleSaveMaintenanceMsg = () => {
    const updated = adminStore.setMaintenanceMode(
      maintenanceConfig.enabled,
      customMaintenanceMsg
    );
    setMaintenanceConfig(updated);
    setShowEditMsg(false);
    showNotification("Custom maintenance announcement saved!");
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    setTimeout(() => {
      const ok = adminStore.login(usernameInput, passwordInput);
      if (ok) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError("Invalid username or password. Please check your credentials.");
      }
      setIsLoggingIn(false);
    }, 400);
  };

  const handleLogout = () => {
    adminStore.logout();
    setIsAuthenticated(false);
    setUsernameInput("");
    setPasswordInput("");
  };

  // Seed sample demo data
  const handleSeedData = () => {
    adminStore.seedSampleData();
    loadData();
    showNotification("Realistic sample orders, bookings & WhatsApp logs loaded successfully!");
  };

  // Clear all data
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all orders, reservations and logs?")) {
      adminStore.clearAllData();
      loadData();
      showNotification("All store data has been reset.");
    }
  };

  // Order status update
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus, orderNumber?: string) => {
    adminStore.updateOrderStatus(orderId, status, orderNumber);
    loadData();
    showNotification(`Order status updated to "${status.toUpperCase()}"`);
    if (
      selectedOrder &&
      (selectedOrder.id === orderId ||
        (orderNumber && selectedOrder.orderNumber === orderNumber) ||
        selectedOrder.orderNumber.replace(/^#/, "") === (orderNumber || orderId).replace(/^#/, ""))
    ) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  // Delete Order
  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("Permanently delete this order record?")) {
      adminStore.deleteOrder(orderId);
      loadData();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      showNotification("Order record deleted.");
    }
  };

  // Reservation status update
  const handleUpdateResStatus = (resId: string, status: ReservationStatus) => {
    adminStore.updateReservationStatus(resId, status);
    loadData();
    const matched = reservations.find((r) => r.id === resId || r.reservationNumber === resId);
    if (matched) {
      const updated = { ...matched, status };
      setStatusUpdateToast({
        reservation: updated,
        status,
      });
    }
    showNotification(`Reservation status updated to "${status.toUpperCase()}"`);
  };

  // Delete Reservation
  const handleDeleteRes = (resId: string) => {
    if (window.confirm("Permanently delete this reservation record?")) {
      adminStore.deleteReservation(resId);
      loadData();
      showNotification("Reservation record deleted.");
    }
  };

  // Add manual reservation
  const handleAddManualRes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResGuest.trim() || !newResPhone.trim()) {
      alert("Please provide at least Guest Name and Phone Number.");
      return;
    }

    const newRes = adminStore.addReservation({
      fullName: newResGuest.trim(),
      phone: newResPhone.trim(),
      email: newResEmail.trim() || "walkin@beachwood.la",
      partySize: newResParty,
      date: newResDate,
      time: newResTime,
      seating: newResSeating,
      specialRequests: newResNotes.trim() || undefined,
      createdAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    loadData();
    setShowAddResModal(false);
    setNewResGuest("");
    setNewResPhone("");
    setNewResEmail("");
    setNewResNotes("");
    showNotification("New table reservation created successfully!");

    if (sendWhatsAppOnSave) {
      handleOpenResWhatsApp(newRes, "confirmed");
    } else {
      setSavedBookingBanner(newRes);
    }
  };

  // Update Admin Credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");

    if (!newUsername.trim()) {
      setSettingsError("Username cannot be empty.");
      return;
    }
    if (newPassword.length < 8) {
      setSettingsError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsError("Passwords do not match.");
      return;
    }

    const ok = adminStore.updateCredentials(newUsername, newPassword);
    if (ok) {
      setShowSettingsModal(false);
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("Admin credentials updated successfully!");
    } else {
      setSettingsError("Failed to update credentials.");
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const q = orderSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchStatus = resStatusFilter === "all" || r.status === resStatusFilter;
      const q = resSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.reservationNumber.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.email.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [reservations, resStatusFilter, resSearch]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.grandTotal : sum), 0);
  }, [orders]);

  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const inKitchenCount = orders.filter((o) => o.status === "kitchen").length;
  const readyOrdersCount = orders.filter((o) => o.status === "ready").length;

  const totalGuestsBooked = useMemo(() => {
    return reservations.reduce((sum, r) => {
      const num = parseInt(r.partySize.replace(/[^0-9]/g, ""), 10) || 2;
      return sum + num;
    }, 0);
  }, [reservations]);

  // ==========================================================================
  // VIEW A: SECURE LOGIN SCREEN (IF NOT AUTHENTICATED)
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#141d2b] flex items-center justify-center p-4 selection:bg-[#d99214] selection:text-[#191918]">
        {/* Background decorative styling */}
        <div className="absolute inset-0 bg-[radial-gradient(#1a3b6b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        <div className="w-full max-w-md bg-[#ede4d5] rounded-2xl shadow-2xl border-2 border-[#d99214]/50 p-6 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#1a3b6b] text-[#d99214] flex items-center justify-center mx-auto shadow-md border border-[#d99214]/40">
              <Lock className="size-7" />
            </div>
            <div>
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.25em] text-[#d99214]">
                BEACHWOOD CAFE • HOLLYWOOD
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a3b6b] mt-0.5">
                Staff & Admin Portal
              </h1>
              <p className="text-xs text-[#595347] mt-1">
                Restricted access for cafe management & kitchen operations
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mt-4 p-3 rounded-xl bg-[#fee2e2] border border-[#ef4444]/40 text-[#b91c1c] text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-bold text-[#191918] mb-1 uppercase tracking-wider"
              >
                Admin Username
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full p-3 text-xs rounded-xl bg-white border border-[#c9bba6] focus:outline-none focus:border-[#1a3b6b] focus:ring-2 focus:ring-[#1a3b6b]/20 text-[#191918]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-[#191918] mb-1 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-3 pr-10 text-xs rounded-xl bg-white border border-[#c9bba6] focus:outline-none focus:border-[#1a3b6b] focus:ring-2 focus:ring-[#1a3b6b]/20 text-[#191918]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767064] hover:text-[#191918] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1a3b6b] hover:bg-[#132c52] text-white text-xs font-extrabold uppercase tracking-wider shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75"
            >
              {isLoggingIn ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4 text-[#d99214]" />
                  <span>Sign In to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1a3b6b]/15 text-center">
            <a
              href="/"
              className="text-xs text-[#1a3b6b] hover:underline font-semibold inline-flex items-center gap-1.5"
            >
              <span>Return to Beachwood Cafe Website</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW B: AUTHENTICATED ADMIN CONSOLE
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#191918] flex flex-col font-sans selection:bg-[#d99214] selection:text-[#191918]">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. TOP ADMIN CONTROL BAR */}
      {/* ---------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#1a3b6b] text-white border-b-2 border-[#d99214] shadow-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#d99214] text-[#191918] font-black text-xs shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wide uppercase text-white">
                  Beachwood Cafe
                </span>
                <span className="px-2 py-0.5 rounded text-[0.62rem] font-extrabold uppercase tracking-wider bg-[#d99214] text-[#191918]">
                  Admin Console
                </span>
              </div>
              <p className="text-[0.68rem] text-[#ede4d5]/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                <span>Live System Active • Hollywood Hills, CA</span>
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Site Status Toggle Switch (ON / OFF Kill Switch) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/25 border border-white/15 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2.5 rounded-full ${
                    !maintenanceConfig.enabled
                      ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
                      : "bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-ping"
                  }`}
                />
                <span className="text-[0.7rem] font-black text-white uppercase tracking-wider hidden sm:inline">
                  {!maintenanceConfig.enabled ? "Site: LIVE (ON)" : "Site: PAUSED (OFF)"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleMaintenance()}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !maintenanceConfig.enabled ? "bg-[#16a34a]" : "bg-[#ef4444]"
                }`}
                title={
                  !maintenanceConfig.enabled
                    ? "Site is currently LIVE. Click to turn OFF (Maintenance Mode)"
                    : "Site is currently PAUSED. Click to turn ON (Resume Site)"
                }
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    !maintenanceConfig.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Cloud Server Real-Time Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-white transition-all cursor-pointer shadow-xs disabled:opacity-75"
              title="Sync latest online orders & table bookings from server"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin text-[#d99214]" : "text-emerald-400"}`} />
              <span className="hidden md:inline">{isSyncing ? "Syncing..." : "Sync Server"}</span>
            </button>

            {/* Kitchen Sound Alert Toggle & Test Chime */}
            <div className="flex items-center gap-1 bg-white/10 hover:bg-white/15 px-2 py-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  soundEnabled ? "text-emerald-400" : "text-gray-400"
                }`}
                title={soundEnabled ? "Sound Alerts: ON (Click to Mute)" : "Sound Alerts: MUTED (Click to Enable)"}
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                <span className="hidden xl:inline">{soundEnabled ? "Sound ON" : "Muted"}</span>
              </button>
              {soundEnabled && (
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="text-[0.62rem] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                  title="Play test kitchen chime"
                >
                  Test
                </button>
              )}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                  unreadCount > 0
                    ? "bg-[#d99214] text-[#191918] shadow-md hover:bg-[#e5a024]"
                    : "bg-white/10 hover:bg-white/20 text-[#ede4d5]"
                }`}
                title="Incoming Orders & Reservations Notifications"
              >
                {unreadCount > 0 ? (
                  <BellRing className="size-4.5 animate-bounce" />
                ) : (
                  <Bell className="size-4.5" />
                )}

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-600 text-white text-[0.65rem] font-black flex items-center justify-center shadow-xs border-2 border-[#1a3b6b]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifDropdown && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#1a3b6b]/20 shadow-2xl z-50 text-[#191918] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Dropdown Header */}
                  <div className="p-3.5 bg-[#1a3b6b] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-[#d99214]" />
                      <span className="font-bold text-xs">
                        Activity Notifications ({notifications.length})
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] font-bold bg-rose-500 text-white">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[0.68rem]">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[#d99214] hover:underline font-bold cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          className="text-white/70 hover:text-white font-bold ml-1 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#1a3b6b]/10 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#767064]">
                        No recent notifications. New orders and table bookings will appear here in real time!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.type === "order" || n.type === "cancellation") {
                              setActiveTab("orders");
                              const match = orders.find((o) => o.orderNumber === n.referenceId);
                              if (match) setSelectedOrder(match);
                            } else if (n.type === "reservation") {
                              setActiveTab("reservations");
                            }
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-[#ede4d5]/50 ${
                            !n.read ? "bg-amber-50/60 font-semibold" : "bg-white"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                              n.type === "order"
                                ? "bg-[#1a3b6b]"
                                : n.type === "reservation"
                                  ? "bg-[#d99214] text-[#191918]"
                                  : "bg-rose-600"
                            }`}
                          >
                            {n.type === "order" ? (
                              <ShoppingBag className="size-3.5" />
                            ) : n.type === "reservation" ? (
                              <Calendar className="size-3.5" />
                            ) : (
                              <AlertTriangle className="size-3.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#191918] truncate block">
                                {n.title}
                              </span>
                              <span className="text-[0.62rem] text-[#767064] shrink-0">
                                {n.timeFormatted}
                              </span>
                            </div>
                            <p className="text-[0.72rem] text-[#595347] line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSeedData}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#ede4d5] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Populate realistic demo orders, bookings and WhatsApp logs"
            >
              <Sparkles className="size-3.5 text-[#d99214]" />
              <span className="hidden md:inline">Sample Data</span>
            </button>

            <button
              onClick={loadData}
              className="p-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#ede4d5] transition-colors cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className="size-4" />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#ede4d5] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change admin username and password"
            >
              <KeyRound className="size-3.5 text-[#d99214]" />
              <span className="hidden sm:inline">Security</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#ede4d5] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open public website in new tab"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">View Live Site</span>
            </a>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Sign out of Admin"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Emergency / Real-Time Alert Banner for Incoming Orders & Bookings */}
      {liveAlert && (
        <div className="sticky top-[60px] z-50 bg-[#1a3b6b] text-white p-3.5 sm:p-4 shadow-xl border-b-2 border-[#d99214] flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl font-bold text-white shrink-0 ${
                liveAlert.type === "order"
                  ? "bg-[#16a34a] animate-bounce"
                  : liveAlert.type === "reservation"
                    ? "bg-[#d99214] text-[#191918] animate-bounce"
                    : "bg-rose-600 animate-pulse"
              }`}
            >
              <BellRing className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base tracking-wide text-white">
                  {liveAlert.title}
                </span>
                <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-extrabold bg-[#d99214] text-[#191918]">
                  JUST NOW ({liveAlert.time})
                </span>
              </div>
              <p className="text-xs text-[#ede4d5]/90 mt-0.5">{liveAlert.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {liveAlert.type === "order" && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("orders");
                  const match = orders.find((o) => o.orderNumber === liveAlert.refId);
                  if (match) setSelectedOrder(match);
                  setLiveAlert(null);
                }}
                className="btn-olive py-1.5 px-3 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                Open Order Ticket
              </button>
            )}

            {liveAlert.type === "reservation" && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("reservations");
                  setLiveAlert(null);
                }}
                className="btn-olive py-1.5 px-3 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                View Bookings
              </button>
            )}

            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Notification Toast */}
      {actionSuccessMsg && (
        <div className="bg-[#16a34a] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* -------------------------------------------------------------------- */}
        {/* 2. TOP METRIC / KPI CARDS */}
        {/* -------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Revenue & Orders */}
          <div
            onClick={() => setActiveTab("orders")}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm hover:border-[#1a3b6b] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#595347]">
              <span className="text-xs font-extrabold uppercase tracking-wider">Online Orders</span>
              <div className="p-2 rounded-xl bg-[#1a3b6b]/10 text-[#1a3b6b] group-hover:bg-[#1a3b6b] group-hover:text-white transition-colors">
                <ShoppingBag className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-[#1a3b6b]">
                ${totalRevenue.toFixed(2)}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="font-bold text-[#191918]">{orders.length} orders total</span>
                {pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[0.62rem] font-bold bg-[#d99214] text-[#191918]">
                    {pendingOrdersCount} new
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Reservations */}
          <div
            onClick={() => setActiveTab("reservations")}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm hover:border-[#1a3b6b] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#595347]">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Table Bookings
              </span>
              <div className="p-2 rounded-xl bg-[#d99214]/15 text-[#b87508] group-hover:bg-[#d99214] group-hover:text-[#191918] transition-colors">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-[#191918]">
                {reservations.length}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#595347]">
                <Users className="size-3.5 text-[#d99214]" />
                <span className="font-bold text-[#191918]">{totalGuestsBooked} guests booked</span>
              </div>
            </div>
          </div>

          {/* Card 3: Website Traffic Viewers */}
          <div
            onClick={() => setActiveTab("visitors")}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm hover:border-[#1a3b6b] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#595347]">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Website Visitors
              </span>
              <div className="p-2 rounded-xl bg-[#2e7d32]/10 text-[#2e7d32] group-hover:bg-[#2e7d32] group-hover:text-white transition-colors">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-[#2e7d32]">
                {visitorAnalytics.totalViews}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#595347]">
                <span className="font-bold text-[#191918]">
                  {visitorAnalytics.uniqueVisitors} unique visitors
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: WhatsApp Leads */}
          <div
            onClick={() => setActiveTab("whatsapp")}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm hover:border-[#1a3b6b] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#595347]">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                WhatsApp Clicks
              </span>
              <div className="p-2 rounded-xl bg-[#16a34a]/10 text-[#16a34a] group-hover:bg-[#16a34a] group-hover:text-white transition-colors">
                <MessageCircle className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-[#16a34a]">
                {whatsAppAnalytics.totalClicks}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#595347]">
                <span className="font-bold text-[#191918]">
                  {Object.keys(whatsAppAnalytics.sourceCounts).length} click sources
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* 3. NAVIGATION TAB BAR */}
        {/* -------------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a3b6b]/15 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "overview"
                  ? "bg-[#1a3b6b] text-white shadow-sm"
                  : "bg-white/70 hover:bg-white text-[#595347]"
              }`}
            >
              <Activity className="size-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "orders"
                  ? "bg-[#1a3b6b] text-white shadow-sm"
                  : "bg-white/70 hover:bg-white text-[#595347]"
              }`}
            >
              <ShoppingBag className="size-3.5" />
              <span>Online Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] font-bold bg-[#d99214] text-[#191918]">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "reservations"
                  ? "bg-[#1a3b6b] text-white shadow-sm"
                  : "bg-white/70 hover:bg-white text-[#595347]"
              }`}
            >
              <Calendar className="size-3.5" />
              <span>Table Bookings ({reservations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("visitors")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "visitors"
                  ? "bg-[#1a3b6b] text-white shadow-sm"
                  : "bg-white/70 hover:bg-white text-[#595347]"
              }`}
            >
              <Users className="size-3.5" />
              <span>Traffic & Viewers</span>
            </button>

            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "whatsapp"
                  ? "bg-[#1a3b6b] text-white shadow-sm"
                  : "bg-white/70 hover:bg-white text-[#595347]"
              }`}
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp Clicks ({whatsAppAnalytics.totalClicks})</span>
            </button>
          </div>

          {/* Export & Reset Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => adminStore.exportOrdersToCSV()}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#1a3b6b]/20 hover:bg-[#ede4d5] text-xs font-bold text-[#1a3b6b] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download Orders CSV Spreadsheet"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export Orders</span>
            </button>

            <button
              onClick={() => adminStore.exportReservationsToCSV()}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#1a3b6b]/20 hover:bg-[#ede4d5] text-xs font-bold text-[#1a3b6b] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download Reservations CSV Spreadsheet"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export Bookings</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="p-2 rounded-lg bg-white border border-[#b91c1c]/30 hover:bg-[#fee2e2] text-[#b91c1c] text-xs cursor-pointer shadow-2xs"
              title="Clear all stored data"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ==================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Prominent Site Status Control Card (ON / OFF Kill Switch) */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border-2 transition-all shadow-sm ${
                !maintenanceConfig.enabled
                  ? "bg-white border-[#16a34a]/30"
                  : "bg-[#fef2f2] border-[#ef4444]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl text-white font-bold shrink-0 ${
                      !maintenanceConfig.enabled ? "bg-[#16a34a]" : "bg-[#ef4444]"
                    }`}
                  >
                    <Power className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg sm:text-xl font-bold text-[#191918]">
                        {!maintenanceConfig.enabled
                          ? "Website is ONLINE & Active (ON)"
                          : "Website is PAUSED / Under Maintenance (OFF)"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider ${
                          !maintenanceConfig.enabled
                            ? "bg-[#16a34a]/15 text-[#16a34a]"
                            : "bg-[#ef4444]/15 text-[#ef4444]"
                        }`}
                      >
                        {!maintenanceConfig.enabled ? "Accepting Orders" : "Closed for Visitors"}
                      </span>
                    </div>
                    <p className="text-xs text-[#595347] mt-1 leading-relaxed max-w-2xl">
                      {!maintenanceConfig.enabled
                        ? "The public site is live and fully working. Visitors can browse menus, add items to cart, order online, and reserve tables normally."
                        : "The public site is currently paused. When visitors open the site, they will see an elegant 'Under Maintenance / Kitchen Temporarily Paused' screen with direct contact links. The Admin Panel remains always accessible to you."}
                    </p>
                  </div>
                </div>

                {/* Big ON / OFF Toggle Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!maintenanceConfig.enabled ? (
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(true)}
                      className="py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white bg-[#ef4444] hover:bg-[#dc2626] shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Power className="size-4" />
                      <span>Pause Website (Turn OFF)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(false)}
                      className="py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white bg-[#16a34a] hover:bg-[#15803d] shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Check className="size-4" />
                      <span>Resume Website (Turn ON)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowEditMsg(!showEditMsg)}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#ede4d5] hover:bg-[#dfd2be] text-[#1a3b6b] transition-colors cursor-pointer"
                    title="Customize maintenance screen announcement"
                  >
                    Custom Notice
                  </button>
                </div>
              </div>

              {/* Collapsible Custom Announcement Editor */}
              {showEditMsg && (
                <div className="mt-4 pt-4 border-t border-[#1a3b6b]/15 space-y-2 text-xs animate-in fade-in">
                  <label className="block font-bold text-[#191918]">
                    Public Maintenance Announcement Text:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMaintenanceMsg}
                      onChange={(e) => setCustomMaintenanceMsg(e.target.value)}
                      placeholder="e.g. We are closed today for a private catering event. Back tomorrow at 8am!"
                      className="flex-1 p-2.5 rounded-lg border border-[#c9bba6] text-[#191918] bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveMaintenanceMsg}
                      className="btn-olive py-2 px-4 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Save Notice
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Tickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#1a3b6b]">
                    Kitchen Orders Pipeline
                  </h3>
                  <ShoppingBag className="size-4 text-[#d99214]" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#ede4d5]/50 border border-[#c9bba6]">
                    <span className="block font-bold text-lg text-[#b87508]">
                      {pendingOrdersCount}
                    </span>
                    <span className="text-[0.68rem] text-[#595347]">Pending</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a3b6b]/10 border border-[#1a3b6b]/30">
                    <span className="block font-bold text-lg text-[#1a3b6b]">
                      {inKitchenCount}
                    </span>
                    <span className="text-[0.68rem] text-[#1a3b6b]">In Kitchen</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#16a34a]/10 border border-[#16a34a]/30">
                    <span className="block font-bold text-lg text-[#16a34a]">
                      {readyOrdersCount}
                    </span>
                    <span className="text-[0.68rem] text-[#16a34a]">Ready</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="w-full py-2 rounded-xl text-xs font-bold text-[#1a3b6b] bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Manage All Orders</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#1a3b6b]">
                    Recent Table Requests
                  </h3>
                  <Calendar className="size-4 text-[#1a3b6b]" />
                </div>
                <div className="space-y-2">
                  {reservations.slice(0, 2).map((res) => (
                    <div
                      key={res.id}
                      className="p-2.5 rounded-xl bg-[#fdfbf7] border border-[#c9bba6]/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#191918]">{res.fullName}</p>
                        <p className="text-[0.7rem] text-[#767064]">
                          {res.partySize} • {res.date}, {res.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {res.status}
                        </span>
                        <a
                          href={`tel:${res.phone}`}
                          className="p-1 rounded bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 text-[#1a3b6b]"
                          title="Call Guest"
                        >
                          <Phone className="size-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenResWhatsApp(res, "confirmed")}
                          className="p-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] hover:text-[#075E54] cursor-pointer"
                          title="Send WhatsApp Update"
                        >
                          <MessageCircle className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <p className="text-xs text-[#767064] italic py-2">No bookings recorded yet.</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("reservations")}
                  className="w-full py-2 rounded-xl text-xs font-bold text-[#1a3b6b] bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View Table Bookings</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#1a3b6b]">
                    Traffic & Lead Highlights
                  </h3>
                  <Activity className="size-4 text-[#16a34a]" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-[#ede4d5]/40">
                    <span className="text-[#595347]">Total Views Recorded:</span>
                    <strong className="text-[#191918]">{visitorAnalytics.totalViews} views</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#ede4d5]/40">
                    <span className="text-[#595347]">Unique Visitors:</span>
                    <strong className="text-[#191918]">
                      {visitorAnalytics.uniqueVisitors} visitors
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#16a34a]/10">
                    <span className="text-[#16a34a] font-bold">WhatsApp Inquiries:</span>
                    <strong className="text-[#16a34a] font-bold">
                      {whatsAppAnalytics.totalClicks} clicks
                    </strong>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("visitors")}
                  className="w-full py-2 rounded-xl text-xs font-bold text-[#1a3b6b] bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Detailed Visitor Analytics</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Orders List in Overview */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1a3b6b]">
                    Latest Incoming Orders
                  </h3>
                  <p className="text-xs text-[#595347]">Real-time customer order stream</p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="btn-olive py-1.5 px-3 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Open Orders Manager
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#767064]">
                  No orders placed yet. Place an order on the menu or click "Load Sample Data" above!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1a3b6b]/15 text-[#767064] font-bold uppercase tracking-wider text-[0.68rem]">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3b6b]/10">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#fdfbf7] transition-colors">
                          <td className="py-3 font-bold text-[#1a3b6b]">#{ord.orderNumber}</td>
                          <td className="py-3">
                            <span className="font-bold text-[#191918] block">{ord.customerName}</span>
                            <span className="text-[0.7rem] text-[#767064]">{ord.customerPhone}</span>
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#595347] capitalize">
                              {ord.fulfilmentType === "pickup" ? (
                                <Store className="size-3 text-[#d99214]" />
                              ) : (
                                <Bike className="size-3 text-[#1a3b6b]" />
                              )}
                              <span>{ord.fulfilmentType}</span>
                            </span>
                          </td>
                          <td className="py-3 text-[#595347]">
                            {ord.items.reduce((s, i) => s + i.quantity, 0)} dishes
                          </td>
                          <td className="py-3 font-bold text-[#191918]">
                            ${ord.grandTotal.toFixed(2)}
                          </td>
                          <td className="py-3">
                            {ord.status === "cancelled" ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[0.62rem] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 block text-center">
                                  Cancelled
                                </span>
                                <span className="text-[0.62rem] font-bold text-rose-600 block text-center whitespace-nowrap">
                                  {ord.cancelledBy === "customer" ? "By Customer (1-min)" : "By Staff"}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[0.62rem] font-extrabold uppercase tracking-wider ${
                                  ord.status === "pending"
                                    ? "bg-[#d99214]/20 text-[#b87508]"
                                    : ord.status === "kitchen"
                                      ? "bg-[#1a3b6b]/15 text-[#1a3b6b]"
                                      : ord.status === "ready"
                                        ? "bg-[#16a34a]/15 text-[#16a34a]"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {ord.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 text-[#1a3b6b] cursor-pointer"
                            >
                              View Ticket
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: ONLINE ORDERS MANAGER */}
        {/* ==================================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Controls Bar */}
            <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(["all", "pending", "kitchen", "ready", "completed", "cancelled"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? "bg-[#1a3b6b] text-white shadow-xs"
                          : "bg-[#ede4d5]/50 text-[#595347] hover:bg-[#ede4d5]"
                      }`}
                    >
                      {st === "all" ? "All Orders" : st}
                    </button>
                  )
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#767064]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search name, phone, order #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#c9bba6] focus:outline-none focus:border-[#1a3b6b] text-[#191918]"
                />
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-[#c9bba6] p-8 space-y-3">
                <ShoppingBag className="size-10 text-[#d99214] mx-auto" />
                <h3 className="font-display text-xl font-bold text-[#1a3b6b]">No orders found</h3>
                <p className="text-xs text-[#595347] max-w-sm mx-auto">
                  No orders match your selected filters. You can place an order from the menu or click
                  "Load Sample Data" to preview live orders.
                </p>
                <button
                  onClick={handleSeedData}
                  className="btn-olive py-2 px-4 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  <span>Load Sample Orders</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm hover:border-[#1a3b6b]/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Header: Order #, Time, Status */}
                      <div className="flex items-start justify-between pb-3 border-b border-[#1a3b6b]/10">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-base text-[#1a3b6b]">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase ${
                                ord.fulfilmentType === "pickup"
                                  ? "bg-[#ede4d5] text-[#b87508]"
                                  : "bg-[#1a3b6b]/10 text-[#1a3b6b]"
                              }`}
                            >
                              {ord.fulfilmentType}
                            </span>
                          </div>
                          <span className="text-[0.68rem] text-[#767064] block mt-0.5">
                            {ord.placedAt}
                          </span>
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus, ord.orderNumber)
                          }
                          className={`text-xs font-extrabold uppercase rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                            ord.status === "pending"
                              ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                              : ord.status === "kitchen"
                                ? "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]"
                                : ord.status === "ready"
                                  ? "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]"
                                  : ord.status === "completed"
                                    ? "bg-gray-100 text-gray-700 border-gray-300"
                                    : "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="kitchen">In Kitchen</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Customer Info */}
                      <div className="pt-3 space-y-1 text-xs">
                        <p className="font-bold text-[#191918]">{ord.customerName}</p>
                        <p className="text-[#595347] flex items-center gap-1.5">
                          <Phone className="size-3 text-[#1a3b6b]" />
                          <span>{ord.customerPhone}</span>
                        </p>
                        <p className="text-[#767064] truncate">{ord.customerEmail}</p>
                        {ord.fulfilmentType === "delivery" && ord.deliveryAddress && (
                          <p className="text-[#1a3b6b] flex items-start gap-1 font-medium pt-1">
                            <MapPin className="size-3 shrink-0 mt-0.5 text-[#d99214]" />
                            <span>
                              {ord.deliveryAddress}{" "}
                              {ord.deliveryApt ? `(${ord.deliveryApt})` : ""},{" "}
                              {ord.deliveryCity} {ord.deliveryZip}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Special Order Notes or Allergy */}
                      {ord.orderNote && (
                        <div className="mt-2.5 p-2 rounded-lg bg-[#fef7e6] border border-[#f5deaa] text-[0.72rem] text-[#b87508]">
                          <strong>Note:</strong> {ord.orderNote}
                        </div>
                      )}

                      {/* Cancellation Attribution Banner */}
                      {ord.status === "cancelled" && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <AlertTriangle className="size-3.5 text-rose-600 shrink-0" />
                            <span>
                              Cancelled by:{" "}
                              <strong className="text-rose-950 font-extrabold underline decoration-rose-300">
                                {ord.cancelledBy === "customer"
                                  ? "CUSTOMER (Online Tracking Portal)"
                                  : "STAFF / ADMIN"}
                              </strong>
                            </span>
                          </div>
                          {ord.cancellationReason && (
                            <p className="text-[0.68rem] text-rose-800 leading-tight">
                              {ord.cancellationReason}
                            </p>
                          )}
                          {ord.cancelledAt && (
                            <p className="text-[0.65rem] text-rose-600">
                              Cancelled at:{" "}
                              {new Date(ord.cancelledAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                              {ord.timestamp && (
                                <span>
                                  {" "}
                                  ({Math.max(1, Math.round((ord.cancelledAt - ord.timestamp) / 1000))}s after placement)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Items Summary */}
                      <div className="mt-3 pt-2.5 border-t border-[#1a3b6b]/10 space-y-1 text-xs">
                        <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#767064]">
                          Dishes ({ord.items.reduce((s, i) => s + i.quantity, 0)})
                        </span>
                        {ord.items.map((it, idx) => (
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
                    </div>

                    {/* Footer: Grand Total & Actions */}
                    <div className="pt-3 border-t border-[#1a3b6b]/15 space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-[#767064]">
                          {ord.paymentMethod === "prepay" ? "Prepaid (Card)" : "Pay at counter"}
                        </span>
                        <span className="font-display text-lg font-bold text-[#1a3b6b]">
                          ${ord.grandTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="py-1.5 px-2 rounded-lg bg-[#ede4d5] hover:bg-[#dfd2be] text-xs font-bold text-[#1a3b6b] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="size-3" />
                          <span>Ticket</span>
                        </button>

                        <a
                          href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hello ${ord.customerName}! Beachwood Cafe update regarding your order #${ord.orderNumber}: Your order status is now ${ord.status.toUpperCase()}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2 rounded-lg bg-[#16a34a]/15 hover:bg-[#16a34a]/25 text-[#16a34a] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="size-3" />
                          <span>Chat</span>
                        </a>

                        <button
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="py-1.5 px-2 rounded-lg bg-white border border-[#b91c1c]/30 hover:bg-[#fee2e2] text-[#b91c1c] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                          <span>Del</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TABLE RESERVATIONS MANAGER */}
        {/* ==================================================================== */}
        {activeTab === "reservations" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Bar & Add Walk-in button */}
            <div className="p-4 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(["all", "confirmed", "seated", "completed", "cancelled"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setResStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      resStatusFilter === st
                        ? "bg-[#1a3b6b] text-white shadow-xs"
                        : "bg-[#ede4d5]/50 text-[#595347] hover:bg-[#ede4d5]"
                    }`}
                  >
                    {st === "all" ? "All Bookings" : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#767064]" />
                  <input
                    type="text"
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    placeholder="Search guest name or phone..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#c9bba6] focus:outline-none focus:border-[#1a3b6b] text-[#191918]"
                  />
                </div>

                <button
                  onClick={() => setShowAddResModal(true)}
                  className="btn-olive py-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>New Booking</span>
                </button>
              </div>
            </div>

            {/* Reservations Table */}
            {filteredReservations.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-[#c9bba6] p-8 space-y-3">
                <Calendar className="size-10 text-[#d99214] mx-auto" />
                <h3 className="font-display text-xl font-bold text-[#1a3b6b]">
                  No table reservations found
                </h3>
                <p className="text-xs text-[#595347] max-w-sm mx-auto">
                  No reservations match the filter. Add a new manual walk-in booking or load sample
                  data.
                </p>
                <button
                  onClick={() => setShowAddResModal(true)}
                  className="btn-olive py-2 px-4 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Create Manual Booking</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#1a3b6b]/15 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#ede4d5]/50 border-b border-[#1a3b6b]/15 text-[#595347] font-bold uppercase tracking-wider text-[0.68rem]">
                      <tr>
                        <th className="p-3.5">Booking #</th>
                        <th className="p-3.5">Guest Info</th>
                        <th className="p-3.5">Party & Seating</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5">Special Requests</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3b6b]/10">
                      {filteredReservations.map((res) => (
                        <tr key={res.id} className="hover:bg-[#fdfbf7] transition-colors">
                          <td className="p-3.5 font-bold text-[#1a3b6b]">
                            #{res.reservationNumber}
                            <span className="block text-[0.65rem] text-[#767064] font-normal mt-0.5">
                              {res.createdAt}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#191918] block">{res.fullName}</span>
                            <span className="text-[#595347] block text-[0.7rem]">{res.phone}</span>
                            <span className="text-[#767064] block text-[0.65rem]">{res.email}</span>
                          </td>
                          <td className="p-3.5 font-semibold text-[#191918]">
                            <span className="block">{res.partySize}</span>
                            <span className="text-[0.7rem] text-[#d99214] font-bold block">
                              {res.seating}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#1a3b6b] block">{res.date}</span>
                            <span className="text-[0.7rem] text-[#595347] block">{res.time}</span>
                          </td>
                          <td className="p-3.5 max-w-xs text-[#595347]">
                            {res.specialRequests || <span className="italic text-[#8c8273]">None</span>}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={res.status}
                              onChange={(e) =>
                                handleUpdateResStatus(res.id, e.target.value as ReservationStatus)
                              }
                              className={`text-xs font-bold uppercase rounded-lg px-2 py-1 border cursor-pointer focus:outline-none ${
                                res.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : res.status === "seated"
                                    ? "bg-blue-50 text-blue-800 border-blue-300"
                                    : res.status === "completed"
                                      ? "bg-gray-100 text-gray-700 border-gray-300"
                                      : "bg-red-50 text-red-800 border-red-300"
                              }`}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="seated">Seated</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <a
                              href={`tel:${res.phone}`}
                              className="p-1.5 rounded-lg bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 text-[#1a3b6b] inline-flex items-center justify-center transition-colors"
                              title={`Call Guest (${res.phone})`}
                            >
                              <Phone className="size-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenResWhatsApp(
                                  res,
                                  res.status === "seated"
                                    ? "seated"
                                    : res.status === "cancelled"
                                      ? "cancelled"
                                      : res.status === "completed"
                                        ? "completed"
                                        : "confirmed"
                                )
                              }
                              className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] hover:text-[#075E54] inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Send WhatsApp Booking Update"
                            >
                              <MessageCircle className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRes(res.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: WEBSITE TRAFFIC & VIEWERS ANALYTICS */}
        {/* ==================================================================== */}
        {activeTab === "visitors" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#595347]">
                  Total Pageviews Recorded
                </span>
                <p className="font-display text-3xl font-bold text-[#1a3b6b]">
                  {visitorAnalytics.totalViews}
                </p>
                <p className="text-[0.7rem] text-[#767064]">
                  Cumulative hits across all pages & routes
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#595347]">
                  Unique Visitors
                </span>
                <p className="font-display text-3xl font-bold text-[#2e7d32]">
                  {visitorAnalytics.uniqueVisitors}
                </p>
                <p className="text-[0.7rem] text-[#767064]">
                  Distinct devices & browser sessions identified
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#595347]">
                  Device Breakdown
                </span>
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#191918]">
                    <Monitor className="size-4 text-[#1a3b6b]" />
                    <span>Desktop: {visitorAnalytics.deviceCounts.desktop}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#191918]">
                    <Smartphone className="size-4 text-[#d99214]" />
                    <span>Mobile: {visitorAnalytics.deviceCounts.mobile}</span>
                  </div>
                </div>
                <p className="text-[0.7rem] text-[#767064] pt-1">
                  Optimized for fast mobile & desktop browsing
                </p>
              </div>
            </div>

            {/* Views by Route Table */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-[#1a3b6b]">
                Traffic by Page / Route
              </h3>
              <div className="space-y-3">
                {Object.entries(visitorAnalytics.pageCounts).map(([route, count]) => {
                  const percentage =
                    visitorAnalytics.totalViews > 0
                      ? Math.round((count / visitorAnalytics.totalViews) * 100)
                      : 0;

                  return (
                    <div key={route} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#191918]">
                          {route === "/" ? "Home Page (/)" : route}
                        </span>
                        <span className="text-[#595347]">
                          {count} views ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#ede4d5] overflow-hidden">
                        <div
                          className="h-full bg-[#1a3b6b] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Pageview Stream */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-[#1a3b6b]">
                  Real-Time Visitor Log
                </h3>
                <span className="text-xs text-[#767064]">Latest 50 events</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1a3b6b]/15 text-[#767064] font-bold uppercase text-[0.68rem]">
                      <th className="pb-2.5">Time</th>
                      <th className="pb-2.5">Page Path</th>
                      <th className="pb-2.5">Device</th>
                      <th className="pb-2.5">Visitor Session ID</th>
                      <th className="pb-2.5">Referrer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a3b6b]/10">
                    {visitorAnalytics.logs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="hover:bg-[#fdfbf7]">
                        <td className="py-2.5 text-[#595347] font-mono">{log.timeFormatted}</td>
                        <td className="py-2.5 font-bold text-[#1a3b6b]">{log.path}</td>
                        <td className="py-2.5 capitalize text-[#191918]">{log.device}</td>
                        <td className="py-2.5 font-mono text-[0.68rem] text-[#767064]">
                          {log.visitorId}
                        </td>
                        <td className="py-2.5 text-[#767064]">{log.referrer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: WHATSAPP CLICKS ANALYTICS */}
        {/* ==================================================================== */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Banner */}
            <div className="p-6 rounded-2xl bg-[#16a34a]/10 border-2 border-[#16a34a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#16a34a]">
                  WhatsApp Lead Generation
                </span>
                <h3 className="font-display text-3xl font-bold text-[#14532d]">
                  {whatsAppAnalytics.totalClicks} Total WhatsApp Clicks
                </h3>
                <p className="text-xs text-[#166534]">
                  Every time a user clicks a WhatsApp button to order, inquire, or send receipt
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-xs border border-[#16a34a]/30 text-center shrink-0">
                <span className="block text-[0.65rem] font-bold text-[#767064] uppercase">
                  Connected Number
                </span>
                <span className="font-bold text-sm text-[#16a34a] font-mono">{site.phone}</span>
              </div>
            </div>

            {/* Click Breakdown by Source */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-[#1a3b6b]">
                Clicks Breakdown by Button Location
              </h3>
              <div className="space-y-3">
                {Object.entries(whatsAppAnalytics.sourceCounts).map(([source, count]) => {
                  const pct =
                    whatsAppAnalytics.totalClicks > 0
                      ? Math.round((count / whatsAppAnalytics.totalClicks) * 100)
                      : 0;

                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#191918]">{source}</span>
                        <span className="text-[#16a34a]">
                          {count} clicks ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#ede4d5] overflow-hidden">
                        <div
                          className="h-full bg-[#16a34a] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent WhatsApp Click Activity Stream */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1a3b6b]/15 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-[#1a3b6b]">
                WhatsApp Click History Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1a3b6b]/15 text-[#767064] font-bold uppercase text-[0.68rem]">
                      <th className="pb-2.5">Date & Time</th>
                      <th className="pb-2.5">Button Source</th>
                      <th className="pb-2.5">Page Path</th>
                      <th className="pb-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a3b6b]/10">
                    {whatsAppAnalytics.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#fdfbf7]">
                        <td className="py-2.5 text-[#595347] font-mono">{log.timeFormatted}</td>
                        <td className="py-2.5 font-bold text-[#16a34a]">{log.source}</td>
                        <td className="py-2.5 text-[#1a3b6b] font-mono">{log.path}</td>
                        <td className="py-2.5 text-[#767064]">{log.details || "Direct click"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================== */}
      {/* MODAL 1: ORDER TICKET & RECEIPT MODAL */}
      {/* ====================================================================== */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#c9bba6] p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#1a3b6b]/15">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#d99214]">
                  BEACHWOOD CAFE KITCHEN TICKET
                </span>
                <h3 className="font-display text-2xl font-bold text-[#1a3b6b]">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#767064]">Placed: {selectedOrder.placedAt}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-[#767064] hover:text-[#191918]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#c9bba6]/50 text-xs space-y-1">
              <p className="font-bold text-sm text-[#191918]">{selectedOrder.customerName}</p>
              <p className="text-[#595347]">Phone: {selectedOrder.customerPhone}</p>
              <p className="text-[#595347]">Email: {selectedOrder.customerEmail}</p>
              <p className="text-[#1a3b6b] font-semibold pt-1">
                Fulfilment: {selectedOrder.fulfilmentType.toUpperCase()}
                {selectedOrder.fulfilmentType === "delivery" &&
                  ` to ${selectedOrder.deliveryAddress} ${selectedOrder.deliveryApt || ""}, ${selectedOrder.deliveryCity}`}
              </p>
              <p className="text-[#595347]">
                Utensils: {selectedOrder.includeUtensils ? "Included" : "None requested"}
              </p>
              {selectedOrder.orderNote && (
                <p className="text-[#b87508] font-medium pt-1">
                  Special Notes: {selectedOrder.orderNote}
                </p>
              )}
            </div>

            {/* Cancellation Status & Attribution Banner */}
            {selectedOrder.status === "cancelled" && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="uppercase tracking-wide text-xs">
                    Order Cancelled
                  </span>
                </div>
                <p className="font-bold text-sm text-rose-950">
                  Cancelled By:{" "}
                  <strong className="underline decoration-rose-400">
                    {selectedOrder.cancelledBy === "customer"
                      ? "CUSTOMER (Online Tracking Portal)"
                      : "CAFE STAFF / ADMIN"}
                  </strong>
                </p>
                {selectedOrder.cancellationReason && (
                  <p className="text-xs text-rose-800">
                    <strong>Reason:</strong> {selectedOrder.cancellationReason}
                  </p>
                )}
                {selectedOrder.cancelledAt && (
                  <p className="text-[0.7rem] text-rose-600">
                    Cancelled At:{" "}
                    {new Date(selectedOrder.cancelledAt).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                    {selectedOrder.timestamp && (
                      <span>
                        {" "}
                        (
                        {Math.max(
                          1,
                          Math.round(
                            (selectedOrder.cancelledAt - selectedOrder.timestamp) / 1000
                          )
                        )}
                        s after placement)
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Dishes Breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#767064] uppercase text-[0.68rem] block">
                Itemized Dishes
              </span>
              <div className="divide-y divide-[#1a3b6b]/10">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="font-medium text-[#191918]">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-bold text-[#1a3b6b]">${it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="pt-2 border-t border-[#1a3b6b]/15 space-y-1 text-xs text-[#595347]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#16a34a]">
                  <span>Discount</span>
                  <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>LA Tax (9.5%)</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>Staff Tip</span>
                  <span>${selectedOrder.tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#1a3b6b] pt-1 border-t border-[#1a3b6b]/10">
                <span>Grand Total</span>
                <span className="font-display text-base">
                  ${selectedOrder.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status Change Selector in Ticket */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#191918]">Update Status:</span>
              <div className="flex gap-1.5">
                {(["pending", "kitchen", "ready", "completed", "cancelled"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st, selectedOrder.orderNumber)}
                    className={`px-2 py-1 rounded text-[0.68rem] font-extrabold uppercase transition-colors cursor-pointer ${
                      selectedOrder.status === st
                        ? "bg-[#1a3b6b] text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#1a3b6b]/15 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  printKitchenTicket({
                    orderId: selectedOrder.orderNumber,
                    placedAt: selectedOrder.placedAt,
                    name: selectedOrder.customerName,
                    phone: selectedOrder.customerPhone,
                    email: selectedOrder.customerEmail,
                    fulfilmentType: selectedOrder.fulfilmentType,
                    deliveryAddress: selectedOrder.deliveryAddress,
                    deliveryApt: selectedOrder.deliveryApt,
                    includeUtensils: selectedOrder.includeUtensils,
                    orderNote: selectedOrder.orderNote,
                    paymentMethod: selectedOrder.paymentMethod,
                    items: selectedOrder.items,
                    subtotal: selectedOrder.subtotal,
                    discountAmount: selectedOrder.discountAmount,
                    tax: selectedOrder.tax,
                    deliveryFee: selectedOrder.deliveryFee,
                    tipAmount: selectedOrder.tipAmount,
                    grandTotal: selectedOrder.grandTotal,
                  });
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a3b6b] hover:bg-[#122a4f] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="size-3.5" />
                <span>Print Kitchen Ticket</span>
              </button>
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
                className="py-2.5 px-3 rounded-xl bg-white border border-[#c9bba6] hover:bg-[#ede4d5] text-[#191918] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="size-3.5 text-[#d99214]" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: MANUAL RESERVATION MODAL */}
      {/* ====================================================================== */}
      {showAddResModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddResModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#c9bba6] p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1a3b6b]/15">
              <h3 className="font-display text-xl font-bold text-[#1a3b6b]">
                New Table Reservation
              </h3>
              <button
                onClick={() => setShowAddResModal(false)}
                className="p-1 rounded-full text-[#767064] hover:text-[#191918]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualRes} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#191918] mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={newResGuest}
                  onChange={(e) => setNewResGuest(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newResPhone}
                    onChange={(e) => setNewResPhone(e.target.value)}
                    placeholder="(323) 555-0100"
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Email</label>
                  <input
                    type="email"
                    value={newResEmail}
                    onChange={(e) => setNewResEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Party Size</label>
                  <select
                    value={newResParty}
                    onChange={(e) => setNewResParty(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918] bg-white"
                  >
                    <option value="1 guest">1 guest</option>
                    <option value="2 guests">2 guests</option>
                    <option value="3 guests">3 guests</option>
                    <option value="4 guests">4 guests</option>
                    <option value="5 guests">5 guests</option>
                    <option value="6 guests">6 guests</option>
                    <option value="7+ guests (Large Party)">7+ guests (Large Party)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Seating Area</label>
                  <select
                    value={newResSeating}
                    onChange={(e) => setNewResSeating(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918] bg-white"
                  >
                    <option value="Any Table">Any Table</option>
                    <option value="Indoor Booth">Indoor Booth</option>
                    <option value="Outdoor Patio">Outdoor Patio</option>
                    <option value="Counter Bar">Counter Bar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Date</label>
                  <input
                    type="text"
                    value={newResDate}
                    onChange={(e) => setNewResDate(e.target.value)}
                    placeholder="Today / Tomorrow"
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191918] mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newResTime}
                    onChange={(e) => setNewResTime(e.target.value)}
                    placeholder="e.g. 7:30 PM"
                    className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#191918] mb-1">Special Requests</label>
                <input
                  type="text"
                  value={newResNotes}
                  onChange={(e) => setNewResNotes(e.target.value)}
                  placeholder="e.g. Anniversary, high chair, window seat"
                  className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                />
              </div>

              {/* WhatsApp Notification Option on Save */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sendWhatsAppOnSave"
                  checked={sendWhatsAppOnSave}
                  onChange={(e) => setSendWhatsAppOnSave(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="sendWhatsAppOnSave"
                  className="text-xs font-semibold text-emerald-950 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <MessageCircle className="size-3.5 text-emerald-600" />
                    <span>Save hone par guest nu WhatsApp te booking update bhejo</span>
                  </span>
                  <span className="block text-[0.68rem] text-emerald-800 font-normal mt-0.5">
                    Automatically opens WhatsApp update dialog with complete booking details, table & schedule
                  </span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="btn-olive flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Create Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddResModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: ADMIN CREDENTIALS SETTINGS */}
      {/* ====================================================================== */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#c9bba6] p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1a3b6b]/15">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1a3b6b]">Admin Security</h3>
                <p className="text-xs text-[#767064]">Update your management login credentials</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full text-[#767064] hover:text-[#191918]"
              >
                <X className="size-5" />
              </button>
            </div>

            {settingsError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#191918] mb-1">New Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191918] mb-1">
                  New Password (min 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191918] mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2.5 rounded-lg border border-[#c9bba6] text-[#191918]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="btn-olive flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save New Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 4: RESERVATION WHATSAPP UPDATE DIALOG */}
      {/* ====================================================================== */}
      {whatsAppRes && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setWhatsAppRes(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#c9bba6] p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#1a3b6b]/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#25D366]/15 text-[#128C7E]">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#1a3b6b]">
                    Send WhatsApp Booking Update
                  </h3>
                  <p className="text-xs text-[#767064]">
                    Booking #{whatsAppRes.reservationNumber} • {whatsAppRes.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppRes(null)}
                className="p-1 rounded-full text-[#767064] hover:text-[#191918] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Guest Summary Card */}
            <div className="p-3 rounded-xl bg-[#ede4d5]/40 border border-[#c9bba6]/60 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#191918] block">{whatsAppRes.fullName}</span>
                <span className="text-[#595347] text-[0.7rem] block">
                  {whatsAppRes.partySize} • {whatsAppRes.date}, {whatsAppRes.time} • {whatsAppRes.seating}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase ${
                    whatsAppRes.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : whatsAppRes.status === "seated"
                        ? "bg-blue-100 text-blue-800"
                        : whatsAppRes.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  {whatsAppRes.status}
                </span>
                <a
                  href={`tel:${whatsAppRes.phone}`}
                  className="p-1 rounded bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 text-[#1a3b6b] inline-flex items-center gap-1 text-[0.65rem] font-bold"
                  title="Call Guest Phone"
                >
                  <Phone className="size-3" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Recipient Phone & Country Code Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-[#191918]">
                Recipient WhatsApp Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="Enter phone digits..."
                    className="w-full p-2.5 rounded-xl border border-[#c9bba6] text-[#191918] font-mono text-xs focus:outline-none focus:border-[#128C7E]"
                  />
                </div>
              </div>
              {/* Quick Country Code Pills */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[0.68rem] text-[#767064] font-semibold">Country format:</span>
                <button
                  type="button"
                  onClick={() => setWhatsAppCountryCode("auto")}
                  className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold cursor-pointer transition-colors ${
                    whatsAppCountryCode === "auto"
                      ? "bg-[#128C7E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppCountryCode("1")}
                  className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold cursor-pointer transition-colors ${
                    whatsAppCountryCode === "1"
                      ? "bg-[#128C7E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  +1 (USA/Canada)
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppCountryCode("91")}
                  className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold cursor-pointer transition-colors ${
                    whatsAppCountryCode === "91"
                      ? "bg-[#128C7E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  +91 (India)
                </button>
              </div>
              <p className="text-[0.68rem] text-[#767064]">
                Target: <span className="font-mono font-bold text-[#191918]">wa.me/{formatWhatsAppTargetPhone(whatsAppPhone, whatsAppCountryCode)}</span>
              </p>
            </div>

            {/* Template Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-[#191918]">
                Message Update Template
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "confirmed", label: "Confirmed" },
                    { key: "seated", label: "Table Ready" },
                    { key: "reminder", label: "Reminder" },
                    { key: "cancelled", label: "Cancelled" },
                    { key: "completed", label: "Thank You" },
                  ] as const
                ).map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      whatsAppTemplate === tpl.key
                        ? "bg-[#128C7E] text-white shadow-xs"
                        : "bg-[#ede4d5]/60 hover:bg-[#ede4d5] text-[#595347]"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Preview & Edit */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#191918]">
                  Message Preview (Editable)
                </label>
                <span className="text-[0.68rem] text-[#767064]">
                  {whatsAppMessageText.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={whatsAppMessageText}
                onChange={(e) => {
                  setWhatsAppMessageText(e.target.value);
                  setWhatsAppTemplate("custom");
                }}
                className="w-full p-2.5 rounded-xl border border-[#c9bba6] text-[#191918] text-xs font-sans focus:outline-none focus:border-[#128C7E] leading-relaxed resize-y"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/${formatWhatsAppTargetPhone(whatsAppPhone, whatsAppCountryCode)}?text=${encodeURIComponent(
                  whatsAppMessageText
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  adminStore.trackWhatsAppClick(
                    "Admin Reservation WhatsApp Update",
                    `#${whatsAppRes.reservationNumber}`
                  );
                  showNotification(`WhatsApp opened for #${whatsAppRes.reservationNumber}`);
                  setWhatsAppRes(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <MessageCircle className="size-4" />
                <span>Open in WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsAppMessageText);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                  showNotification("Message copied to clipboard!");
                }}
                className="py-2.5 px-3.5 rounded-xl bg-[#ede4d5] hover:bg-[#e4d7c3] text-[#49443b] hover:text-[#191918] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                <span>{isCopied ? "Copied!" : "Copy Text"}</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppRes(null)}
                className="py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Update WhatsApp Prompt */}
      {statusUpdateToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <MessageCircle className="size-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#191918]">
              Status Updated to <span className="uppercase text-emerald-700">{statusUpdateToast.status}</span>
            </p>
            <p className="text-[#595347] mt-0.5">
              Send a WhatsApp update to {statusUpdateToast.reservation.fullName} (#{statusUpdateToast.reservation.reservationNumber})?
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  const targetRes = statusUpdateToast.reservation;
                  const st = statusUpdateToast.status;
                  setStatusUpdateToast(null);
                  handleOpenResWhatsApp(
                    targetRes,
                    st === "seated"
                      ? "seated"
                      : st === "cancelled"
                        ? "cancelled"
                        : st === "completed"
                          ? "completed"
                          : "confirmed"
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="size-3.5" />
                <span>Send WhatsApp Update</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusUpdateToast(null)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#595347] font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusUpdateToast(null)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Floating Saved Booking WhatsApp Prompt */}
      {savedBookingBanner && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#191918]">
              Table Booking Saved: #{savedBookingBanner.reservationNumber}
            </p>
            <p className="text-[#595347] mt-0.5">
              Guest: {savedBookingBanner.fullName} ({savedBookingBanner.partySize} · {savedBookingBanner.date}, {savedBookingBanner.time})
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  const targetRes = savedBookingBanner;
                  setSavedBookingBanner(null);
                  handleOpenResWhatsApp(targetRes, "confirmed");
                }}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="size-3.5" />
                <span>Send WhatsApp Update</span>
              </button>
              <a
                href={`tel:${savedBookingBanner.phone}`}
                className="px-2.5 py-1.5 rounded-lg bg-[#1a3b6b]/10 hover:bg-[#1a3b6b]/20 text-[#1a3b6b] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Phone className="size-3" />
                <span>Call</span>
              </a>
              <button
                type="button"
                onClick={() => setSavedBookingBanner(null)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#595347] font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSavedBookingBanner(null)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
