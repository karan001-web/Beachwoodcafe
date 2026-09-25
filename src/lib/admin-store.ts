// Centralized Data Store for Beachwood Cafe Admin Panel
// Handles Orders, Table Reservations, Website Visitors Analytics, and WhatsApp Click Tracking.

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = "pending" | "kitchen" | "ready" | "completed" | "cancelled";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  placedAt: string; // ISO string or formatted time
  timestamp: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfilmentType: "pickup" | "delivery";
  deliveryAddress?: string;
  deliveryApt?: string;
  deliveryCity?: string;
  deliveryZip?: string;
  deliveryNotes?: string;
  includeUtensils: boolean;
  orderNote?: string;
  paymentMethod: "prepay" | "counter";
  cardLast4?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  deliveryFee: number;
  tipAmount: number;
  grandTotal: number;
  status: OrderStatus;
  cancelledBy?: "customer" | "admin" | undefined;
  cancelledAt?: number | undefined;
  cancellationReason?: string | undefined;
}

export type ReservationStatus = "confirmed" | "seated" | "completed" | "cancelled";

export interface AdminReservation {
  id: string;
  reservationNumber: string;
  createdAt: string;
  timestamp: number;
  fullName: string;
  phone: string;
  email: string;
  partySize: string;
  date: string;
  time: string;
  seating: string;
  specialRequests?: string | undefined;
  status: ReservationStatus;
}

export interface VisitorLog {
  id: string;
  timestamp: number;
  timeFormatted: string;
  path: string;
  device: "mobile" | "desktop" | "tablet";
  visitorId: string;
  referrer: string;
}

export interface WhatsAppClickLog {
  id: string;
  timestamp: number;
  timeFormatted: string;
  source: string;
  path: string;
  details?: string | undefined;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  type: "order" | "reservation" | "cancellation";
  title: string;
  message: string;
  timestamp: number;
  timeFormatted: string;
  read: boolean;
  referenceId: string;
  data?: any;
}

const STORAGE_KEYS = {
  ORDERS: "bwc_admin_orders_v1",
  RESERVATIONS: "bwc_admin_reservations_v1",
  VISITOR_LOGS: "bwc_admin_visitor_logs_v1",
  VISITOR_COUNT: "bwc_admin_total_views_v1",
  VISITOR_ID: "bwc_visitor_unique_id_v1",
  WHATSAPP_LOGS: "bwc_admin_whatsapp_logs_v1",
  ADMIN_AUTH: "bwc_admin_auth_session_v1",
  ADMIN_CREDS: "bwc_admin_credentials_v1",
  MAINTENANCE: "bwc_site_maintenance_mode_v1",
  CUSTOMER_ORDER_IDS: "bwc_customer_order_ids_v1",
  LAST_ORDER_ID: "bwc_last_placed_order_id",
  NOTIFICATIONS: "bwc_admin_notifications_v1",
  SOUND_ENABLED: "bwc_admin_sound_enabled_v1",
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message:
    "Beachwood Cafe online ordering and website are temporarily paused for maintenance. We will be back online shortly!",
  updatedAt: "",
};

// Pure JavaScript SHA-256 implementation (synchronous, zero-dependency)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = "length";
  let i: number, j: number;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    const idx = i >> 2;
    words[idx] = (words[idx] ?? 0) | (j << (((3 - i) % 4) * 8));
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] ?? 0;
      const w2 = w[i - 2] ?? 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const h0 = hash[0] ?? 0;
      const h1 = hash[1] ?? 0;
      const h2 = hash[2] ?? 0;
      const h3 = hash[3] ?? 0;
      const h4 = hash[4] ?? 0;
      const h5 = hash[5] ?? 0;
      const h6 = hash[6] ?? 0;
      const h7 = hash[7] ?? 0;
      const ch = (h4 & h5) ^ (~h4 & h6);
      const maj = (h0 & h1) ^ (h0 & h2) ^ (h1 & h2);
      const wi = i < 16 ? (w[i] ?? 0) : (((w[i - 16] ?? 0) + s0 + (w[i - 7] ?? 0) + s1) | 0);
      w[i] = wi;
      const temp1 =
        h7 +
        (rightRotate(h4, 6) ^ rightRotate(h4, 11) ^ rightRotate(h4, 25)) +
        ch +
        (k[i] ?? 0) +
        wi;
      const temp2 =
        (rightRotate(h0, 2) ^ rightRotate(h0, 13) ^ rightRotate(h0, 22)) + maj;
      hash = [(temp1 + temp2) | 0, h0, h1, h2, (h3 + temp1) | 0, h4, h5, h6];
    }
    for (i = 0; i < 8; i++) {
      hash[i] = ((hash[i] ?? 0) + (oldHash[i] ?? 0)) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = ((hash[i] ?? 0) >> (b * 8)) & 255;
      result += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

// Default Credentials - Stored only as SHA-256 hash (never plaintext)
const DEFAULT_CREDS = {
  username: "778800",
  passwordHash: "75ca0ab7b09a1603ef1c83b8c2d1de3acb078b9c92824803e156016f97948b3f",
};

// Helper: Safely get from localStorage
function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

// Helper: Safely save to localStorage
function safeSetJSON(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// ============================================================================
// CROSS-TAB & CROSS-DEVICE CLOUD REAL-TIME PUB/SUB RELAY
// ============================================================================
const SYNC_CHANNEL_NAME = "bwc_admin_sync_v1";
const CLOUD_SYNC_TOPIC = "bwc_beachwood_live_orders_v1";
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    syncChannel.onmessage = (event) => {
      if (!event?.data) return;
      const { type, payload } = event.data;
      if (
        type === "order_add" ||
        type === "order_status" ||
        type === "order_cancel" ||
        type === "order_delete"
      ) {
        window.dispatchEvent(new CustomEvent("bwc_order_change", { detail: payload }));
      } else if (
        type === "reservation_add" ||
        type === "reservation_status" ||
        type === "reservation_delete"
      ) {
        window.dispatchEvent(new CustomEvent("bwc_reservation_change", { detail: payload }));
      } else if (type === "notification_added") {
        window.dispatchEvent(new CustomEvent("bwc_notification_added", { detail: payload }));
      }
    };
  } catch (e) {
    console.warn("Failed to initialize BroadcastChannel:", e);
  }
}

// Global instant cloud publish (under 100ms cross-device delivery via SSE)
function publishCloudEvent(type: string, payload: any) {
  if (typeof window === "undefined") return;
  try {
    fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, senderId: Date.now() }),
    }).catch(() => {});
  } catch {}
}

function broadcastEvent(type: string, payload: any) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload });
    } catch (e) {
      console.warn("BroadcastChannel postMessage error:", e);
    }
  }
  // Deliver instantly to other devices across the web
  publishCloudEvent(type, payload);
}

// ============================================================================
// ADMIN STORE API
// ============================================================================
export const adminStore = {
  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION
  // --------------------------------------------------------------------------
  getCredentials(): { username: string } {
    const creds = safeGetJSON<{ username?: string; passwordHash?: string }>(
      STORAGE_KEYS.ADMIN_CREDS,
      DEFAULT_CREDS,
    );
    return {
      username: creds?.username || DEFAULT_CREDS.username,
    };
  },

  updateCredentials(newUsername: string, newPassword: string): boolean {
    if (!newUsername.trim() || newPassword.length < 8) return false;
    safeSetJSON(STORAGE_KEYS.ADMIN_CREDS, {
      username: newUsername.trim(),
      passwordHash: sha256(newPassword),
    });
    return true;
  },

  login(usernameInput: string, passwordInput: string): boolean {
    const rawCreds = safeGetJSON<{ username?: string; passwordHash?: string; password?: string }>(
      STORAGE_KEYS.ADMIN_CREDS,
      DEFAULT_CREDS,
    );
    const targetUsername = rawCreds?.username || DEFAULT_CREDS.username;
    const inputHash = sha256(passwordInput);

    // Secure verification: compare hashes (or migrate old plaintext entry if exists)
    const isPasswordValid = rawCreds?.passwordHash
      ? inputHash === rawCreds.passwordHash
      : rawCreds?.password
        ? passwordInput === rawCreds.password || inputHash === sha256(rawCreds.password)
        : inputHash === DEFAULT_CREDS.passwordHash;

    const isValid = usernameInput.trim() === targetUsername && isPasswordValid;

    if (isValid && typeof window !== "undefined") {
      const token = {
        authenticated: true,
        username: targetUsername,
        loggedInAt: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(token));
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(token));
    }
    return isValid;
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const session =
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) ||
        localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed && parsed.authenticated === true;
    } catch {
      return false;
    }
  },

  logout() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  },

  // --------------------------------------------------------------------------
  // 1B. SITE STATUS / MAINTENANCE MODE TOGGLE
  // --------------------------------------------------------------------------
  getMaintenanceConfig(): MaintenanceConfig {
    return safeGetJSON<MaintenanceConfig>(STORAGE_KEYS.MAINTENANCE, DEFAULT_MAINTENANCE);
  },

  setMaintenanceMode(enabled: boolean, message?: string): MaintenanceConfig {
    const current = this.getMaintenanceConfig();
    const updated: MaintenanceConfig = {
      enabled,
      message: message?.trim() || current.message || DEFAULT_MAINTENANCE.message,
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    safeSetJSON(STORAGE_KEYS.MAINTENANCE, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bwc_maintenance_change", { detail: updated }));
    }
    return updated;
  },

  // --------------------------------------------------------------------------
  // 2. ONLINE ORDERS MANAGEMENT
  // --------------------------------------------------------------------------
  getOrders(): AdminOrder[] {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    return orders.sort((a, b) => b.timestamp - a.timestamp);
  },

  addOrder(orderInput: Omit<AdminOrder, "id" | "timestamp" | "status">): AdminOrder {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const newOrder: AdminOrder = {
      ...orderInput,
      id: "ord_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      status: "pending",
    };
    orders.unshift(newOrder);
    safeSetJSON(STORAGE_KEYS.ORDERS, orders);

    // Save to customer's local session history for easy tracking
    if (typeof window !== "undefined") {
      try {
        const customerOrderIds = safeGetJSON<string[]>(STORAGE_KEYS.CUSTOMER_ORDER_IDS, []);
        if (!customerOrderIds.includes(newOrder.orderNumber)) {
          customerOrderIds.unshift(newOrder.orderNumber);
          safeSetJSON(STORAGE_KEYS.CUSTOMER_ORDER_IDS, customerOrderIds.slice(0, 20));
        }
        localStorage.setItem(STORAGE_KEYS.LAST_ORDER_ID, newOrder.orderNumber);
      } catch (err) {
        console.error("Failed to store customer order id:", err);
      }

      // Automatically record an admin notification
      this.addNotification({
        type: "order",
        title: "New Online Order Received!",
        message: `Order #${newOrder.orderNumber} placed by ${newOrder.customerName} ($${newOrder.grandTotal.toFixed(2)} • ${newOrder.fulfilmentType.toUpperCase()})`,
        referenceId: newOrder.orderNumber,
        data: newOrder,
      });

      const orderPayload = {
        orderNumber: newOrder.orderNumber,
        action: "add",
        order: newOrder,
      };

      // Broadcast to other open tabs on this browser
      broadcastEvent("order_add", orderPayload);

      // Dispatch event for real-time instant local sync
      window.dispatchEvent(
        new CustomEvent("bwc_order_change", {
          detail: orderPayload,
        })
      );

      // Background sync to server API so other devices (admin computer/phone) receive it
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      }).catch((err) => console.warn("Background order sync to server:", err));
    }

    return newOrder;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const cleanId = String(orderId || "").trim().toLowerCase().replace(/^#/, "");
    const idx = orders.findIndex(
      (o) =>
        o.id === orderId ||
        o.orderNumber === orderId ||
        (o.id && o.id.toLowerCase() === cleanId) ||
        (o.orderNumber && o.orderNumber.replace(/^#/, "").trim().toLowerCase() === cleanId)
    );
    if (idx === -1 || !orders[idx]) return false;

    orders[idx]!.status = status;
    if (status === "cancelled" && !orders[idx]!.cancelledBy) {
      orders[idx]!.cancelledBy = "admin";
      orders[idx]!.cancelledAt = Date.now();
      orders[idx]!.cancellationReason = "Cancelled manually by Cafe Staff / Admin";
    }

    safeSetJSON(STORAGE_KEYS.ORDERS, orders);

    if (typeof window !== "undefined") {
      const payload = {
        orderNumber: orders[idx]!.orderNumber,
        orderId: orders[idx]!.id,
        action: "status_update",
        status,
        order: orders[idx],
      };

      broadcastEvent("order_status", payload);

      window.dispatchEvent(
        new CustomEvent("bwc_order_change", {
          detail: payload,
        })
      );

      // Background sync to server
      fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orders[idx]!.id,
          orderNumber: orders[idx]!.orderNumber,
          status,
          cancelledBy: orders[idx]!.cancelledBy,
          cancellationReason: orders[idx]!.cancellationReason,
        }),
      }).catch((err) => console.warn("Background status sync to server:", err));
    }

    return true;
  },

  // Customer cancellation strictly within 1 minute (60 seconds)
  cancelOrderByCustomer(
    orderIdentifier: string,
    reason?: string
  ): { success: boolean; message: string; order?: AdminOrder } {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex(
      (o) =>
        o.id === orderIdentifier ||
        o.orderNumber.toLowerCase() === orderIdentifier.toLowerCase().replace("#", "")
    );

    if (idx === -1 || !orders[idx]) {
      return { success: false, message: "Order not found. Please verify your order number." };
    }

    const order = orders[idx]!;

    // Check if already cancelled
    if (order.status === "cancelled") {
      return {
        success: false,
        message: "This order has already been cancelled.",
        order,
      };
    }

    // 1-minute window check (60,000 milliseconds)
    const elapsedMs = Date.now() - order.timestamp;
    const ONE_MINUTE_MS = 60 * 1000;

    if (elapsedMs > ONE_MINUTE_MS) {
      const elapsedSec = Math.floor(elapsedMs / 1000);
      return {
        success: false,
        message: `Cancellation window closed! More than 1 minute has passed (${elapsedSec}s). Your order has already been sent to the kitchen line. Please call the cafe for emergency changes.`,
        order,
      };
    }

    // Process valid cancellation
    order.status = "cancelled";
    order.cancelledBy = "customer";
    order.cancelledAt = Date.now();
    order.cancellationReason =
      reason || "Cancelled directly by customer within 1-minute grace period";

    safeSetJSON(STORAGE_KEYS.ORDERS, orders);

    // Instant real-time event dispatch for Admin Panel
    if (typeof window !== "undefined") {
      this.addNotification({
        type: "cancellation",
        title: "Order Cancelled by Customer!",
        message: `Order #${order.orderNumber} was cancelled by customer (${Math.round(elapsedMs / 1000)}s after placement)`,
        referenceId: order.orderNumber,
        data: order,
      });

      const cancelPayload = {
        orderNumber: order.orderNumber,
        action: "cancel",
        by: "customer",
        cancelledAt: order.cancelledAt,
        elapsedSeconds: Math.round(elapsedMs / 1000),
        order,
      };

      broadcastEvent("order_cancel", cancelPayload);

      window.dispatchEvent(
        new CustomEvent("bwc_order_change", {
          detail: cancelPayload,
        })
      );

      // Sync cancellation to server
      fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderNumber,
          status: "cancelled",
          cancelledBy: "customer",
          cancellationReason: order.cancellationReason,
        }),
      }).catch((err) => console.warn("Background cancel sync to server:", err));
    }

    return {
      success: true,
      message: `Order #${order.orderNumber} was successfully cancelled. Staff has been notified immediately.`,
      order,
    };
  },

  // Admin cancellation
  cancelOrderByAdmin(
    orderIdentifier: string,
    reason?: string
  ): { success: boolean; order?: AdminOrder } {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex(
      (o) => o.id === orderIdentifier || o.orderNumber === orderIdentifier
    );
    if (idx === -1 || !orders[idx]) return { success: false };

    const order = orders[idx]!;
    order.status = "cancelled";
    order.cancelledBy = "admin";
    order.cancelledAt = Date.now();
    order.cancellationReason = reason || "Cancelled by cafe management / admin";

    safeSetJSON(STORAGE_KEYS.ORDERS, orders);

    if (typeof window !== "undefined") {
      const cancelPayload = {
        orderNumber: order.orderNumber,
        action: "cancel",
        by: "admin",
        cancelledAt: order.cancelledAt,
        order,
      };

      broadcastEvent("order_cancel", cancelPayload);

      window.dispatchEvent(
        new CustomEvent("bwc_order_change", {
          detail: cancelPayload,
        })
      );

      // Sync admin cancellation to server
      fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderNumber,
          status: "cancelled",
          cancelledBy: "admin",
          cancellationReason: order.cancellationReason,
        }),
      }).catch((err) => console.warn("Background admin cancel sync to server:", err));
    }

    return { success: true, order };
  },

  // Search orders by orderNumber, id, or phone number
  findOrder(query: string): AdminOrder | undefined {
    if (!query || !query.trim()) return undefined;
    const cleanQuery = query.trim().toLowerCase().replace("#", "");
    const cleanDigits = query.replace(/\D/g, "");
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);

    return orders.find((o) => {
      if (o.orderNumber.toLowerCase() === cleanQuery) return true;
      if (o.id.toLowerCase() === cleanQuery) return true;
      if (cleanDigits.length >= 7 && o.customerPhone.replace(/\D/g, "").includes(cleanDigits))
        return true;
      return false;
    });
  },

  // Customer order history on this browser
  getCustomerRecentOrders(): AdminOrder[] {
    if (typeof window === "undefined") return [];
    const customerOrderIds = safeGetJSON<string[]>(STORAGE_KEYS.CUSTOMER_ORDER_IDS, []);
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const result: AdminOrder[] = [];

    for (const num of customerOrderIds) {
      const match = orders.find((o) => o.orderNumber === num || o.id === num);
      if (match) result.push(match);
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  },

  getCustomerLastOrderId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_ORDER_ID);
  },

  deleteOrder(orderId: string): boolean {
    const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
    const filtered = orders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    safeSetJSON(STORAGE_KEYS.ORDERS, filtered);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bwc_order_change", {
          detail: { orderId, action: "delete" },
        })
      );
    }

    return true;
  },

  // --------------------------------------------------------------------------
  // 3. TABLE RESERVATIONS MANAGEMENT
  // --------------------------------------------------------------------------
  getReservations(): AdminReservation[] {
    const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
    return reservations.sort((a, b) => b.timestamp - a.timestamp);
  },

  addReservation(
    resInput: Omit<AdminReservation, "id" | "timestamp" | "status" | "reservationNumber">
  ): AdminReservation {
    const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newRes: AdminReservation = {
      ...resInput,
      id: "res_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      reservationNumber: `RES-${randomNum}`,
      timestamp: Date.now(),
      status: "confirmed",
    };
    reservations.unshift(newRes);
    safeSetJSON(STORAGE_KEYS.RESERVATIONS, reservations);

    if (typeof window !== "undefined") {
      this.addNotification({
        type: "reservation",
        title: "New Table Reservation!",
        message: `Booking #${newRes.reservationNumber} for ${newRes.fullName} (${newRes.partySize} • ${newRes.date} at ${newRes.time})`,
        referenceId: newRes.reservationNumber,
        data: newRes,
      });

      const resPayload = {
        reservationNumber: newRes.reservationNumber,
        action: "add",
        reservation: newRes,
      };

      // Broadcast across tabs
      broadcastEvent("reservation_add", resPayload);

      window.dispatchEvent(
        new CustomEvent("bwc_reservation_change", {
          detail: resPayload,
        })
      );

      // Background sync to server API so other devices receive it
      fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation: newRes }),
      }).catch((err) => console.warn("Background reservation sync to server:", err));
    }

    return newRes;
  },

  updateReservationStatus(resId: string, status: ReservationStatus): boolean {
    const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
    const cleanId = String(resId || "").trim().toLowerCase().replace(/^#/, "");
    const idx = reservations.findIndex(
      (r) =>
        r.id === resId ||
        r.reservationNumber === resId ||
        (r.id && r.id.toLowerCase() === cleanId) ||
        (r.reservationNumber && r.reservationNumber.replace(/^#/, "").trim().toLowerCase() === cleanId)
    );
    if (idx === -1 || !reservations[idx]) return false;
    reservations[idx]!.status = status;
    safeSetJSON(STORAGE_KEYS.RESERVATIONS, reservations);

    if (typeof window !== "undefined") {
      const payload = {
        reservationNumber: reservations[idx]!.reservationNumber,
        action: "status_update",
        status,
        reservation: reservations[idx],
      };

      broadcastEvent("reservation_status", payload);

      window.dispatchEvent(
        new CustomEvent("bwc_reservation_change", {
          detail: payload,
        })
      );

      // Background sync to server
      fetch("/api/reservations/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resId: reservations[idx]!.id,
          reservationNumber: reservations[idx]!.reservationNumber,
          status,
        }),
      }).catch((err) => console.warn("Background status sync to server:", err));
    }

    return true;
  },

  deleteReservation(resId: string): boolean {
    const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
    const filtered = reservations.filter(
      (r) => r.id !== resId && r.reservationNumber !== resId
    );
    safeSetJSON(STORAGE_KEYS.RESERVATIONS, filtered);

    if (typeof window !== "undefined") {
      broadcastEvent("reservation_delete", { resId, action: "delete" });
      window.dispatchEvent(
        new CustomEvent("bwc_reservation_change", {
          detail: { resId, action: "delete" },
        })
      );
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // 4. WEBSITE VISITORS & TRAFFIC ANALYTICS
  // --------------------------------------------------------------------------
  getVisitorId(): string {
    if (typeof window === "undefined") return "server";
    let id = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!id) {
      id = "vis_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.VISITOR_ID, id);
    }
    return id;
  },

  trackPageView(path: string) {
    if (typeof window === "undefined") return;
    if (path.startsWith("/admin")) return; // Don't track admin views as public traffic

    try {
      const now = Date.now();
      const visitorId = this.getVisitorId();

      // Device detection
      const ua = navigator.userAgent.toLowerCase();
      let device: "mobile" | "desktop" | "tablet" = "desktop";
      if (/tablet|ipad|playbook|silk/i.test(ua)) device = "tablet";
      else if (/mobile|iphone|ipod|android|blackberry|iemobile/i.test(ua)) device = "mobile";

      const log: VisitorLog = {
        id: "view_" + now + "_" + Math.random().toString(36).substring(2, 6),
        timestamp: now,
        timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        path: path || "/",
        device,
        visitorId,
        referrer: document.referrer ? new URL(document.referrer).hostname : "Direct Visit",
      };

      // Keep recent 200 logs
      const logs = safeGetJSON<VisitorLog[]>(STORAGE_KEYS.VISITOR_LOGS, []);
      logs.unshift(log);
      if (logs.length > 200) logs.length = 200;
      safeSetJSON(STORAGE_KEYS.VISITOR_LOGS, logs);

      // Increment total views counter
      const totalViews = parseInt(localStorage.getItem(STORAGE_KEYS.VISITOR_COUNT) || "0", 10);
      localStorage.setItem(STORAGE_KEYS.VISITOR_COUNT, String(totalViews + 1));
    } catch (e) {
      console.error("Error tracking page view:", e);
    }
  },

  getVisitorAnalytics() {
    const logs = safeGetJSON<VisitorLog[]>(STORAGE_KEYS.VISITOR_LOGS, []);
    const rawTotalViews = parseInt(
      (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEYS.VISITOR_COUNT)) || "0",
      10
    );
    const totalViews = Math.max(rawTotalViews, logs.length);

    // Unique visitors set
    const uniqueIds = new Set(logs.map((l) => l.visitorId));
    const uniqueVisitors = Math.max(uniqueIds.size, totalViews > 0 ? 1 : 0);

    // Page view counts
    const pageCounts: Record<string, number> = {};
    logs.forEach((l) => {
      const key = l.path || "/";
      pageCounts[key] = (pageCounts[key] || 0) + 1;
    });

    // Device counts
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    logs.forEach((l) => {
      if (deviceCounts[l.device] !== undefined) {
        deviceCounts[l.device]++;
      } else {
        deviceCounts.desktop++;
      }
    });

    return {
      totalViews,
      uniqueVisitors,
      logs: logs.slice(0, 50),
      pageCounts,
      deviceCounts,
    };
  },

  // --------------------------------------------------------------------------
  // 5. WHATSAPP BUTTON CLICK TRACKING
  // --------------------------------------------------------------------------
  trackWhatsAppClick(source: string, details?: string) {
    if (typeof window === "undefined") return;

    try {
      const now = Date.now();
      const currentPath = window.location.pathname || "/";

      const clickEvent: WhatsAppClickLog = {
        id: "wa_" + now + "_" + Math.random().toString(36).substring(2, 6),
        timestamp: now,
        timeFormatted: new Date().toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: source || "WhatsApp Link",
        path: currentPath,
        details,
      };

      const logs = safeGetJSON<WhatsAppClickLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, []);
      logs.unshift(clickEvent);
      if (logs.length > 200) logs.length = 200;
      safeSetJSON(STORAGE_KEYS.WHATSAPP_LOGS, logs);
    } catch (e) {
      console.error("Error tracking WhatsApp click:", e);
    }
  },

  getWhatsAppAnalytics() {
    const logs = safeGetJSON<WhatsAppClickLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, []);
    const sourceCounts: Record<string, number> = {};

    logs.forEach((l) => {
      const src = l.source || "General WhatsApp";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    return {
      totalClicks: logs.length,
      logs: logs.slice(0, 50),
      sourceCounts,
    };
  },

  // --------------------------------------------------------------------------
  // 6. CSV EXPORT UTILITIES
  // --------------------------------------------------------------------------
  exportOrdersToCSV() {
    const orders = this.getOrders();
    if (orders.length === 0) {
      alert("No orders to export yet.");
      return;
    }

    const headers = [
      "Order ID",
      "Date & Time",
      "Customer Name",
      "Phone",
      "Email",
      "Fulfilment",
      "Address",
      "Status",
      "Items Count",
      "Subtotal ($)",
      "Tax ($)",
      "Tip ($)",
      "Delivery Fee ($)",
      "Total Amount ($)",
      "Payment Method",
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.placedAt}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail}"`,
      `"${o.fulfilmentType}"`,
      `"${(o.deliveryAddress || "Pickup at Cafe").replace(/"/g, '""')}"`,
      `"${o.status}"`,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal.toFixed(2),
      o.tax.toFixed(2),
      o.tipAmount.toFixed(2),
      o.deliveryFee.toFixed(2),
      o.grandTotal.toFixed(2),
      `"${o.paymentMethod}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beachwood_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportReservationsToCSV() {
    const reservations = this.getReservations();
    if (reservations.length === 0) {
      alert("No reservations to export yet.");
      return;
    }

    const headers = [
      "Reservation ID",
      "Guest Name",
      "Phone",
      "Email",
      "Party Size",
      "Date",
      "Time",
      "Seating Preference",
      "Status",
      "Special Requests",
      "Booked On",
    ];

    const rows = reservations.map((r) => [
      `"${r.reservationNumber}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.email}"`,
      `"${r.partySize}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.seating}"`,
      `"${r.status}"`,
      `"${(r.specialRequests || "").replace(/"/g, '""')}"`,
      `"${r.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Beachwood_Reservations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // --------------------------------------------------------------------------
  // 7. SEED REALISTIC SAMPLE DATA FOR TESTING & DEMO
  // --------------------------------------------------------------------------
  seedSampleData() {
    // Sample Orders
    const sampleOrders: AdminOrder[] = [
      {
        id: "ord_sample_1",
        orderNumber: "BWC-74921",
        placedAt: "Today, 10:15 AM",
        timestamp: Date.now() - 3600000 * 2,
        customerName: "Sarah Jenkins",
        customerPhone: "(323) 555-0142",
        customerEmail: "sarah.j@gmail.com",
        fulfilmentType: "pickup",
        includeUtensils: true,
        orderNote: "Extra salsa for the breakfast burrito please",
        paymentMethod: "prepay",
        cardLast4: "4242",
        items: [
          { name: "Beachwood Breakfast", quantity: 2, unitPrice: 18.0, total: 36.0 },
          { name: "Lavender Honey Latte", quantity: 2, unitPrice: 6.5, total: 13.0 },
        ],
        subtotal: 49.0,
        discountAmount: 0,
        tax: 4.66,
        deliveryFee: 0,
        tipAmount: 7.35,
        grandTotal: 61.01,
        status: "ready",
      },
      {
        id: "ord_sample_2",
        orderNumber: "BWC-83910",
        placedAt: "Today, 11:30 AM",
        timestamp: Date.now() - 3600000 * 1,
        customerName: "David Miller",
        customerPhone: "(310) 555-8821",
        customerEmail: "david.m@outlook.com",
        fulfilmentType: "delivery",
        deliveryAddress: "2840 Beachwood Dr",
        deliveryApt: "Apt 204",
        deliveryCity: "Los Angeles",
        deliveryZip: "90068",
        deliveryNotes: "Call when at gate, code #9941",
        includeUtensils: true,
        orderNote: "Gluten sensitive diner",
        paymentMethod: "prepay",
        cardLast4: "8821",
        items: [
          { name: "Avocado Toast", quantity: 1, unitPrice: 16.0, total: 16.0 },
          { name: "Cold Brew Tonic", quantity: 2, unitPrice: 6.5, total: 13.0 },
          { name: "Market Salad", quantity: 1, unitPrice: 17.0, total: 17.0 },
        ],
        subtotal: 46.0,
        discountAmount: 4.6, // BEACHWOOD10 promo
        tax: 3.93,
        deliveryFee: 3.99,
        tipAmount: 6.9,
        grandTotal: 56.22,
        status: "kitchen",
      },
      {
        id: "ord_sample_3",
        orderNumber: "BWC-91204",
        placedAt: "Today, 12:05 PM",
        timestamp: Date.now() - 1800000,
        customerName: "Emma Watson",
        customerPhone: "(424) 555-7391",
        customerEmail: "emma.w@beachwood.la",
        fulfilmentType: "pickup",
        includeUtensils: false,
        paymentMethod: "counter",
        items: [
          { name: "Chilaquiles Verdes", quantity: 1, unitPrice: 19.0, total: 19.0 },
          { name: "Matcha Latte", quantity: 1, unitPrice: 7.0, total: 7.0 },
        ],
        subtotal: 26.0,
        discountAmount: 0,
        tax: 2.47,
        deliveryFee: 0,
        tipAmount: 3.9,
        grandTotal: 32.37,
        status: "pending",
      },
    ];

    // Sample Reservations
    const sampleReservations: AdminReservation[] = [
      {
        id: "res_sample_1",
        reservationNumber: "RES-58192",
        createdAt: "Today, 09:20 AM",
        timestamp: Date.now() - 7200000,
        fullName: "Michael Chang",
        phone: "(323) 555-4819",
        email: "mchang@designla.com",
        partySize: "4 guests",
        date: "Today",
        time: "7:30 PM (Dinner)",
        seating: "Outdoor Patio",
        specialRequests: "Celebrating an anniversary, quiet table preferred",
        status: "confirmed",
      },
      {
        id: "res_sample_2",
        reservationNumber: "RES-64019",
        createdAt: "Today, 10:45 AM",
        timestamp: Date.now() - 3600000,
        fullName: "Jessica Alba",
        phone: "(310) 555-9201",
        email: "jalba@hollywood.com",
        partySize: "2 guests",
        date: "Tomorrow",
        time: "11:00 AM (Brunch)",
        seating: "Indoor Booth",
        specialRequests: "High chair needed",
        status: "confirmed",
      },
      {
        id: "res_sample_3",
        reservationNumber: "RES-71043",
        createdAt: "Yesterday, 06:15 PM",
        timestamp: Date.now() - 86400000,
        fullName: "Robert Downey",
        phone: "(213) 555-1122",
        email: "robert.d@gmail.com",
        partySize: "6 guests",
        date: "Friday",
        time: "8:00 PM (Dinner)",
        seating: "Outdoor Patio",
        specialRequests: "Chef choice wine pairing",
        status: "seated",
      },
    ];

    // Sample WhatsApp Clicks
    const sampleWhatsAppClicks: WhatsAppClickLog[] = [
      {
        id: "wa_sample_1",
        timestamp: Date.now() - 7200000,
        timeFormatted: "Today, 09:45 AM",
        source: "Menu Takeaway Order Modal",
        path: "/menu",
        details: "User initiated direct order chat",
      },
      {
        id: "wa_sample_2",
        timestamp: Date.now() - 5400000,
        timeFormatted: "Today, 10:15 AM",
        source: "Order Confirmation Screen (#BWC-74921)",
        path: "/menu",
        details: "Customer sent verified order receipt to WhatsApp",
      },
      {
        id: "wa_sample_3",
        timestamp: Date.now() - 2700000,
        timeFormatted: "Today, 11:00 AM",
        source: "Contact Page Direct WhatsApp",
        path: "/contact",
        details: "General inquiry from contact page",
      },
      {
        id: "wa_sample_4",
        timestamp: Date.now() - 900000,
        timeFormatted: "Today, 11:30 AM",
        source: "Homepage Bento Contact Card",
        path: "/",
        details: "Clicked WhatsApp from home page quick contact",
      },
    ];

    // Seed into localStorage
    safeSetJSON(STORAGE_KEYS.ORDERS, sampleOrders);
    safeSetJSON(STORAGE_KEYS.RESERVATIONS, sampleReservations);
    safeSetJSON(STORAGE_KEYS.WHATSAPP_LOGS, sampleWhatsAppClicks);

    // Seed initial view counts if 0
    const currentViews = parseInt(localStorage.getItem(STORAGE_KEYS.VISITOR_COUNT) || "0", 10);
    if (currentViews < 25) {
      localStorage.setItem(STORAGE_KEYS.VISITOR_COUNT, "48");
      // Add a few sample pageview logs
      const paths = ["/", "/menu", "/about", "/contact", "/gallery"];
      const seedLogs: VisitorLog[] = paths.map((p, i) => ({
        id: "seed_view_" + i,
        timestamp: Date.now() - (i + 1) * 1200000,
        timeFormatted: new Date(Date.now() - (i + 1) * 1200000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        path: p,
        device: i % 2 === 0 ? "mobile" : "desktop",
        visitorId: "vis_demo_" + i,
        referrer: i === 0 ? "google.com" : "instagram.com",
      }));
      safeSetJSON(STORAGE_KEYS.VISITOR_LOGS, seedLogs);
    }

    return true;
  },

  // Clear all data
  clearAllData() {
    safeSetJSON(STORAGE_KEYS.ORDERS, []);
    safeSetJSON(STORAGE_KEYS.RESERVATIONS, []);
    safeSetJSON(STORAGE_KEYS.WHATSAPP_LOGS, []);
    safeSetJSON(STORAGE_KEYS.VISITOR_LOGS, []);
    safeSetJSON(STORAGE_KEYS.NOTIFICATIONS, []);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.VISITOR_COUNT, "0");
    }
  },

  // --------------------------------------------------------------------------
  // 7. REAL-TIME NOTIFICATIONS CENTER
  // --------------------------------------------------------------------------
  getNotifications(): AdminNotification[] {
    const notifs = safeGetJSON<AdminNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifs.sort((a, b) => b.timestamp - a.timestamp);
  },

  addNotification(
    notifInput: Omit<AdminNotification, "id" | "timestamp" | "timeFormatted" | "read">
  ): AdminNotification {
    const notifs = safeGetJSON<AdminNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const now = Date.now();
    const newNotif: AdminNotification = {
      ...notifInput,
      id: "notif_" + now + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: now,
      timeFormatted: new Date(now).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      read: false,
    };
    notifs.unshift(newNotif);
    safeSetJSON(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 40));

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bwc_notification_added", { detail: newNotif })
      );
    }
    return newNotif;
  },

  markNotificationsRead(): void {
    const notifs = safeGetJSON<AdminNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    safeSetJSON(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bwc_notification_updated"));
    }
  },

  clearNotifications(): void {
    safeSetJSON(STORAGE_KEYS.NOTIFICATIONS, []);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bwc_notification_updated"));
    }
  },

  isSoundAlertEnabled(): boolean {
    if (typeof window === "undefined") return true;
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val === null ? true : val === "true";
  },

  setSoundAlertEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("bwc_sound_preference_changed", { detail: { enabled } })
    );
  },

  // --------------------------------------------------------------------------
  // 8. SERVER SYNCHRONIZATION (CROSS-DEVICE & MOBILE VIEW SYNC)
  // --------------------------------------------------------------------------
  async syncWithServer(): Promise<{
    syncedOrders: number;
    updatedOrders: number;
    syncedReservations: number;
    updatedReservations: number;
  }> {
    if (typeof window === "undefined")
      return { syncedOrders: 0, updatedOrders: 0, syncedReservations: 0, updatedReservations: 0 };
    try {
      const localOrders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
      const localReservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);

      // 1. Fetch remote orders and reservations from server
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (!res.ok)
        return { syncedOrders: 0, updatedOrders: 0, syncedReservations: 0, updatedReservations: 0 };
      const data = await res.json();
      if (!data?.success)
        return { syncedOrders: 0, updatedOrders: 0, syncedReservations: 0, updatedReservations: 0 };

      const remoteOrders: AdminOrder[] = Array.isArray(data.orders) ? data.orders : [];
      const remoteReservations: AdminReservation[] = Array.isArray(data.reservations)
        ? data.reservations
        : [];

      let newOrdersCount = 0;
      let updatedOrdersCount = 0;
      let newReservationsCount = 0;
      let updatedReservationsCount = 0;

      // Merge remote orders into local state
      const mergedOrders = [...localOrders];
      for (const remote of remoteOrders) {
        if (!remote) continue;
        const cleanRemoteNum = remote.orderNumber
          ? String(remote.orderNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const cleanRemoteId = remote.id ? String(remote.id).trim().toLowerCase() : "";

        const existingIdx = mergedOrders.findIndex((o) => {
          if (!o) return false;
          if (remote.id && o.id === remote.id) return true;
          if (remote.orderNumber && o.orderNumber === remote.orderNumber) return true;
          const oNum = o.orderNumber ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
          const oId = o.id ? String(o.id).trim().toLowerCase() : "";
          if (cleanRemoteNum && (oNum === cleanRemoteNum || oId === cleanRemoteNum)) return true;
          if (cleanRemoteId && (oId === cleanRemoteId || oNum === cleanRemoteId)) return true;
          return false;
        });

        if (existingIdx === -1) {
          mergedOrders.unshift(remote);
          newOrdersCount++;
        } else {
          const current = mergedOrders[existingIdx];
          if (
            current &&
            (remote.status !== current.status ||
              remote.cancelledBy !== current.cancelledBy ||
              remote.cancellationReason !== current.cancellationReason ||
              remote.cancelledAt !== current.cancelledAt)
          ) {
            mergedOrders[existingIdx] = { ...current, ...remote };
            updatedOrdersCount++;
          }
        }
      }

      // Merge remote reservations into local state
      const mergedReservations = [...localReservations];
      for (const remote of remoteReservations) {
        if (!remote) continue;
        const cleanRemoteResNum = remote.reservationNumber
          ? String(remote.reservationNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const cleanRemoteId = remote.id ? String(remote.id).trim().toLowerCase() : "";

        const existingIdx = mergedReservations.findIndex((r) => {
          if (!r) return false;
          if (remote.id && r.id === remote.id) return true;
          if (remote.reservationNumber && r.reservationNumber === remote.reservationNumber) return true;
          const rNum = r.reservationNumber ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase() : "";
          const rId = r.id ? String(r.id).trim().toLowerCase() : "";
          if (cleanRemoteResNum && (rNum === cleanRemoteResNum || rId === cleanRemoteResNum)) return true;
          if (cleanRemoteId && (rId === cleanRemoteId || rNum === cleanRemoteId)) return true;
          return false;
        });

        if (existingIdx === -1) {
          mergedReservations.unshift(remote);
          newReservationsCount++;
        } else {
          const current = mergedReservations[existingIdx];
          if (current && remote.status !== current.status) {
            mergedReservations[existingIdx] = { ...current, ...remote };
            updatedReservationsCount++;
          }
        }
      }

      if (newOrdersCount > 0 || updatedOrdersCount > 0) {
        safeSetJSON(
          STORAGE_KEYS.ORDERS,
          mergedOrders.sort((a, b) => b.timestamp - a.timestamp)
        );
        window.dispatchEvent(
          new CustomEvent("bwc_order_change", {
            detail: {
              action: "sync_merge",
              newCount: newOrdersCount,
              updatedCount: updatedOrdersCount,
            },
          })
        );
      }

      if (newReservationsCount > 0 || updatedReservationsCount > 0) {
        safeSetJSON(
          STORAGE_KEYS.RESERVATIONS,
          mergedReservations.sort((a, b) => b.timestamp - a.timestamp)
        );
        window.dispatchEvent(
          new CustomEvent("bwc_reservation_change", {
            detail: {
              action: "sync_merge",
              newCount: newReservationsCount,
              updatedCount: updatedReservationsCount,
            },
          })
        );
      }

      // 2. Also ensure server has our local orders and reservations (push only truly missing items)
      const unpushedOrders = localOrders.filter((lo) => {
        if (!lo) return false;
        const cleanLo = lo.orderNumber ? String(lo.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
        const cleanId = lo.id ? String(lo.id).trim().toLowerCase() : "";
        return !remoteOrders.some((ro) => {
          if (!ro) return false;
          if (ro.id && lo.id && ro.id === lo.id) return true;
          const cleanRo = ro.orderNumber ? String(ro.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
          const cleanRoId = ro.id ? String(ro.id).trim().toLowerCase() : "";
          if (cleanLo && (cleanRo === cleanLo || cleanRoId === cleanLo)) return true;
          if (cleanId && (cleanRoId === cleanId || cleanRo === cleanId)) return true;
          return false;
        });
      });

      if (unpushedOrders.length > 0) {
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders: unpushedOrders }),
        }).catch(() => {});
      }

      const unpushedReservations = localReservations.filter((lr) => {
        if (!lr) return false;
        const cleanLr = lr.reservationNumber
          ? String(lr.reservationNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const cleanId = lr.id ? String(lr.id).trim().toLowerCase() : "";
        return !remoteReservations.some((rr) => {
          if (!rr) return false;
          if (rr.id && lr.id && rr.id === lr.id) return true;
          const cleanRr = rr.reservationNumber
            ? String(rr.reservationNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const cleanRrId = rr.id ? String(rr.id).trim().toLowerCase() : "";
          if (cleanLr && (cleanRr === cleanLr || cleanRrId === cleanLr)) return true;
          if (cleanId && (cleanRrId === cleanId || cleanRr === cleanId)) return true;
          return false;
        });
      });

      if (unpushedReservations.length > 0) {
        fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservations: unpushedReservations }),
        }).catch(() => {});
      }

      return {
        syncedOrders: newOrdersCount,
        updatedOrders: updatedOrdersCount,
        syncedReservations: newReservationsCount,
        updatedReservations: updatedReservationsCount,
      };
    } catch (e) {
      console.warn("Server sync check:", e);
      return { syncedOrders: 0, updatedOrders: 0, syncedReservations: 0, updatedReservations: 0 };
    }
  },

  // --------------------------------------------------------------------------
  // 9. INSTANT INCOMING CLOUD EVENT HANDLER (SUB-100MS PUSH)
  // --------------------------------------------------------------------------
  handleIncomingCloudEvent(type: string, payload: any) {
    if (!type || !payload) return;

    if (type === "order_status" && payload.orderNumber) {
      const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
      const cleanNum = String(payload.orderNumber).replace(/^#/, "").trim().toLowerCase();
      const cleanId = payload.orderId ? String(payload.orderId).trim().toLowerCase() : "";

      const idx = orders.findIndex(
        (o) =>
          o.orderNumber.replace(/^#/, "").trim().toLowerCase() === cleanNum ||
          (cleanId && o.id.trim().toLowerCase() === cleanId)
      );

      if (idx !== -1 && orders[idx]) {
        if (
          orders[idx]!.status !== payload.status ||
          orders[idx]!.cancelledBy !== payload.cancelledBy ||
          orders[idx]!.cancellationReason !== payload.cancellationReason
        ) {
          orders[idx]!.status = payload.status;
          if (payload.cancelledBy) orders[idx]!.cancelledBy = payload.cancelledBy;
          if (payload.cancellationReason) orders[idx]!.cancellationReason = payload.cancellationReason;
          if (payload.cancelledAt) orders[idx]!.cancelledAt = payload.cancelledAt;

          safeSetJSON(STORAGE_KEYS.ORDERS, orders);
          window.dispatchEvent(
            new CustomEvent("bwc_order_change", {
              detail: payload,
            })
          );
        }
      } else if (payload.order) {
        orders.unshift(payload.order);
        safeSetJSON(STORAGE_KEYS.ORDERS, orders);
        window.dispatchEvent(
          new CustomEvent("bwc_order_change", {
            detail: payload,
          })
        );
      }
    } else if (type === "order_add" && payload.order) {
      const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
      const cleanIncoming = String(payload.order.orderNumber).replace(/^#/, "").trim().toLowerCase();
      const exists = orders.some(
        (o) =>
          o.orderNumber.replace(/^#/, "").trim().toLowerCase() === cleanIncoming ||
          o.id === payload.order.id
      );
      if (!exists) {
        orders.unshift(payload.order);
        safeSetJSON(STORAGE_KEYS.ORDERS, orders);
        window.dispatchEvent(
          new CustomEvent("bwc_order_change", {
            detail: payload,
          })
        );
      }
    } else if (type === "order_cancel" && payload.orderNumber) {
      const orders = safeGetJSON<AdminOrder[]>(STORAGE_KEYS.ORDERS, []);
      const cleanNum = String(payload.orderNumber).replace(/^#/, "").trim().toLowerCase();
      const idx = orders.findIndex((o) => o.orderNumber.replace(/^#/, "").trim().toLowerCase() === cleanNum);
      if (idx !== -1 && orders[idx] && orders[idx]!.status !== "cancelled") {
        orders[idx]!.status = "cancelled";
        orders[idx]!.cancelledBy = payload.by || "customer";
        orders[idx]!.cancelledAt = payload.cancelledAt || Date.now();
        safeSetJSON(STORAGE_KEYS.ORDERS, orders);
        window.dispatchEvent(
          new CustomEvent("bwc_order_change", {
            detail: payload,
          })
        );
      }
    } else if (type === "reservation_status" && payload.reservationNumber) {
      const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
      const cleanNum = String(payload.reservationNumber).replace(/^#/, "").trim().toLowerCase();
      const idx = reservations.findIndex(
        (r) => r.reservationNumber.replace(/^#/, "").trim().toLowerCase() === cleanNum
      );
      if (idx !== -1 && reservations[idx] && reservations[idx]!.status !== payload.status) {
        reservations[idx]!.status = payload.status;
        safeSetJSON(STORAGE_KEYS.RESERVATIONS, reservations);
        window.dispatchEvent(
          new CustomEvent("bwc_reservation_change", {
            detail: payload,
          })
        );
      }
    } else if (type === "reservation_add" && payload.reservation) {
      const reservations = safeGetJSON<AdminReservation[]>(STORAGE_KEYS.RESERVATIONS, []);
      const exists = reservations.some((r) => r.id === payload.reservation.id);
      if (!exists) {
        reservations.unshift(payload.reservation);
        safeSetJSON(STORAGE_KEYS.RESERVATIONS, reservations);
        window.dispatchEvent(
          new CustomEvent("bwc_reservation_change", {
            detail: payload,
          })
        );
      }
    }
  },
};

// Global SSE listener for instant cross-device updates (under 100ms)
if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
  let cloudEventSource: EventSource | null = null;
  const connectCloudSSE = () => {
    try {
      if (cloudEventSource) {
        cloudEventSource.close();
      }
      cloudEventSource = new EventSource(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}/sse`);
      cloudEventSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === "message" && raw.message) {
            const data = JSON.parse(raw.message);
            if (data?.type && data?.payload) {
              adminStore.handleIncomingCloudEvent(data.type, data.payload);
            }
          }
        } catch {}
      };
      cloudEventSource.onerror = () => {
        if (cloudEventSource) {
          cloudEventSource.close();
          cloudEventSource = null;
        }
        setTimeout(connectCloudSSE, 4000);
      };
    } catch {}
  };
  connectCloudSSE();
}

// Auto-trigger background server sync on initial client load
if (typeof window !== "undefined") {
  setTimeout(() => {
    adminStore.syncWithServer().catch(() => {});
  }, 1000);
}
