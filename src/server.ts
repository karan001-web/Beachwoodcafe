import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// In-memory cache for cross-client real-time synchronization between mobile devices and Admin Panel
interface StoredOrder {
  id: string;
  orderNumber: string;
  timestamp: number;
  status?: string | undefined;
  statusUpdatedAt?: number | undefined;
  cancelledBy?: string | undefined;
  cancelledAt?: number | undefined;
  cancellationReason?: string | undefined;
  [key: string]: any;
}

interface StoredReservation {
  id: string;
  reservationNumber: string;
  timestamp: number;
  status?: string | undefined;
  [key: string]: any;
}

let serverOrders: StoredOrder[] = [];
let serverReservations: StoredReservation[] = [];
const serverDeletedOrderIds: Set<string> = new Set();
const serverDeletedResIds: Set<string> = new Set();
let serverClearedAt = 0;

const corsHeaders: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "cache-control": "no-store, no-cache, must-revalidate",
};

const SUPABASE_URL =
  (typeof process !== "undefined" && (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  "https://pzsdtlnbetfvrzfkphep.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof process !== "undefined" && (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  "sb_publishable_uscZ4Khg7Arye1PKQvpCBg_BP4J0Fgl";

// Server-side persistent database syncing with Supabase (guarantees cross-device permanence)
async function syncOrderToSupabaseServer(ord: StoredOrder) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const row = {
      id: String(ord.id || `ord_${Date.now()}`),
      order_number: String(ord.orderNumber || ""),
      placed_at: String(ord.placedAt || ""),
      timestamp: Number(ord.timestamp) || Date.now(),
      customer_name: String(ord.customerName || ""),
      customer_phone: String(ord.customerPhone || ""),
      customer_email: String(ord.customerEmail || ""),
      fulfilment_type: String(ord.fulfilmentType || "pickup"),
      delivery_address: String(ord.deliveryAddress || ""),
      delivery_apt: String(ord.deliveryApt || ""),
      delivery_city: String(ord.deliveryCity || ""),
      delivery_zip: String(ord.deliveryZip || ""),
      delivery_notes: String(ord.deliveryNotes || ""),
      include_utensils: Boolean(ord.includeUtensils),
      order_note: String(ord.orderNote || ""),
      payment_method: String(ord.paymentMethod || "counter"),
      card_last4: String(ord.cardLast4 || ""),
      items: Array.isArray(ord.items) ? ord.items : [],
      subtotal: Number(ord.subtotal) || 0,
      discount_amount: Number(ord.discountAmount) || 0,
      tax: Number(ord.tax) || 0,
      delivery_fee: Number(ord.deliveryFee) || 0,
      tip_amount: Number(ord.tipAmount) || 0,
      grand_total: Number(ord.grandTotal) || 0,
      status: String(ord.status || "pending"),
      status_updated_at: Number(ord.statusUpdatedAt || ord.timestamp || Date.now()),
      cancelled_by: ord.cancelledBy || null,
      cancelled_at: ord.cancelledAt || null,
      cancellation_reason: ord.cancellationReason || null,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch (err) {
    console.warn("Server Supabase order sync failed:", err);
  }
}

async function updateOrderStatusInSupabaseServer(
  identifier: string,
  status: string,
  extra?: {
    orderId?: string;
    orderNumber?: string;
    statusUpdatedAt?: number;
    cancelledBy?: string;
    cancelledAt?: number;
    cancellationReason?: string;
  },
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const patchPayload: Record<string, any> = {
      status,
      status_updated_at: extra?.statusUpdatedAt || Date.now(),
    };
    if (extra?.cancelledBy !== undefined) patchPayload.cancelled_by = extra.cancelledBy;
    if (extra?.cancelledAt !== undefined) patchPayload.cancelled_at = extra.cancelledAt;
    if (extra?.cancellationReason !== undefined) patchPayload.cancellation_reason = extra.cancellationReason;

    const terms = new Set<string>();
    const addTerm = (v?: string) => {
      if (!v) return;
      const raw = String(v).trim();
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
    if (filterParts.length === 0) return;

    await fetch(`${SUPABASE_URL}/rest/v1/orders?or=(${encodeURIComponent(filterParts.join(","))})`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchPayload),
    });
  } catch (err) {
    console.warn("Server Supabase order status update failed:", err);
  }
}

async function deleteOrderInSupabaseServer(identifier: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const terms = new Set<string>();
    const raw = String(identifier).trim();
    if (raw) {
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
      }
    }
    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `order_number.eq.${t}`);
    }
    if (filterParts.length === 0) return;

    await fetch(`${SUPABASE_URL}/rest/v1/orders?or=(${encodeURIComponent(filterParts.join(","))})`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch (err) {
    console.warn("Server Supabase order delete failed:", err);
  }
}

async function fetchOrdersFromSupabaseServer(): Promise<StoredOrder[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=timestamp.desc&limit=100`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return (data || []).map((r) => ({
      id: String(r.id || ""),
      orderNumber: String(r.order_number || ""),
      placedAt: String(r.placed_at || ""),
      timestamp: Number(r.timestamp) || Date.now(),
      customerName: String(r.customer_name || ""),
      customerPhone: String(r.customer_phone || ""),
      customerEmail: String(r.customer_email || ""),
      fulfilmentType: (r.fulfilment_type || "pickup") as "pickup" | "delivery",
      deliveryAddress: r.delivery_address || undefined,
      deliveryApt: r.delivery_apt || undefined,
      deliveryCity: r.delivery_city || undefined,
      deliveryZip: r.delivery_zip || undefined,
      deliveryNotes: r.delivery_notes || undefined,
      includeUtensils: Boolean(r.include_utensils),
      orderNote: r.order_note || undefined,
      paymentMethod: (r.payment_method || "counter") as "prepay" | "counter",
      cardLast4: r.card_last4 || undefined,
      items: Array.isArray(r.items) ? r.items : [],
      subtotal: Number(r.subtotal) || 0,
      discountAmount: Number(r.discount_amount) || 0,
      tax: Number(r.tax) || 0,
      deliveryFee: Number(r.delivery_fee) || 0,
      tipAmount: Number(r.tip_amount) || 0,
      grandTotal: Number(r.grand_total) || 0,
      status: r.status || "pending",
      statusUpdatedAt: Number(r.status_updated_at) || Number(r.timestamp) || Date.now(),
      cancelledBy: r.cancelled_by || undefined,
      cancelledAt: r.cancelled_at ? Number(r.cancelled_at) : undefined,
      cancellationReason: r.cancellation_reason || undefined,
    }));
  } catch (err) {
    console.warn("Server Supabase orders fetch error:", err);
    return [];
  }
}

async function syncReservationToSupabaseServer(res: StoredReservation) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const row = {
      id: String(res.id || `res_${Date.now()}`),
      reservation_number: String(res.reservationNumber || ""),
      created_at_str: String(res.createdAt || ""),
      timestamp: Number(res.timestamp) || Date.now(),
      full_name: String(res.fullName || ""),
      phone: String(res.phone || ""),
      email: String(res.email || ""),
      party_size: String(res.partySize || ""),
      date: String(res.date || ""),
      time: String(res.time || ""),
      seating: String(res.seating || ""),
      special_requests: String(res.specialRequests || ""),
      status: String(res.status || "confirmed"),
    };
    await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch (err) {
    console.warn("Server Supabase reservation sync failed:", err);
  }
}

async function updateReservationStatusInSupabaseServer(identifier: string, status: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const terms = new Set<string>();
    const raw = String(identifier).trim();
    if (raw) {
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
      }
    }
    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `reservation_number.eq.${t}`);
    }
    if (filterParts.length === 0) return;

    await fetch(`${SUPABASE_URL}/rest/v1/reservations?or=(${encodeURIComponent(filterParts.join(","))})`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.warn("Server Supabase reservation status update failed:", err);
  }
}

async function deleteReservationInSupabaseServer(identifier: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const terms = new Set<string>();
    const raw = String(identifier).trim();
    if (raw) {
      terms.add(raw);
      const clean = raw.replace(/^#/, "").trim();
      if (clean) {
        terms.add(clean);
        terms.add(`#${clean}`);
      }
    }
    const filterParts: string[] = [];
    for (const t of terms) {
      filterParts.push(`id.eq.${t}`, `reservation_number.eq.${t}`);
    }
    if (filterParts.length === 0) return;

    await fetch(`${SUPABASE_URL}/rest/v1/reservations?or=(${encodeURIComponent(filterParts.join(","))})`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch (err) {
    console.warn("Server Supabase reservation delete failed:", err);
  }
}

async function fetchReservationsFromSupabaseServer(): Promise<StoredReservation[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?select=*&order=timestamp.desc&limit=100`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return (data || []).map((r) => ({
      id: String(r.id || ""),
      reservationNumber: String(r.reservation_number || ""),
      createdAt: String(r.created_at_str || ""),
      timestamp: Number(r.timestamp) || Date.now(),
      fullName: String(r.full_name || ""),
      phone: String(r.phone || ""),
      email: String(r.email || ""),
      partySize: String(r.party_size || ""),
      date: String(r.date || ""),
      time: String(r.time || ""),
      seating: String(r.seating || ""),
      specialRequests: r.special_requests || undefined,
      status: r.status || "confirmed",
    }));
  } catch (err) {
    console.warn("Server Supabase reservations fetch error:", err);
    return [];
  }
}

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const path = url.pathname;

  // 1. Sync endpoint: returns all orders and reservations
  if (path === "/api/sync" || path === "/api/sync/") {
    if (request.method === "GET") {
      if (serverOrders.length === 0) {
        const remote = await fetchOrdersFromSupabaseServer();
        if (remote.length > 0) serverOrders = remote;
      }
      if (serverReservations.length === 0) {
        const remoteRes = await fetchReservationsFromSupabaseServer();
        if (remoteRes.length > 0) serverReservations = remoteRes;
      }
      const activeOrders = serverOrders.filter((o) => {
        if (!o) return false;
        const oNum = o.orderNumber
          ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const oId = o.id ? String(o.id).trim().toLowerCase() : "";
        if (oNum && serverDeletedOrderIds.has(oNum)) return false;
        if (oId && serverDeletedOrderIds.has(oId)) return false;
        if (serverClearedAt && o.timestamp && o.timestamp <= serverClearedAt) return false;
        return true;
      });
      const activeReservations = serverReservations.filter((r) => {
        if (!r) return false;
        const rNum = r.reservationNumber
          ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const rId = r.id ? String(r.id).trim().toLowerCase() : "";
        if (rNum && serverDeletedResIds.has(rNum)) return false;
        if (rId && serverDeletedResIds.has(rId)) return false;
        if (serverClearedAt && r.timestamp && r.timestamp <= serverClearedAt) return false;
        return true;
      });
      return new Response(
        JSON.stringify({
          success: true,
          orders: activeOrders,
          reservations: activeReservations,
          timestamp: Date.now(),
        }),
        { status: 200, headers: corsHeaders },
      );
    }
  }

  // 2. Orders endpoints
  if (path === "/api/orders" || path === "/api/orders/") {
    if (request.method === "GET") {
      const activeOrders = serverOrders.filter((o) => {
        if (!o) return false;
        const oNum = o.orderNumber
          ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
          : "";
        const oId = o.id ? String(o.id).trim().toLowerCase() : "";
        if (oNum && serverDeletedOrderIds.has(oNum)) return false;
        if (oId && serverDeletedOrderIds.has(oId)) return false;
        if (serverClearedAt && o.timestamp && o.timestamp <= serverClearedAt) return false;
        return true;
      });
      return new Response(
        JSON.stringify({
          success: true,
          orders: activeOrders,
          total: activeOrders.length,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const incomingOrders: StoredOrder[] = Array.isArray(body?.orders)
          ? body.orders
          : body?.order
            ? [body.order]
            : [];

        for (const ord of incomingOrders) {
          if (!ord) continue;
          const cleanIncomingNum = ord.orderNumber
            ? String(ord.orderNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const cleanIncomingId = ord.id ? String(ord.id).trim().toLowerCase() : "";

          // Do NOT restore deleted orders or orders placed prior to clear-all
          if (cleanIncomingNum && serverDeletedOrderIds.has(cleanIncomingNum)) continue;
          if (cleanIncomingId && serverDeletedOrderIds.has(cleanIncomingId)) continue;
          if (serverClearedAt && ord.timestamp && ord.timestamp <= serverClearedAt) continue;

          const idx = serverOrders.findIndex((o) => {
            if (!o) return false;
            const oNum = o.orderNumber
              ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
              : "";
            const oId = o.id ? String(o.id).trim().toLowerCase() : "";
            if (cleanIncomingNum && oNum === cleanIncomingNum) return true;
            if (cleanIncomingId && oId === cleanIncomingId) return true;
            return false;
          });

          if (idx !== -1) {
            const existing = serverOrders[idx]!;
            const existingUpdated = existing.statusUpdatedAt || existing.timestamp || 0;
            const incomingUpdated = ord.statusUpdatedAt || ord.timestamp || 0;
            const isExistingNewer = existingUpdated > incomingUpdated;

            serverOrders[idx] = {
              ...existing,
              ...ord,
              status: isExistingNewer ? existing.status : ord.status || existing.status,
              statusUpdatedAt: Math.max(existingUpdated, incomingUpdated),
              cancelledBy: ord.cancelledBy || existing.cancelledBy,
              cancelledAt: ord.cancelledAt || existing.cancelledAt,
              cancellationReason: ord.cancellationReason || existing.cancellationReason,
            };
            syncOrderToSupabaseServer(serverOrders[idx]!).catch(() => {});
          } else {
            serverOrders.unshift(ord);
            syncOrderToSupabaseServer(ord).catch(() => {});
          }
        }

        // Limit in-memory cache to last 200 orders
        if (serverOrders.length > 200) serverOrders.length = 200;

        return new Response(
          JSON.stringify({
            success: true,
            count: serverOrders.length,
            orders: serverOrders,
          }),
          { status: 200, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid JSON" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }
  }

  // Update order status
  if (path === "/api/orders/update-status") {
    if (request.method === "POST") {
      try {
        const { orderId, orderNumber, status, statusUpdatedAt, cancelledBy, cancellationReason } =
          await request.json();
        const cleanId = String(orderId || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");
        const cleanNum = String(orderNumber || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");

        const idx = serverOrders.findIndex((o) => {
          if (!o) return false;
          const oNum = o.orderNumber
            ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const oId = o.id ? String(o.id).trim().toLowerCase() : "";

          // Exact orderNumber matches take top priority
          if (cleanNum && oNum === cleanNum) return true;
          // Exact id matches next
          if (cleanId && oId === cleanId) return true;
          return false;
        });

        if (idx !== -1 && serverOrders[idx]) {
          const ord = serverOrders[idx]!;
          ord["status"] = status;
          ord["statusUpdatedAt"] = statusUpdatedAt || Date.now();
          if (status === "cancelled") {
            ord["cancelledBy"] = cancelledBy || "admin";
            ord["cancelledAt"] = Date.now();
            ord["cancellationReason"] = cancellationReason;
          }
          updateOrderStatusInSupabaseServer(cleanId || cleanNum, status, {
            orderId: cleanId,
            orderNumber: cleanNum,
            statusUpdatedAt: ord["statusUpdatedAt"],
            cancelledBy: ord["cancelledBy"],
            cancelledAt: ord["cancelledAt"],
            cancellationReason: ord["cancellationReason"],
          }).catch(() => {});

          return new Response(JSON.stringify({ success: true, order: ord }), {
            status: 200,
            headers: corsHeaders,
          });
        }

        // If order wasn't in ephemeral memory, create an entry so future /api/sync returns it
        const newOrd: StoredOrder = {
          id: orderId || `ord_${Date.now()}`,
          orderNumber: orderNumber || cleanNum || "",
          timestamp: Date.now(),
          status,
          statusUpdatedAt: statusUpdatedAt || Date.now(),
          cancelledBy: status === "cancelled" ? cancelledBy || "admin" : undefined,
          cancelledAt: status === "cancelled" ? Date.now() : undefined,
          cancellationReason,
        };
        serverOrders.unshift(newOrd);
        updateOrderStatusInSupabaseServer(cleanId || cleanNum, status, {
          orderId: cleanId,
          orderNumber: cleanNum,
          statusUpdatedAt: newOrd.statusUpdatedAt,
          cancelledBy: newOrd.cancelledBy,
          cancelledAt: newOrd.cancelledAt,
          cancellationReason: newOrd.cancellationReason,
        }).catch(() => {});

        return new Response(JSON.stringify({ success: true, order: newOrd, created: true }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }
  }

  // Delete order endpoint
  if (path === "/api/orders/delete") {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const cleanId = String(body?.orderId || "")
          .trim()
          .toLowerCase();
        const cleanNum = String(body?.orderNumber || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");

        if (cleanId) serverDeletedOrderIds.add(cleanId);
        if (cleanNum) serverDeletedOrderIds.add(cleanNum);

        deleteOrderInSupabaseServer(cleanId || cleanNum).catch(() => {});

        const prevCount = serverOrders.length;
        serverOrders = serverOrders.filter((o) => {
          if (!o) return false;
          const oNum = o.orderNumber
            ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const oId = o.id ? String(o.id).trim().toLowerCase() : "";
          if (cleanNum && oNum === cleanNum) return false;
          if (cleanId && oId === cleanId) return false;
          return true;
        });

        return new Response(
          JSON.stringify({
            success: true,
            deletedCount: prevCount - serverOrders.length,
            remaining: serverOrders.length,
          }),
          { status: 200, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }
  }

  // 3. Reservations endpoints
  if (path === "/api/reservations" || path === "/api/reservations/") {
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          reservations: serverReservations,
          total: serverReservations.length,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const incomingReservations: StoredReservation[] = Array.isArray(body?.reservations)
          ? body.reservations
          : body?.reservation
            ? [body.reservation]
            : [];

        for (const res of incomingReservations) {
          if (!res) continue;
          const cleanIncomingNum = res.reservationNumber
            ? String(res.reservationNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const cleanIncomingId = res.id ? String(res.id).trim().toLowerCase() : "";

          // Do NOT restore deleted reservations or reservations placed prior to clear-all
          if (cleanIncomingNum && serverDeletedResIds.has(cleanIncomingNum)) continue;
          if (cleanIncomingId && serverDeletedResIds.has(cleanIncomingId)) continue;
          if (serverClearedAt && res.timestamp && res.timestamp <= serverClearedAt) continue;

          const idx = serverReservations.findIndex((r) => {
            if (!r) return false;
            const rNum = r.reservationNumber
              ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase()
              : "";
            const rId = r.id ? String(r.id).trim().toLowerCase() : "";
            if (cleanIncomingNum && rNum === cleanIncomingNum) return true;
            if (cleanIncomingId && rId === cleanIncomingId) return true;
            return false;
          });

          if (idx !== -1) {
            const existing = serverReservations[idx]!;
            const shouldPreserveExistingStatus =
              existing.status && existing.status !== "pending" && res.status === "pending";

            serverReservations[idx] = {
              ...existing,
              ...res,
              status: shouldPreserveExistingStatus
                ? existing.status
                : res.status || existing.status,
            };
            syncReservationToSupabaseServer(serverReservations[idx]!).catch(() => {});
          } else {
            serverReservations.unshift(res);
            syncReservationToSupabaseServer(res).catch(() => {});
          }
        }

        // Limit in-memory cache to last 200 reservations
        if (serverReservations.length > 200) serverReservations.length = 200;

        return new Response(
          JSON.stringify({
            success: true,
            count: serverReservations.length,
            reservations: serverReservations,
          }),
          { status: 200, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid JSON" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }
  }

  // Update reservation status
  if (path === "/api/reservations/update-status") {
    if (request.method === "POST") {
      try {
        const { resId, reservationNumber, status } = await request.json();
        const cleanId = String(resId || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");
        const cleanNum = String(reservationNumber || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");

        const idx = serverReservations.findIndex((r) => {
          if (!r) return false;
          const rNum = r.reservationNumber
            ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const rId = r.id ? String(r.id).trim().toLowerCase() : "";
          if (cleanNum && rNum === cleanNum) return true;
          if (cleanId && rId === cleanId) return true;
          return false;
        });

        if (idx !== -1 && serverReservations[idx]) {
          const res = serverReservations[idx]!;
          res["status"] = status;
          updateReservationStatusInSupabaseServer(cleanId || cleanNum, status).catch(() => {});

          return new Response(JSON.stringify({ success: true, reservation: res }), {
            status: 200,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify({ success: false, message: "Reservation not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }
  }

  // Delete reservation endpoint
  if (path === "/api/reservations/delete") {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const cleanId = String(body?.resId || "")
          .trim()
          .toLowerCase();
        const cleanNum = String(body?.reservationNumber || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");

        if (cleanId) serverDeletedResIds.add(cleanId);
        if (cleanNum) serverDeletedResIds.add(cleanNum);

        deleteReservationInSupabaseServer(cleanId || cleanNum).catch(() => {});

        const prevCount = serverReservations.length;
        serverReservations = serverReservations.filter((r) => {
          if (!r) return false;
          const rNum = r.reservationNumber
            ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const rId = r.id ? String(r.id).trim().toLowerCase() : "";
          if (cleanNum && rNum === cleanNum) return false;
          if (cleanId && rId === cleanId) return false;
          return true;
        });

        return new Response(
          JSON.stringify({
            success: true,
            deletedCount: prevCount - serverReservations.length,
            remaining: serverReservations.length,
          }),
          { status: 200, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }
  }

  // 7. Stripe: Direct Test Payment Processing
  if (path === "/api/stripe/process-payment" || path === "/api/stripe/process-payment/") {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const {
          amount,
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          cardNumber,
          cardExp,
          cardCvc,
          cardZip,
          testScenario,
        } = body;

        const secretKey =
          process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || "";

        const numAmount = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
        const amountInCents = Math.max(50, Math.round(numAmount * 100)); // Minimum Stripe charge is $0.50

        // Normalize card number to determine Stripe test token/scenario
        const cleanDigits = String(cardNumber || "").replace(/[^0-9]/g, "");
        let paymentMethodToken = "pm_card_visa";

        if (
          testScenario === "decline" ||
          cleanDigits === "4000000000000002" ||
          cleanDigits.endsWith("0002")
        ) {
          paymentMethodToken = "pm_card_chargeDeclined";
        } else if (
          testScenario === "insufficient_funds" ||
          cleanDigits === "4000000000000999" ||
          cleanDigits.endsWith("0999")
        ) {
          paymentMethodToken = "pm_card_chargeDeclinedInsufficientFunds";
        } else if (
          testScenario === "expired" ||
          cleanDigits === "4000000000000069" ||
          cleanDigits.endsWith("0069")
        ) {
          paymentMethodToken = "pm_card_chargeDeclinedExpiredCard";
        } else if (
          testScenario === "incorrect_cvc" ||
          cleanDigits === "4000000000000085" ||
          cleanDigits.endsWith("0085")
        ) {
          paymentMethodToken = "pm_card_chargeDeclinedIncorrectCvc";
        } else {
          paymentMethodToken = "pm_card_visa";
        }

        const stripeParams = new URLSearchParams();
        stripeParams.append("amount", String(amountInCents));
        stripeParams.append("currency", "usd");
        stripeParams.append("payment_method", paymentMethodToken);
        stripeParams.append("confirm", "true");
        stripeParams.append("return_url", "https://beachwoodcafe.vercel.app");
        stripeParams.append(
          "description",
          `Beachwood Cafe Order ${orderNumber || "New"} - ${customerName || "Customer"}`
        );
        if (orderNumber) stripeParams.append("metadata[orderNumber]", String(orderNumber));
        if (customerName) stripeParams.append("metadata[customerName]", String(customerName));
        if (customerEmail) stripeParams.append("metadata[customerEmail]", String(customerEmail));
        if (customerPhone) stripeParams.append("metadata[customerPhone]", String(customerPhone));

        const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: stripeParams.toString(),
        });

        const stripeData = (await stripeRes.json()) as any;

        if (!stripeRes.ok || stripeData?.error) {
          const errObj = stripeData?.error || {};
          return new Response(
            JSON.stringify({
              success: false,
              error: errObj.message || "Card transaction was declined by Stripe.",
              code: errObj.decline_code || errObj.code || "card_declined",
              paymentIntentId: errObj.payment_intent?.id,
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: stripeData.status,
            paymentIntentId: stripeData.id,
            chargeId: stripeData.latest_charge,
            amount: (stripeData.amount / 100).toFixed(2),
            currency: stripeData.currency,
            livemode: stripeData.livemode,
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Internal Stripe error" }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
  }

  // 8. Stripe: Hosted Checkout Session Creation
  if (
    path === "/api/stripe/create-checkout-session" ||
    path === "/api/stripe/create-checkout-session/"
  ) {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { orderNumber, customerName, customerEmail, grandTotal, originUrl } = body;

        const secretKey =
          process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || "";

        const numAmount =
          typeof grandTotal === "number" ? grandTotal : parseFloat(String(grandTotal || 0));
        const amountInCents = Math.max(50, Math.round(numAmount * 100));

        const baseOrigin =
          originUrl ||
          request.headers.get("origin") ||
          request.headers.get("referer")?.replace(/\/$/, "") ||
          "https://beachwoodcafe.vercel.app";

        const cleanBaseOrigin = baseOrigin.replace(/\/+$/, "");

        const stripeParams = new URLSearchParams();
        stripeParams.append("mode", "payment");
        stripeParams.append(
          "success_url",
          `${cleanBaseOrigin}/?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(
            orderNumber || ""
          )}`
        );
        stripeParams.append("cancel_url", `${cleanBaseOrigin}/?stripe_checkout=cancelled`);
        stripeParams.append("line_items[0][price_data][currency]", "usd");
        stripeParams.append(
          "line_items[0][price_data][product_data][name]",
          `Beachwood Cafe Order ${orderNumber ? `#${orderNumber}` : ""}`
        );
        stripeParams.append(
          "line_items[0][price_data][product_data][description]",
          `Hollywood Hills Fresh Dining • ${customerName || "Takeout / Delivery"}`
        );
        stripeParams.append("line_items[0][price_data][unit_amount]", String(amountInCents));
        stripeParams.append("line_items[0][quantity]", "1");

        if (customerEmail) {
          stripeParams.append("customer_email", customerEmail);
        }
        if (orderNumber) stripeParams.append("metadata[orderNumber]", String(orderNumber));
        if (customerName) stripeParams.append("metadata[customerName]", String(customerName));

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: stripeParams.toString(),
        });

        const session = (await stripeRes.json()) as any;

        if (!stripeRes.ok || session?.error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: session?.error?.message || "Failed to create checkout session",
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: session.id,
            url: session.url,
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err?.message || "Error creating checkout session",
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
  }

  // 9. Stripe: Verify Checkout Session
  if (path === "/api/stripe/verify-session" || path === "/api/stripe/verify-session/") {
    if (request.method === "GET") {
      try {
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing sessionId parameter" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const secretKey =
          process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || "";

        const stripeRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
          }
        );

        const session = (await stripeRes.json()) as any;

        if (!stripeRes.ok || session?.error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: session?.error?.message || "Session not found",
            }),
            { status: 404, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: session.status,
            paymentStatus: session.payment_status,
            paymentIntentId: session.payment_intent,
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
            amountTotal: session.amount_total
              ? (session.amount_total / 100).toFixed(2)
              : undefined,
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }
  }

  // Clear all data endpoint (orders, reservations, and caches)
  if (path === "/api/clear-all" || path === "/api/clear-all/") {
    if (request.method === "POST") {
      serverOrders = [];
      serverReservations = [];
      serverDeletedOrderIds.clear();
      serverDeletedResIds.clear();
      serverClearedAt = Date.now();
      return new Response(
        JSON.stringify({ success: true, message: "All server orders and reservations cleared" }),
        { status: 200, headers: corsHeaders },
      );
    }
  }

  return new Response(JSON.stringify({ error: "API endpoint not found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

function getChromeNetErrorHtml(host: string): string {
  const cleanHost = host.replace(/:\d+$/, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${cleanHost}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M4 3h11l5 5v13H4V3z' stroke='%239aa0a6' stroke-width='2'/%3E%3Cpath d='M15 3v5h5' stroke='%239aa0a6' stroke-width='2'/%3E%3Crect x='8' y='11' width='2' height='2' fill='%239aa0a6'/%3E%3Crect x='14' y='11' width='2' height='2' fill='%239aa0a6'/%3E%3Cpath d='M9 17c1.5-1.5 4.5-1.5 6 0' stroke='%239aa0a6' stroke-width='2'/%3E%3C/svg%3E">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #202124;
      color: #9aa0a6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      max-width: 560px;
      width: 100%;
      margin: 0 auto;
      text-align: left;
    }
    .icon {
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 500;
      color: #e8eaed;
      margin: 0 0 16px 0;
      line-height: 1.3;
      letter-spacing: -0.2px;
    }
    p {
      font-size: 13px;
      color: #9aa0a6;
      margin: 0 0 16px 0;
      line-height: 20px;
    }
    p.secondary {
      margin-bottom: 24px;
    }
    .link {
      color: #8ab4f8;
      text-decoration: none;
      cursor: pointer;
    }
    .error-code {
      font-size: 11px;
      color: #9aa0a6;
      font-weight: 500;
      letter-spacing: 0.5px;
      margin: 0 0 32px 0;
    }
    button {
      background-color: #8ab4f8;
      color: #202124;
      border: none;
      border-radius: 100px;
      padding: 8px 24px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      outline: none;
      transition: background-color 0.15s ease;
    }
    button:hover {
      background-color: #93bbf9;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3H15L20 8V21H4V3Z" stroke="#9aa0a6" stroke-width="1.75" stroke-linejoin="round" />
          <path d="M15 3V8H20" stroke="#9aa0a6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="8" y="11" width="1.8" height="1.8" fill="#9aa0a6" />
          <rect x="14" y="11" width="1.8" height="1.8" fill="#9aa0a6" />
          <path d="M9 17C10.5 15.2 13.5 15.2 15 17" stroke="#9aa0a6" stroke-width="1.75" stroke-linecap="round" />
        </svg>
      </div>
      <h1>This site can’t be reached</h1>
      <p>Check if there is a typo in ${cleanHost}.</p>
      <p class="secondary">If spelling is correct, <span class="link" onclick="window.location.reload()">try running Windows Network Diagnostics</span>.</p>
      <div class="error-code">DNS_PROBE_FINISHED_NXDOMAIN</div>
      <button type="button" onclick="window.location.reload()">Reload</button>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, url);
      }

      if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
        const host = request.headers.get("host") || "beachwoodcafe.vercel.app";
        return new Response(getChromeNetErrorHtml(host), {
          status: 404,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "x-robots-tag": "noindex, nofollow",
          },
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
