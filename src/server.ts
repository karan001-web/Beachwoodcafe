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

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const path = url.pathname;

  // 1. Sync endpoint: returns all orders and reservations
  if (path === "/api/sync" || path === "/api/sync/") {
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          orders: serverOrders,
          reservations: serverReservations,
          timestamp: Date.now(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }
  }

  // 2. Orders endpoints
  if (path === "/api/orders" || path === "/api/orders/") {
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          orders: serverOrders,
          total: serverOrders.length,
        }),
        { status: 200, headers: corsHeaders }
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
            const oNum = o.orderNumber ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
            const oId = o.id ? String(o.id).trim().toLowerCase() : "";
            if (cleanIncomingNum && oNum === cleanIncomingNum) return true;
            if (cleanIncomingId && oId === cleanIncomingId) return true;
            return false;
          });

          if (idx !== -1) {
            const existing = serverOrders[idx]!;
            // Do NOT let an incoming 'pending' status downgrade an already processed order (e.g. kitchen, ready, completed)
            const shouldPreserveExistingStatus =
              existing.status &&
              existing.status !== "pending" &&
              ord.status === "pending";

            serverOrders[idx] = {
              ...existing,
              ...ord,
              status: shouldPreserveExistingStatus ? existing.status : (ord.status || existing.status),
              cancelledBy: ord.cancelledBy || existing.cancelledBy,
              cancelledAt: ord.cancelledAt || existing.cancelledAt,
              cancellationReason: ord.cancellationReason || existing.cancellationReason,
            };
          } else {
            serverOrders.unshift(ord);
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
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid JSON" }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  // Update order status
  if (path === "/api/orders/update-status") {
    if (request.method === "POST") {
      try {
        const { orderId, orderNumber, status, cancelledBy, cancellationReason } = await request.json();
        const cleanId = String(orderId || "").trim().toLowerCase().replace(/^#/, "");
        const cleanNum = String(orderNumber || "").trim().toLowerCase().replace(/^#/, "");

        const idx = serverOrders.findIndex((o) => {
          if (!o) return false;
          const oNum = o.orderNumber ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
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
          if (status === "cancelled") {
            ord["cancelledBy"] = cancelledBy || "admin";
            ord["cancelledAt"] = Date.now();
            ord["cancellationReason"] = cancellationReason;
          }
          return new Response(
            JSON.stringify({ success: true, order: ord }),
            { status: 200, headers: corsHeaders }
          );
        }
        return new Response(
          JSON.stringify({ success: false, message: "Order not found" }),
          { status: 404, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  // Delete order endpoint
  if (path === "/api/orders/delete") {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const cleanId = String(body?.orderId || "").trim().toLowerCase();
        const cleanNum = String(body?.orderNumber || "").trim().toLowerCase().replace(/^#/, "");

        if (cleanId) serverDeletedOrderIds.add(cleanId);
        if (cleanNum) serverDeletedOrderIds.add(cleanNum);

        const prevCount = serverOrders.length;
        serverOrders = serverOrders.filter((o) => {
          if (!o) return false;
          const oNum = o.orderNumber ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase() : "";
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
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message }),
          { status: 400, headers: corsHeaders }
        );
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
        { status: 200, headers: corsHeaders }
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
            const rNum = r.reservationNumber ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase() : "";
            const rId = r.id ? String(r.id).trim().toLowerCase() : "";
            if (cleanIncomingNum && rNum === cleanIncomingNum) return true;
            if (cleanIncomingId && rId === cleanIncomingId) return true;
            return false;
          });

          if (idx !== -1) {
            const existing = serverReservations[idx]!;
            const shouldPreserveExistingStatus =
              existing.status &&
              existing.status !== "pending" &&
              res.status === "pending";

            serverReservations[idx] = {
              ...existing,
              ...res,
              status: shouldPreserveExistingStatus ? existing.status : (res.status || existing.status),
            };
          } else {
            serverReservations.unshift(res);
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
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid JSON" }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  // Update reservation status
  if (path === "/api/reservations/update-status") {
    if (request.method === "POST") {
      try {
        const { resId, reservationNumber, status } = await request.json();
        const cleanId = String(resId || "").trim().toLowerCase().replace(/^#/, "");
        const cleanNum = String(reservationNumber || "").trim().toLowerCase().replace(/^#/, "");

        const idx = serverReservations.findIndex((r) => {
          if (!r) return false;
          const rNum = r.reservationNumber ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase() : "";
          const rId = r.id ? String(r.id).trim().toLowerCase() : "";
          if (cleanNum && rNum === cleanNum) return true;
          if (cleanId && rId === cleanId) return true;
          return false;
        });

        if (idx !== -1 && serverReservations[idx]) {
          const res = serverReservations[idx]!;
          res["status"] = status;
          return new Response(
            JSON.stringify({ success: true, reservation: res }),
            { status: 200, headers: corsHeaders }
          );
        }
        return new Response(
          JSON.stringify({ success: false, message: "Reservation not found" }),
          { status: 404, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
  }

  // Delete reservation endpoint
  if (path === "/api/reservations/delete") {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const cleanId = String(body?.resId || "").trim().toLowerCase();
        const cleanNum = String(body?.reservationNumber || "").trim().toLowerCase().replace(/^#/, "");

        if (cleanId) serverDeletedResIds.add(cleanId);
        if (cleanNum) serverDeletedResIds.add(cleanNum);

        const prevCount = serverReservations.length;
        serverReservations = serverReservations.filter((r) => {
          if (!r) return false;
          const rNum = r.reservationNumber ? String(r.reservationNumber).replace(/^#/, "").trim().toLowerCase() : "";
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
          { status: 200, headers: corsHeaders }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message }),
          { status: 400, headers: corsHeaders }
        );
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
        { status: 200, headers: corsHeaders }
      );
    }
  }

  return new Response(JSON.stringify({ error: "API endpoint not found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, url);
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
