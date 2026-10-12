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

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const path = url.pathname;

  // 1. Sync endpoint: returns all orders and reservations
  if (path === "/api/sync" || path === "/api/sync/") {
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
