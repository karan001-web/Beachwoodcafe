import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdminOrder, AdminReservation, OrderStatus, ReservationStatus } from "./admin-store";

// Explicit Database Row Interfaces (ensures full compatibility with strict tsconfig flags)
export interface OrderDbRow {
  id: string;
  order_number: string;
  placed_at: string;
  timestamp: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfilment_type: string;
  delivery_address: string;
  delivery_apt: string;
  delivery_city: string;
  delivery_zip: string;
  delivery_notes: string;
  include_utensils: boolean;
  order_note: string;
  payment_method: string;
  card_last4: string;
  items: unknown;
  subtotal: number;
  discount_amount: number;
  tax: number;
  delivery_fee: number;
  tip_amount: number;
  grand_total: number;
  status: string;
  status_updated_at: number;
  cancelled_by: string | null;
  cancelled_at: number | null;
  cancellation_reason: string | null;
}

export interface ReservationDbRow {
  id: string;
  reservation_number: string;
  created_at_str: string;
  timestamp: number;
  full_name: string;
  phone: string;
  email: string;
  party_size: string;
  date: string;
  time: string;
  seating: string;
  special_requests: string;
  status: string;
}

// Safely retrieve environment variables across client and SSR
function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {
    // env not accessible in current context
  }
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    // process.env not accessible in current context
  }
  return "";
}

const rawSupabaseUrl = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
const rawSupabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");

export const isSupabaseConfigured = (): boolean => {
  if (!rawSupabaseUrl || !rawSupabaseAnonKey) return false;
  if (
    rawSupabaseUrl.includes("your-project-id") ||
    rawSupabaseUrl.includes("your-project.supabase.co") ||
    rawSupabaseAnonKey.includes("your-anon-key") ||
    rawSupabaseAnonKey.includes("placeholder")
  ) {
    return false;
  }
  try {
    const parsed = new URL(rawSupabaseUrl);
    return parsed.protocol.startsWith("http");
  } catch {
    return false;
  }
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ============================================================================
// DATA CONVERTERS (AdminStore types <---> Supabase PostgreSQL Rows)
// ============================================================================

export function orderToRow(order: AdminOrder): OrderDbRow {
  return {
    id: order.id,
    order_number: order.orderNumber,
    placed_at: order.placedAt,
    timestamp: order.timestamp,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || "",
    fulfilment_type: order.fulfilmentType,
    delivery_address: order.deliveryAddress || "",
    delivery_apt: order.deliveryApt || "",
    delivery_city: order.deliveryCity || "",
    delivery_zip: order.deliveryZip || "",
    delivery_notes: order.deliveryNotes || "",
    include_utensils: Boolean(order.includeUtensils),
    order_note: order.orderNote || "",
    payment_method: order.paymentMethod,
    card_last4: order.cardLast4 || "",
    items: order.items || [],
    subtotal: Number(order.subtotal) || 0,
    discount_amount: Number(order.discountAmount) || 0,
    tax: Number(order.tax) || 0,
    delivery_fee: Number(order.deliveryFee) || 0,
    tip_amount: Number(order.tipAmount) || 0,
    grand_total: Number(order.grandTotal) || 0,
    status: order.status || "pending",
    status_updated_at: order.statusUpdatedAt || order.timestamp,
    cancelled_by: order.cancelledBy || null,
    cancelled_at: order.cancelledAt || null,
    cancellation_reason: order.cancellationReason || null,
  };
}

export function rowToOrder(row: any): AdminOrder {
  const r = row as Record<string, any>;
  return {
    id: String(r["id"] || ""),
    orderNumber: String(r["order_number"] || r["orderNumber"] || ""),
    placedAt: String(
      r["placed_at"] ||
        r["placedAt"] ||
        new Date(Number(r["timestamp"]) || Date.now()).toISOString(),
    ),
    timestamp: Number(r["timestamp"]) || Date.now(),
    customerName: String(r["customer_name"] || r["customerName"] || ""),
    customerPhone: String(r["customer_phone"] || r["customerPhone"] || ""),
    customerEmail: String(r["customer_email"] || r["customerEmail"] || ""),
    fulfilmentType: (r["fulfilment_type"] || r["fulfilmentType"] || "pickup") as
      "pickup" | "delivery",
    deliveryAddress: r["delivery_address"] || r["deliveryAddress"] || undefined,
    deliveryApt: r["delivery_apt"] || r["deliveryApt"] || undefined,
    deliveryCity: r["delivery_city"] || r["deliveryCity"] || undefined,
    deliveryZip: r["delivery_zip"] || r["deliveryZip"] || undefined,
    deliveryNotes: r["delivery_notes"] || r["deliveryNotes"] || undefined,
    includeUtensils: Boolean(r["include_utensils"] ?? r["includeUtensils"]),
    orderNote: r["order_note"] || r["orderNote"] || undefined,
    paymentMethod: (r["payment_method"] || r["paymentMethod"] || "counter") as "prepay" | "counter",
    cardLast4: r["card_last4"] || r["cardLast4"] || undefined,
    items: Array.isArray(r["items"]) ? r["items"] : [],
    subtotal: Number(r["subtotal"]) || 0,
    discountAmount: Number(r["discount_amount"] || r["discountAmount"]) || 0,
    tax: Number(r["tax"]) || 0,
    deliveryFee: Number(r["delivery_fee"] || r["deliveryFee"]) || 0,
    tipAmount: Number(r["tip_amount"] || r["tipAmount"]) || 0,
    grandTotal: Number(r["grand_total"] || r["grandTotal"]) || 0,
    status: (r["status"] || "pending") as OrderStatus,
    statusUpdatedAt: r["status_updated_at"] ? Number(r["status_updated_at"]) : undefined,
    cancelledBy: r["cancelled_by"] || r["cancelledBy"] || undefined,
    cancelledAt: r["cancelled_at"] ? Number(r["cancelled_at"]) : undefined,
    cancellationReason: r["cancellation_reason"] || r["cancellationReason"] || undefined,
  };
}

export function reservationToRow(res: AdminReservation): ReservationDbRow {
  return {
    id: res.id,
    reservation_number: res.reservationNumber,
    created_at_str: res.createdAt,
    timestamp: res.timestamp,
    full_name: res.fullName,
    phone: res.phone,
    email: res.email,
    party_size: res.partySize,
    date: res.date,
    time: res.time,
    seating: res.seating,
    special_requests: res.specialRequests || "",
    status: res.status || "confirmed",
  };
}

export function rowToReservation(row: any): AdminReservation {
  const r = row as Record<string, any>;
  return {
    id: String(r["id"] || ""),
    reservationNumber: String(r["reservation_number"] || r["reservationNumber"] || ""),
    createdAt: String(
      r["created_at_str"] ||
        r["createdAt"] ||
        new Date(Number(r["timestamp"]) || Date.now()).toISOString(),
    ),
    timestamp: Number(r["timestamp"]) || Date.now(),
    fullName: String(r["full_name"] || r["fullName"] || ""),
    phone: String(r["phone"] || ""),
    email: String(r["email"] || ""),
    partySize: String(r["party_size"] || r["partySize"] || ""),
    date: String(r["date"] || ""),
    time: String(r["time"] || ""),
    seating: String(r["seating"] || ""),
    specialRequests: r["special_requests"] || r["specialRequests"] || undefined,
    status: (r["status"] || "confirmed") as ReservationStatus,
  };
}

// ============================================================================
// SUPABASE OPERATIONS WITH GRACEFUL FALLBACK
// ============================================================================

export async function fetchOrdersFromSupabase(): Promise<AdminOrder[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Supabase fetch orders error:", error.message);
      return [];
    }
    return (data || []).map(rowToOrder);
  } catch (err) {
    console.warn("Supabase fetch orders failed:", err);
    return [];
  }
}

export async function fetchSingleOrderFromSupabase(query: string): Promise<AdminOrder | null> {
  if (!supabase || !query || !query.trim()) return null;
  try {
    const raw = query.trim();
    const cleanNum = raw.replace(/^#/, "").trim();
    const cleanDigits = raw.replace(/\D/g, "");
    const hasAlpha = /[a-zA-Z]/.test(raw);

    const filterParts: string[] = [];
    if (cleanNum) {
      filterParts.push(`order_number.ilike.%${cleanNum}%`);
      filterParts.push(`id.ilike.%${cleanNum}%`);
    }
    if (!hasAlpha && cleanDigits.length >= 10) {
      filterParts.push(`customer_phone.ilike.%${cleanDigits.slice(-10)}%`);
    }

    if (filterParts.length === 0) return null;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(filterParts.join(","))
      .order("timestamp", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("Supabase fetch single order error:", error.message);
      return null;
    }

    if (data && data.length > 0 && data[0]) {
      return rowToOrder(data[0]);
    }

    return null;
  } catch (err) {
    console.warn("Supabase fetch single order failed:", err);
    return null;
  }
}

export async function upsertOrderToSupabase(order: AdminOrder): Promise<boolean> {
  if (!supabase) return false;
  try {
    const row = orderToRow(order);
    const { error } = await supabase.from("orders").upsert(row, { onConflict: "id" });
    if (error) {
      console.warn("Supabase save order error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase save order failed:", err);
    return false;
  }
}

export async function updateOrderStatusInSupabase(
  identifier: string,
  status: OrderStatus,
  extra?: {
    orderId?: string | undefined;
    orderNumber?: string | undefined;
    statusUpdatedAt?: number | undefined;
    cancelledBy?: "customer" | "admin" | undefined;
    cancelledAt?: number | undefined;
    cancellationReason?: string | undefined;
  },
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const terms = new Set<string>();
    const addTerm = (val?: string) => {
      if (!val) return;
      const raw = String(val).trim();
      if (!raw) return;
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
      }
    };

    addTerm(identifier);
    addTerm(extra?.orderId);
    addTerm(extra?.orderNumber);

    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `order_number.eq.${t}`);
    }
    const orFilter = filterParts.join(",");

    const updatePayload: Record<string, any> = {
      status,
      ["status_updated_at"]: extra?.statusUpdatedAt || Date.now(),
    };
    if (extra?.cancelledBy) updatePayload["cancelled_by"] = extra.cancelledBy;
    if (extra?.cancelledAt) updatePayload["cancelled_at"] = extra.cancelledAt;
    if (extra?.cancellationReason) updatePayload["cancellation_reason"] = extra.cancellationReason;

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .or(orFilter)
      .select();

    if (error) {
      console.warn("Supabase update order status error:", error.message);
      return false;
    }
    return Boolean(data && data.length > 0);
  } catch (err) {
    console.warn("Supabase update order status failed:", err);
    return false;
  }
}

export async function deleteOrderFromSupabase(
  identifier: string,
  extra?: { orderId?: string; orderNumber?: string },
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const terms = new Set<string>();
    const addTerm = (val?: string) => {
      if (!val) return;
      const raw = String(val).trim();
      if (!raw) return;
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
        terms.add(clean.toUpperCase());
        terms.add(`#${clean.toUpperCase()}`);
        terms.add(clean.toLowerCase());
        terms.add(`#${clean.toLowerCase()}`);
      }
    };

    addTerm(identifier);
    addTerm(extra?.orderId);
    addTerm(extra?.orderNumber);

    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `order_number.eq.${t}`);
    }
    const orFilter = filterParts.join(",");

    const { error } = await supabase.from("orders").delete().or(orFilter);

    if (error) {
      console.warn("Supabase delete order error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase delete order failed:", err);
    return false;
  }
}

export async function fetchReservationsFromSupabase(): Promise<AdminReservation[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Supabase fetch reservations error:", error.message);
      return [];
    }
    return (data || []).map(rowToReservation);
  } catch (err) {
    console.warn("Supabase fetch reservations failed:", err);
    return [];
  }
}

export async function upsertReservationToSupabase(res: AdminReservation): Promise<boolean> {
  if (!supabase) return false;
  try {
    const row = reservationToRow(res);
    const { error } = await supabase.from("reservations").upsert(row, { onConflict: "id" });
    if (error) {
      console.warn("Supabase save reservation error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase save reservation failed:", err);
    return false;
  }
}

export async function updateReservationStatusInSupabase(
  identifier: string,
  status: ReservationStatus,
  extra?: { resId?: string; reservationNumber?: string },
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const terms = new Set<string>();
    const addTerm = (val?: string) => {
      if (!val) return;
      const raw = String(val).trim();
      if (!raw) return;
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
      }
    };

    addTerm(identifier);
    addTerm(extra?.resId);
    addTerm(extra?.reservationNumber);

    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `reservation_number.eq.${t}`);
    }
    const orFilter = filterParts.join(",");

    const { error } = await supabase.from("reservations").update({ status }).or(orFilter);

    if (error) {
      console.warn("Supabase update reservation status error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase update reservation status failed:", err);
    return false;
  }
}

export async function deleteReservationFromSupabase(
  identifier: string,
  extra?: { resId?: string; reservationNumber?: string },
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const terms = new Set<string>();
    const addTerm = (val?: string) => {
      if (!val) return;
      const raw = String(val).trim();
      if (!raw) return;
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
        terms.add(clean.toUpperCase());
        terms.add(`#${clean.toUpperCase()}`);
        terms.add(clean.toLowerCase());
        terms.add(`#${clean.toLowerCase()}`);
      }
    };

    addTerm(identifier);
    addTerm(extra?.resId);
    addTerm(extra?.reservationNumber);

    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `reservation_number.eq.${t}`);
    }
    const orFilter = filterParts.join(",");

    const { error } = await supabase.from("reservations").delete().or(orFilter);

    if (error) {
      console.warn("Supabase delete reservation error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase delete reservation failed:", err);
    return false;
  }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS & BROADCAST
// ============================================================================

export function broadcastDeleteViaSupabase(
  type: "order" | "reservation",
  id?: string,
  number?: string,
) {
  if (!supabase) return;
  try {
    const channel = supabase.channel("beachwood-cafe-live-sync");
    if (type === "order") {
      channel.send({
        type: "broadcast",
        event: "order_deleted",
        payload: { orderId: id, orderNumber: number },
      });
    } else {
      channel.send({
        type: "broadcast",
        event: "reservation_deleted",
        payload: { resId: id, reservationNumber: number },
      });
    }
  } catch (err) {
    console.warn("Failed to broadcast delete via Supabase:", err);
  }
}

export function subscribeToSupabaseRealtime(callbacks: {
  onOrderInserted?: (order: AdminOrder) => void;
  onOrderUpdated?: (order: AdminOrder) => void;
  onOrderDeleted?: (id?: string, orderNumber?: string) => void;
  onReservationInserted?: (res: AdminReservation) => void;
  onReservationUpdated?: (res: AdminReservation) => void;
  onReservationDeleted?: (id?: string, reservationNumber?: string) => void;
}) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel("beachwood-cafe-live-sync")
      .on("broadcast", { event: "order_deleted" }, (payload) => {
        if (callbacks.onOrderDeleted && payload?.payload) {
          callbacks.onOrderDeleted(payload.payload.orderId, payload.payload.orderNumber);
        }
      })
      .on("broadcast", { event: "reservation_deleted" }, (payload) => {
        if (callbacks.onReservationDeleted && payload?.payload) {
          callbacks.onReservationDeleted(payload.payload.resId, payload.payload.reservationNumber);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (payload.new && callbacks.onOrderInserted) {
          callbacks.onOrderInserted(rowToOrder(payload.new));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if (payload.new && callbacks.onOrderUpdated) {
          callbacks.onOrderUpdated(rowToOrder(payload.new));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" }, (payload) => {
        if (callbacks.onOrderDeleted) {
          const oldRecord = (payload.old || {}) as Record<string, any>;
          callbacks.onOrderDeleted(oldRecord["id"], oldRecord["order_number"]);
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.new && callbacks.onReservationInserted) {
            callbacks.onReservationInserted(rowToReservation(payload.new));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.new && callbacks.onReservationUpdated) {
            callbacks.onReservationUpdated(rowToReservation(payload.new));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reservations" },
        (payload) => {
          if (callbacks.onReservationDeleted) {
            const oldRecord = (payload.old || {}) as Record<string, any>;
            callbacks.onReservationDeleted(oldRecord["id"], oldRecord["reservation_number"]);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("⚡ Supabase Realtime connected for Beachwood Cafe!");
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Failed to subscribe to Supabase Realtime:", err);
    return () => {};
  }
}
