import "./lib/error-capture";
import { createHmac, createHash, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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
  placedAt?: string | undefined;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  customerEmail?: string | undefined;
  fulfilmentType?: string | undefined;
  deliveryAddress?: string | undefined;
  deliveryApt?: string | undefined;
  deliveryCity?: string | undefined;
  deliveryZip?: string | undefined;
  deliveryNotes?: string | undefined;
  includeUtensils?: boolean | undefined;
  orderNote?: string | undefined;
  paymentMethod?: string | undefined;
  cardLast4?: string | undefined;
  stripePaymentId?: string | undefined;
  stripeStatus?: string | undefined;
  cancelToken?: string | undefined;
  items?: Array<{ name?: string; quantity?: number; unitPrice?: number; total?: number }> | undefined;
  subtotal?: number | undefined;
  discountAmount?: number | undefined;
  tax?: number | undefined;
  deliveryFee?: number | undefined;
  tipAmount?: number | undefined;
  grandTotal?: number | undefined;
  promoCode?: string | undefined;
  status?: string | undefined;
  statusUpdatedAt?: number | undefined;
  cancelledBy?: string | undefined;
  cancelledAt?: number | undefined;
  cancellationReason?: string | undefined;
  cancelled_by?: string | undefined;
  cancelled_at?: number | undefined;
  cancellation_reason?: string | undefined;
  [key: string]: any;
}

interface StoredReservation {
  id: string;
  reservationNumber: string;
  timestamp: number;
  createdAt?: string | undefined;
  fullName?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  partySize?: number | string | undefined;
  date?: string | undefined;
  time?: string | undefined;
  seating?: string | undefined;
  specialRequests?: string | undefined;
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

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL?: string;
      VITE_SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      SUPABASE_SERVICE_KEY?: string;
      ADMIN_SESSION_SECRET?: string;
      ADMIN_USERNAME?: string;
      ADMIN_PASSWORD_HASH?: string;
      NODE_ENV?: string;
      VERCEL_ENV?: string;
      STRIPE_SECRET_KEY?: string;
      VITE_STRIPE_SECRET_KEY?: string;
    }
  }
}

const SUPABASE_URL =
  (typeof process !== "undefined" && (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  "https://pzsdtlnbetfvrzfkphep.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof process !== "undefined" && (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  "sb_publishable_uscZ4Khg7Arye1PKQvpCBg_BP4J0Fgl";

// Server-side authoritative key for database mutations and cross-device syncing
function getSupabaseServerKey(): string {
  const serviceKey =
    (typeof process !== "undefined" &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)) ||
    "";

  if (serviceKey && serviceKey.trim().length > 20) {
    return serviceKey.trim();
  }

  return SUPABASE_ANON_KEY;
}

// Server-side authoritative admin session signing secret and credentials
function getAdminSessionSecret(): string {
  const secret = (typeof process !== "undefined" && process.env.ADMIN_SESSION_SECRET) || "";
  const isProduction =
    (typeof process !== "undefined" &&
      (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production")) ||
    false;

  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }

  if (isProduction) {
    // Fail safely in production if ADMIN_SESSION_SECRET is not configured
    throw new Error(
      "[CRITICAL SECURITY CONFIGURATION ERROR] ADMIN_SESSION_SECRET is missing or too short. " +
        "A high-entropy ADMIN_SESSION_SECRET must be configured as a server-only environment variable in Vercel project settings.",
    );
  }

  // Development/test fallback only (never used in production)
  return "dev_secret_local_only_beachwood_2026_x89k_insecure_for_prod";
}

// Password hashing and verification using memory-hard scrypt (OWASP recommended)
// Preserves existing legacy SHA-256 hash for seamless backward compatibility
function hashPasswordWithScrypt(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedKey] = parts;
    if (!salt || !expectedKey) return false;
    try {
      const derivedKey = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
      const derivedBuf = Buffer.from(derivedKey, "hex");
      const expectedBuf = Buffer.from(expectedKey, "hex");
      return derivedBuf.length === expectedBuf.length && timingSafeEqual(derivedBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 hash verification (existing admin credentials: username '778800')
  try {
    const computedHash = createHash("sha256").update(password).digest("hex");
    const userBuf = Buffer.from(computedHash);
    const serverBuf = Buffer.from(storedHash);
    if (userBuf.length === serverBuf.length && timingSafeEqual(userBuf, serverBuf)) {
      return true;
    }
    // Backward compatibility: also support '778800' if storedHash is default legacy hash
    const legacyAltHash = createHash("sha256").update("778800").digest("hex");
    const altBuf = Buffer.from(legacyAltHash);
    if (
      storedHash === "75ca0ab7b09a1603ef1c83b8c2d1de3acb078b9c92824803e156016f97948b3f" &&
      userBuf.length === altBuf.length &&
      timingSafeEqual(userBuf, altBuf)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Durable server-side credentials store
let serverAdminUsername =
  (typeof process !== "undefined" && process.env.ADMIN_USERNAME) || "778800";
let serverAdminPasswordHash =
  (typeof process !== "undefined" && process.env.ADMIN_PASSWORD_HASH) ||
  "75ca0ab7b09a1603ef1c83b8c2d1de3acb078b9c92824803e156016f97948b3f";

const CREDENTIALS_STORE_PATH =
  typeof process !== "undefined"
    ? join(process.cwd(), ".data", "admin-credentials.json")
    : "";

function loadDurableCredentials() {
  if (typeof process !== "undefined") {
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim()) {
      serverAdminUsername = process.env.ADMIN_USERNAME.trim();
    }
    if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.trim()) {
      serverAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH.trim();
    }
  }
  if (!CREDENTIALS_STORE_PATH) return;
  try {
    if (existsSync(CREDENTIALS_STORE_PATH)) {
      const raw = readFileSync(CREDENTIALS_STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (!process.env.ADMIN_USERNAME && parsed?.username && typeof parsed.username === "string") {
        serverAdminUsername = parsed.username;
      }
      if (!process.env.ADMIN_PASSWORD_HASH && parsed?.passwordHash && typeof parsed.passwordHash === "string") {
        serverAdminPasswordHash = parsed.passwordHash;
      }
    }
  } catch {
    // Non-fatal if filesystem is read-only or file missing
  }
}

function saveDurableCredentials(username: string, passwordHash: string) {
  if (!CREDENTIALS_STORE_PATH) return;
  try {
    const dir = join(process.cwd(), ".data");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(
      CREDENTIALS_STORE_PATH,
      JSON.stringify({ username, passwordHash, updatedAt: Date.now() }, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.warn("Could not save durable credentials file:", err);
  }
}

// Initialize durable credentials on startup
loadDurableCredentials();

// IP extraction utility
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || "unknown";
}

// IP-based sliding window rate limiter for login attempts
interface RateLimitRecord {
  failures: number;
  firstFailureTime: number;
  blockedUntil: number;
}
const loginRateLimits = new Map<string, RateLimitRecord>();

function isIpRateLimited(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  const now = Date.now();
  const rec = loginRateLimits.get(ip);
  if (!rec) return false;
  if (rec.blockedUntil > now) return true;
  if (now - rec.firstFailureTime > 5 * 60 * 1000) {
    loginRateLimits.delete(ip);
    return false;
  }
  return false;
}

function recordFailedLogin(ip: string) {
  if (!ip || ip === "unknown") return;
  const now = Date.now();
  const rec = loginRateLimits.get(ip) || { failures: 0, firstFailureTime: now, blockedUntil: 0 };
  if (now - rec.firstFailureTime > 5 * 60 * 1000) {
    rec.failures = 1;
    rec.firstFailureTime = now;
    rec.blockedUntil = 0;
  } else {
    rec.failures += 1;
  }
  if (rec.failures >= 5) {
    rec.blockedUntil = now + 5 * 60 * 1000; // Block IP for 5 minutes
  }
  loginRateLimits.set(ip, rec);
}

function resetFailedLogin(ip: string) {
  if (ip && ip !== "unknown") {
    loginRateLimits.delete(ip);
  }
}

// Sliding window rate limiters for abuse-sensitive public endpoints
interface SlidingWindowRateLimit {
  count: number;
  resetAt: number;
}

const trackingRateLimits = new Map<string, SlidingWindowRateLimit>();
function isTrackingRateLimited(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  const now = Date.now();
  const rec = trackingRateLimits.get(ip);
  if (!rec || now > rec.resetAt) {
    trackingRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 30; // Max 30 lookups per minute per IP
}

const orderRateLimits = new Map<string, SlidingWindowRateLimit>();
function isOrderRateLimited(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  const now = Date.now();
  const rec = orderRateLimits.get(ip);
  if (!rec || now > rec.resetAt) {
    orderRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 10; // Max 10 orders per minute per IP
}

const reservationRateLimits = new Map<string, SlidingWindowRateLimit>();
function isReservationRateLimited(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  const now = Date.now();
  const rec = reservationRateLimits.get(ip);
  if (!rec || now > rec.resetAt) {
    reservationRateLimits.set(ip, { count: 1, resetAt: now + 5 * 60000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 6; // Max 6 reservations per 5 minutes per IP
}

// Trusted server-side menu catalog & prices for order calculation verification
const MENU_PRICES_CATALOG: Record<string, number> = {
  // Breakfast
  "lemon ricotta pancakes": 18,
  "ricotta avocado toast": 16,
  "chilaquiles": 17,
  "huevos rancheros": 17,
  "the beach burrito": 16,
  "vegan burrito": 16,
  "smoked salmon benedict": 21,
  "breakfast sandwich": 15,
  "the dell grain bowl": 17,
  "acai superfood bowl": 14,
  "brioche french toast": 16,
  "canyon scramble": 16,
  // Lunch
  "fez grain bowl": 17,
  "sophia sesame bowl": 16,
  "fiesta carnitas bowl": 18,
  "hollywood kale caesar": 15,
  "beachwood cheeseburger": 19,
  "artisan black bean burger": 17,
  "chicken pesto melt": 18,
  "canyon banh mi": 18,
  // Dinner & share
  "charred tomato burrata": 16,
  "whipped eggplant & warm pita": 14,
  "brussels sprout petals": 13,
  "crispy cauliflower with garlic tahini": 14,
  "spinach & artichoke dip": 15,
  "chipotle lime salmon tacos": 22,
  "grilled wild salmon bowl": 24,
  "braised short rib tagliatelle": 26,
  "chipotle steak wrap": 20,
  "chicken avocado blt wrap": 18,
  // Coffee & Drinks
  "ceremonial matcha latte": 7.0,
  "artisanal latte & flat white": 6.5,
  "18-hour slow cold brew": 5.5,
  "cappuccino": 5.5,
  "espresso (double shot)": 4.5,
  "americano": 5.0,
  "golden turmeric spice latte": 6.5,
  "organic tea selection": 5.0,
  "fresh squeezed meyer lemonade": 5.5,
  "beachwood arnold palmer": 6.0,
  "iced strawberry hibiscus spritz": 6.5,
  "fresh squeezed orange juice": 7.0,
  // Beer, Wine, Cocktails
  "signature craft cocktails": 15.0,
  "prosecco superiore docg (veneto, italy)": 14.0,
  "sauvignon blanc (central coast, ca)": 15.0,
  "sonoma county chardonnay (sonoma, ca)": 16.0,
  "côtes de provence rosé (provence, france)": 15.0,
  "willamette valley pinot noir (oregon)": 17.0,
  "paso robles cabernet sauvignon (california)": 16.0,
  "local los angeles hazy ipa": 9.0,
  "golden valley bavarian pilsner": 8.0,
  "echigo japanese rice lager": 9.0,
  "stem organic crisp apple cider": 9.0,
};

function normalizeItemKey(name: string): string {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function getCatalogItemPrice(name: string): number | null {
  const norm = normalizeItemKey(name);
  if (!norm) return null;
  for (const [key, price] of Object.entries(MENU_PRICES_CATALOG)) {
    const normKey = normalizeItemKey(key);
    if (norm === normKey || norm.includes(normKey) || normKey.includes(norm)) {
      return price;
    }
  }
  return null;
}

interface VerifiedOrderCalculation {
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  discountAmount: number;
  tax: number;
  deliveryFee: number;
  tipAmount: number;
  grandTotal: number;
}

function calculateVerifiedOrderTotals(
  rawItems: any[],
  fulfilmentType: "pickup" | "delivery",
  promoCode?: string,
  rawTipAmount?: number,
  isStaff: boolean = false
): VerifiedOrderCalculation {
  const verifiedItems: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];
  let subtotal = 0;

  for (const it of rawItems) {
    if (!it || typeof it !== "object") continue;
    const name = String(it.name || "Special Item").trim();
    const qty = Math.max(1, Math.min(50, Math.floor(Number(it.quantity) || 1)));
    let unitPrice = getCatalogItemPrice(name);

    if (unitPrice === null) {
      if (isStaff) {
        unitPrice = Math.max(0, Number(it.unitPrice) || 0);
      } else {
        const fallback = Number(it.unitPrice) || 0;
        unitPrice = Math.max(0, Math.min(200, Math.round(fallback * 100) / 100));
      }
    }

    const itemTotal = Math.round(unitPrice * qty * 100) / 100;
    subtotal += itemTotal;
    verifiedItems.push({
      name,
      quantity: qty,
      unitPrice,
      total: itemTotal,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Validate promotional discount
  let discountAmount = 0;
  const cleanPromo = String(promoCode || "").trim().toUpperCase();
  if (cleanPromo === "BEACHWOOD10") {
    discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
  } else if (cleanPromo === "BEACHWOOD20") {
    discountAmount = Math.round(subtotal * 0.2 * 100) / 100;
  } else if (cleanPromo === "WELCOME5") {
    discountAmount = Math.min(subtotal, 5.0);
  } else if (cleanPromo === "FREECOFFEE") {
    discountAmount = Math.min(subtotal, 5.5);
  }

  const discountedSubtotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  // 9.5% Los Angeles Sales Tax
  const tax = Math.round(discountedSubtotal * 0.095 * 100) / 100;

  // Delivery fee: $3.99 under $50, FREE over $50
  let deliveryFee = 0;
  if (fulfilmentType === "delivery") {
    deliveryFee = discountedSubtotal >= 50 ? 0 : 3.99;
  }

  // Tip amount: non-negative
  const tipAmount = Math.max(0, Math.round(Number(rawTipAmount || 0) * 100) / 100);

  const grandTotal = Math.max(0, Math.round((discountedSubtotal + tax + deliveryFee + tipAmount) * 100) / 100);

  return {
    items: verifiedItems,
    subtotal,
    discountAmount,
    tax,
    deliveryFee,
    tipAmount,
    grandTotal,
  };
}

function sanitizeOrderForPublic(ord: StoredOrder) {
  const itemCount = Array.isArray(ord.items)
    ? ord.items.reduce((acc, it) => acc + (Number(it?.quantity) || 1), 0)
    : 0;

  return {
    id: ord.id,
    orderNumber: ord.orderNumber,
    placedAt: ord.placedAt,
    timestamp: ord.timestamp,
    fulfilmentType: ord.fulfilmentType,
    status: ord.status,
    statusUpdatedAt: ord.statusUpdatedAt,
    cancelledBy: ord.cancelledBy,
    cancelledAt: ord.cancelledAt,
    cancellationReason: ord.cancellationReason,
    includeUtensils: ord.includeUtensils,
    subtotal: ord.subtotal,
    discountAmount: ord.discountAmount,
    tax: ord.tax,
    deliveryFee: ord.deliveryFee,
    tipAmount: ord.tipAmount,
    grandTotal: ord.grandTotal,
    paymentMethod: ord.paymentMethod,
    items: (ord.items || []).map((it: any) => ({
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
    })),
    itemCount,
    // Sensitive PII strictly sanitized/omitted
    customerName: ord.customerName ? `${ord.customerName[0]}***` : "Guest",
    customerPhone: ord.customerPhone
      ? `•••• ${String(ord.customerPhone).replace(/\D/g, "").slice(-4)}`
      : "••••",
    customerEmail: undefined,
    deliveryAddress: ord.fulfilmentType === "delivery" ? "Delivery address on file" : undefined,
    deliveryApt: undefined,
    deliveryCity: ord.deliveryCity || undefined,
    deliveryZip: undefined,
    deliveryNotes: undefined,
    orderNote: undefined,
    cardLast4: ord.cardLast4 ? "••••" : undefined,
    stripePaymentId: undefined,
    stripeStatus: undefined,
    cancelToken: undefined,
  };
}

// Cookie parser utility
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [name, ...val] = part.trim().split("=");
    if (name) {
      cookies[name.trim()] = decodeURIComponent(val.join("=").trim());
    }
  }
  return cookies;
}

function createStaffToken(username: string): string {
  const secret = getAdminSessionSecret();
  const payload = JSON.stringify({
    u: username,
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
  });
  const b64Payload = Buffer.from(payload, "utf-8").toString("base64url");
  const signature = createHmac("sha256", secret).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64Payload, sig] = parts;
  if (!b64Payload || !sig) return false;
  try {
    const secret = getAdminSessionSecret();
    const expectedSig = createHmac("sha256", secret).update(b64Payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    if (!payload || typeof payload.exp !== "number") return false;
    if (Date.now() > payload.exp) return false; // Expired
    return true;
  } catch {
    return false;
  }
}

function isStaffAuthenticated(request: Request): boolean {
  // 1. Authorization header / custom header (Bearer token)
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("x-admin-token") ||
    request.headers.get("x-staff-token") ||
    "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token && verifyAdminToken(token)) {
    return true;
  }

  // 2. Secure HttpOnly Cookie
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies["bwc_admin_session"] || "";
  if (cookieToken && verifyAdminToken(cookieToken)) {
    // For state-changing mutations authenticated via cookie, enforce CSRF defense
    const method = request.method.toUpperCase();
    if (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH") {
      const csrfHeader = request.headers.get("x-bwc-csrf");
      const secFetchSite = request.headers.get("sec-fetch-site");
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      const isCsrfHeaderValid = csrfHeader === "1";
      const isSameOriginSecFetch = secFetchSite === "same-origin" || secFetchSite === "same-site";
      const isOriginMatchingHost = origin && host && (origin.includes(host) || host.includes(new URL(origin).host));

      if (!isCsrfHeaderValid && !isSameOriginSecFetch && !isOriginMatchingHost) {
        return false; // Reject cross-site request forgery attempt
      }
    }
    return true;
  }

  return false;
}

// Server-side persistent database syncing with Supabase (guarantees cross-device permanence)
async function syncOrderToSupabaseServer(ord: StoredOrder) {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
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
    if (ord.cancelToken) {
      (row as any)["cancel_token"] = ord.cancelToken;
    }

    let res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (errText.includes("cancel_token")) {
        delete (row as any)["cancel_token"];
        await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: "POST",
          headers: {
            apikey: serverKey,
            Authorization: `Bearer ${serverKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(row),
        });
      }
    }
  } catch (err) {
    console.warn("Server Supabase order sync failed:", err);
  }
}

async function updateOrderStatusInSupabaseServer(
  identifier: string,
  status: string,
  extra?: {
    orderId?: string | undefined;
    orderNumber?: string | undefined;
    statusUpdatedAt?: number | undefined;
    cancelledBy?: string | undefined;
    cancelledAt?: number | undefined;
    cancellationReason?: string | undefined;
  },
) {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
  try {
    const patchPayload: Record<string, any> = {
      status,
      status_updated_at: extra?.statusUpdatedAt || Date.now(),
    };
    if (extra?.cancelledBy !== undefined) patchPayload["cancelled_by"] = extra.cancelledBy;
    if (extra?.cancelledAt !== undefined) patchPayload["cancelled_at"] = extra.cancelledAt;
    if (extra?.cancellationReason !== undefined) patchPayload["cancellation_reason"] = extra.cancellationReason;

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
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchPayload),
    });
  } catch (err) {
    console.warn("Server Supabase order status update failed:", err);
  }
}

async function deleteOrderInSupabaseServer(identifier: string) {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
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
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
      },
    });
  } catch (err) {
    console.warn("Server Supabase order delete failed:", err);
  }
}

async function fetchOrdersFromSupabaseServer(): Promise<StoredOrder[]> {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=timestamp.desc&limit=100`, {
      headers: {
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
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
      cancelToken: r.cancel_token || undefined,
    }));
  } catch (err) {
    console.warn("Server Supabase orders fetch error:", err);
    return [];
  }
}

async function syncReservationToSupabaseServer(res: StoredReservation) {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
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
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
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
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
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
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.warn("Server Supabase reservation status update failed:", err);
  }
}

async function deleteReservationInSupabaseServer(identifier: string) {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return;
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
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
      },
    });
  } catch (err) {
    console.warn("Server Supabase reservation delete failed:", err);
  }
}

async function fetchReservationsFromSupabaseServer(): Promise<StoredReservation[]> {
  const serverKey = getSupabaseServerKey();
  if (!SUPABASE_URL || !serverKey) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?select=*&order=timestamp.desc&limit=100`, {
      headers: {
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
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

  // Normalize path for consistent routing and case-insensitive matching
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  const isProd =
    (typeof process !== "undefined" &&
      (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production")) ||
    false;

  // 0. Auth endpoints
  if (path === "/api/auth/login") {
    if (request.method === "POST") {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        if (isIpRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Too many failed login attempts. Please wait 5 minutes before trying again.",
            }),
            { status: 429, headers: corsHeaders },
          );
        }

        const body = await request.json();
        const inputUser = String(body?.username || "").trim();
        const inputPass = String(body?.password || "").trim();

        const userMatch = inputUser === serverAdminUsername;
        const passMatch = verifyPassword(inputPass, serverAdminPasswordHash);

        if (userMatch && passMatch) {
          resetFailedLogin(clientIp);
          const token = createStaffToken(inputUser);
          const cookieHeader = `bwc_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${isProd ? "; Secure" : ""}`;

          return new Response(
            JSON.stringify({
              success: true,
              token,
              user: inputUser,
              expiresIn: 12 * 60 * 60,
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "set-cookie": cookieHeader,
              },
            },
          );
        }

        recordFailedLogin(clientIp);
        // Deliberate 1-second delay to throttle brute-force automation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return new Response(
          JSON.stringify({ success: false, error: "Invalid username or password" }),
          { status: 401, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid request" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }
  }

  if (path === "/api/auth/verify") {
    if (request.method === "GET") {
      const authenticated = isStaffAuthenticated(request);
      if (authenticated) {
        return new Response(
          JSON.stringify({ success: true, authenticated: true, user: serverAdminUsername }),
          { status: 200, headers: corsHeaders },
        );
      }
      return new Response(
        JSON.stringify({ success: false, authenticated: false, error: "Unauthorized" }),
        { status: 401, headers: corsHeaders },
      );
    }
  }

  if (path === "/api/auth/logout") {
    if (request.method === "POST") {
      const clearCookie = `bwc_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`;
      return new Response(
        JSON.stringify({ success: true, message: "Logged out successfully" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "set-cookie": clearCookie,
          },
        },
      );
    }
  }

  if (path === "/api/auth/change-credentials") {
    if (request.method === "POST") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
      try {
        const body = await request.json();
        const { currentPassword, newUsername, newPassword } = body;

        // Mandatory explicit re-authentication check
        if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Current password is required to change admin credentials.",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        // Verify current password against durable credential store
        if (!verifyPassword(String(currentPassword).trim(), serverAdminPasswordHash)) {
          return new Response(
            JSON.stringify({ success: false, error: "Current password is incorrect." }),
            { status: 403, headers: corsHeaders },
          );
        }

        if (!newUsername || String(newUsername).trim().length < 3) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "New username must be at least 3 characters.",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        if (!newPassword || String(newPassword).trim().length < 8) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "New password must be at least 8 characters.",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        // Apply new credentials hashed with scrypt
        serverAdminUsername = String(newUsername).trim();
        serverAdminPasswordHash = hashPasswordWithScrypt(String(newPassword).trim());
        saveDurableCredentials(serverAdminUsername, serverAdminPasswordHash);

        const freshToken = createStaffToken(serverAdminUsername);
        const cookieHeader = `bwc_admin_session=${freshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${isProd ? "; Secure" : ""}`;

        return new Response(
          JSON.stringify({
            success: true,
            message: "Credentials updated successfully with scrypt password protection.",
            token: freshToken,
            username: serverAdminUsername,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "set-cookie": cookieHeader,
            },
          },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Invalid request" }),
          { status: 400, headers: corsHeaders },
        );
      }
    }
  }

  // 1. Sync endpoint: returns all orders and reservations (Staff Protected)
  if (path === "/api/sync" || path === "/api/sync/") {
    if (request.method === "GET") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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
          deletedOrderIds: Array.from(serverDeletedOrderIds),
          deletedResIds: Array.from(serverDeletedResIds),
          clearedAt: serverClearedAt,
          timestamp: Date.now(),
        }),
        { status: 200, headers: corsHeaders },
      );
    }
  }

  // 1.5 Order Tracking Endpoint (Privacy-Preserving Public Tracking & Owner Verification)
  if (path === "/api/orders/track" || path === "/api/orders/track/") {
    const clientIp = getClientIp(request);
    if (isTrackingRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many tracking lookups. Please wait a minute." }),
        { status: 429, headers: corsHeaders },
      );
    }

    let queryOrder = "";
    let inputToken = "";
    let inputPhone = "";

    if (request.method === "GET") {
      queryOrder = url.searchParams.get("order") || url.searchParams.get("id") || "";
      inputToken = url.searchParams.get("token") || url.searchParams.get("cancelToken") || "";
      inputPhone = url.searchParams.get("phone") || "";
    } else if (request.method === "POST") {
      try {
        const body = await request.json();
        queryOrder = String(body?.order || body?.orderNumber || body?.id || "").trim();
        inputToken = String(body?.token || body?.cancelToken || "").trim();
        inputPhone = String(body?.phone || "").trim();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid JSON payload" }),
          { status: 400, headers: corsHeaders },
        );
      }
    } else {
      return new Response(null, { status: 405, headers: corsHeaders });
    }

    const cleanQuery = queryOrder.trim().replace(/^#/, "").toLowerCase();
    if (!cleanQuery) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing order parameter" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Check tombstoned/deleted orders
    if (serverDeletedOrderIds.has(cleanQuery)) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Look up in server memory
    let ord = serverOrders.find((o) => {
      if (!o) return false;
      const oNum = String(o.orderNumber || "").replace(/^#/, "").trim().toLowerCase();
      const oId = String(o.id || "").trim().toLowerCase();
      return oNum === cleanQuery || oId === cleanQuery;
    });

    // If not in ephemeral memory, fetch from Supabase
    if (!ord) {
      const remote = await fetchOrdersFromSupabaseServer();
      if (remote.length > 0) {
        serverOrders = remote;
        ord = serverOrders.find((o) => {
          if (!o) return false;
          const oNum = String(o.orderNumber || "").replace(/^#/, "").trim().toLowerCase();
          const oId = String(o.id || "").trim().toLowerCase();
          return oNum === cleanQuery || oId === cleanQuery;
        });
      }
    }

    if (!ord) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Verify ownership
    const isStaff = isStaffAuthenticated(request);
    const tokenMatch = Boolean(inputToken && ord.cancelToken && inputToken === ord.cancelToken);
    const cleanInputPhoneDigits = inputPhone.replace(/\D/g, "");
    const cleanCustPhoneDigits = String(ord.customerPhone || "").replace(/\D/g, "");
    const phoneMatch = Boolean(
      cleanInputPhoneDigits.length >= 4 &&
      cleanCustPhoneDigits.endsWith(cleanInputPhoneDigits),
    );

    const isVerifiedOwner = isStaff || tokenMatch || phoneMatch;

    if (isVerifiedOwner) {
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          order: ord,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Return sanitized public tracking response
    return new Response(
      JSON.stringify({
        success: true,
        verified: false,
        order: sanitizeOrderForPublic(ord),
      }),
      { status: 200, headers: corsHeaders },
    );
  }

  // 2. Orders endpoints
  if (path === "/api/orders" || path === "/api/orders/") {
    if (request.method === "GET") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
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
        const isStaff = isStaffAuthenticated(request);
        const clientIp = getClientIp(request);

        if (!isStaff && isOrderRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Too many order requests. Please wait a moment before trying again.",
            }),
            { status: 429, headers: corsHeaders },
          );
        }

        const body = await request.json();
        const incomingOrders: StoredOrder[] = Array.isArray(body?.orders)
          ? body.orders
          : body?.order
            ? [body.order]
            : [];

        if (incomingOrders.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No order provided" }),
            { status: 400, headers: corsHeaders },
          );
        }

        const processedOrders: StoredOrder[] = [];

        for (const rawOrd of incomingOrders) {
          if (!rawOrd) continue;

          // For customer (non-staff) orders, enforce server-side validation & pricing
          if (!isStaff) {
            const customerName = String(rawOrd.customerName || "").trim();
            if (!customerName || customerName.length > 100) {
              return new Response(
                JSON.stringify({ success: false, error: "Invalid customer name" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const customerPhone = String(rawOrd.customerPhone || "").trim();
            const phoneDigits = customerPhone.replace(/\D/g, "");
            if (phoneDigits.length < 7) {
              return new Response(
                JSON.stringify({ success: false, error: "Valid contact phone number is required" }),
                { status: 400, headers: corsHeaders },
              );
            }

            if (!Array.isArray(rawOrd.items) || rawOrd.items.length === 0) {
              return new Response(
                JSON.stringify({ success: false, error: "Order must contain at least one item" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const fulfilmentType = rawOrd.fulfilmentType === "delivery" ? "delivery" : "pickup";
            if (fulfilmentType === "delivery") {
              const deliveryAddress = String(rawOrd.deliveryAddress || "").trim();
              if (!deliveryAddress) {
                return new Response(
                  JSON.stringify({ success: false, error: "Delivery address is required for delivery orders" }),
                  { status: 400, headers: corsHeaders },
                );
              }
            }

            // Calculate totals using server-side trusted menu data
            const calc = calculateVerifiedOrderTotals(
              rawOrd.items,
              fulfilmentType,
              rawOrd.promoCode,
              Number(rawOrd.tipAmount) || 0,
              false,
            );

            // Assign durable cryptographic cancel token if missing
            const cancelToken =
              rawOrd.cancelToken && typeof rawOrd.cancelToken === "string" && rawOrd.cancelToken.startsWith("ctk_")
                ? rawOrd.cancelToken
                : `ctk_${randomBytes(16).toString("hex")}_${Date.now().toString(36)}`;

            const ord: StoredOrder = {
              id: rawOrd.id || `ord_${Date.now()}_${randomBytes(4).toString("hex")}`,
              orderNumber: rawOrd.orderNumber || `BWC-${Math.floor(10000 + Math.random() * 90000)}`,
              placedAt: rawOrd.placedAt || `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
              timestamp: Date.now(),
              customerName,
              customerPhone,
              customerEmail: String(rawOrd.customerEmail || "").trim(),
              fulfilmentType,
              deliveryAddress: rawOrd.deliveryAddress ? String(rawOrd.deliveryAddress).trim() : undefined,
              deliveryApt: rawOrd.deliveryApt ? String(rawOrd.deliveryApt).trim() : undefined,
              deliveryCity: rawOrd.deliveryCity ? String(rawOrd.deliveryCity).trim() : undefined,
              deliveryZip: rawOrd.deliveryZip ? String(rawOrd.deliveryZip).trim() : undefined,
              deliveryNotes: rawOrd.deliveryNotes ? String(rawOrd.deliveryNotes).trim() : undefined,
              includeUtensils: Boolean(rawOrd.includeUtensils),
              orderNote: rawOrd.orderNote ? String(rawOrd.orderNote).trim() : undefined,
              paymentMethod: rawOrd.paymentMethod === "prepay" ? "prepay" : "counter",
              cardLast4: rawOrd.cardLast4 ? String(rawOrd.cardLast4).slice(-4) : undefined,
              stripePaymentId: rawOrd.stripePaymentId ? String(rawOrd.stripePaymentId).trim() : undefined,
              stripeStatus: rawOrd.stripeStatus ? String(rawOrd.stripeStatus).trim() : undefined,
              items: calc.items,
              subtotal: calc.subtotal,
              discountAmount: calc.discountAmount,
              tax: calc.tax,
              deliveryFee: calc.deliveryFee,
              tipAmount: calc.tipAmount,
              grandTotal: calc.grandTotal,
              status: "pending", // ALWAYS pending for customer placement
              statusUpdatedAt: Date.now(),
              cancelToken,
            };

            processedOrders.push(ord);
          } else {
            // Staff order
            processedOrders.push(rawOrd);
          }
        }

        for (const ord of processedOrders) {
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
            // Unauthenticated callers cannot overwrite existing orders!
            if (!isStaff) continue;

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

        // Staff receives the full list; unauthenticated customers receive only their own placed order confirmation
        return new Response(
          JSON.stringify({
            success: true,
            count: isStaff ? serverOrders.length : processedOrders.length,
            orders: isStaff ? serverOrders : processedOrders,
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
        const body = await request.json();
        const { orderId, orderNumber, status, statusUpdatedAt, cancelledBy, cancellationReason } = body;
        const cleanId = String(orderId || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");
        const cleanNum = String(orderNumber || "")
          .trim()
          .toLowerCase()
          .replace(/^#/, "");

        const isStaff = isStaffAuthenticated(request);

        let idx = serverOrders.findIndex((o) => {
          if (!o) return false;
          const oNum = o.orderNumber
            ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
            : "";
          const oId = o.id ? String(o.id).trim().toLowerCase() : "";
          if (cleanNum && oNum === cleanNum) return true;
          if (cleanId && oId === cleanId) return true;
          return false;
        });

        // If not in ephemeral memory, attempt fetching from Supabase
        if (idx === -1) {
          const remote = await fetchOrdersFromSupabaseServer();
          if (remote.length > 0) {
            serverOrders = remote;
            idx = serverOrders.findIndex((o) => {
              if (!o) return false;
              const oNum = o.orderNumber
                ? String(o.orderNumber).replace(/^#/, "").trim().toLowerCase()
                : "";
              const oId = o.id ? String(o.id).trim().toLowerCase() : "";
              if (cleanNum && oNum === cleanNum) return true;
              if (cleanId && oId === cleanId) return true;
              return false;
            });
          }
        }

        // Authorization checks
        if (!isStaff) {
          const isCustCancel = status === "cancelled" && (cancelledBy === "customer" || !cancelledBy);
          if (!isCustCancel) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Unauthorized: Staff authentication required to update order status",
              }),
              { status: 401, headers: corsHeaders },
            );
          }

          if (idx === -1 || !serverOrders[idx]) {
            return new Response(
              JSON.stringify({ success: false, error: "Order not found" }),
              { status: 404, headers: corsHeaders },
            );
          }

          const ord = serverOrders[idx]!;
          const elapsed = Date.now() - (ord.timestamp || 0);
          if (elapsed > 75000) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Customer cancellation window (1 minute) has expired",
              }),
              { status: 403, headers: corsHeaders },
            );
          }

          if (ord.status === "completed" || ord.status === "cancelled") {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Order cannot be cancelled in status: ${ord.status}`,
              }),
              { status: 400, headers: corsHeaders },
            );
          }

          // Order Ownership Verification: Customer cannot cancel another person's order by guessing order ID or number
          if (ord.cancelToken) {
            const inputToken = String(body?.cancelToken || "").trim();
            if (!inputToken || inputToken !== ord.cancelToken) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error:
                    "Ownership verification failed: You can only cancel orders placed from your own session.",
                }),
                { status: 403, headers: corsHeaders },
              );
            }
          }
        }

        if (idx !== -1 && serverOrders[idx]) {
          const ord = serverOrders[idx]!;
          ord["status"] = status;
          ord["statusUpdatedAt"] = statusUpdatedAt || Date.now();
          if (status === "cancelled") {
            ord["cancelledBy"] = cancelledBy || (isStaff ? "admin" : "customer");
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

        // If staff creates/updates an order not found in memory
        if (isStaff) {
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
        }

        return new Response(
          JSON.stringify({ success: false, error: "Order not found" }),
          { status: 404, headers: corsHeaders },
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }
  }

  // Delete order endpoint (Staff Protected)
  if (path === "/api/orders/delete") {
    if (request.method === "POST") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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
        const isStaff = isStaffAuthenticated(request);
        const clientIp = getClientIp(request);

        if (!isStaff && isReservationRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Too many reservation requests. Please wait a few minutes before trying again.",
            }),
            { status: 429, headers: corsHeaders },
          );
        }

        const body = await request.json();
        const incomingReservations: StoredReservation[] = Array.isArray(body?.reservations)
          ? body.reservations
          : body?.reservation
            ? [body.reservation]
            : [];

        if (incomingReservations.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No reservation provided" }),
            { status: 400, headers: corsHeaders },
          );
        }

        const processedReservations: StoredReservation[] = [];

        for (const rawRes of incomingReservations) {
          if (!rawRes) continue;

          if (!isStaff) {
            const fullName = String(rawRes.fullName || "").trim();
            if (!fullName || fullName.length > 100) {
              return new Response(
                JSON.stringify({ success: false, error: "Full name is required" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const phone = String(rawRes.phone || "").trim();
            const phoneDigits = phone.replace(/\D/g, "");
            if (phoneDigits.length < 7) {
              return new Response(
                JSON.stringify({ success: false, error: "Valid phone number is required" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const partySize = String(rawRes.partySize || "").trim();
            const numParty = parseInt(partySize, 10);
            if (isNaN(numParty) || numParty < 1 || numParty > 20) {
              return new Response(
                JSON.stringify({ success: false, error: "Party size must be between 1 and 20" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const date = String(rawRes.date || "").trim();
            if (!date) {
              return new Response(
                JSON.stringify({ success: false, error: "Reservation date is required" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const time = String(rawRes.time || "").trim();
            if (!time) {
              return new Response(
                JSON.stringify({ success: false, error: "Reservation time is required" }),
                { status: 400, headers: corsHeaders },
              );
            }

            const res: StoredReservation = {
              id: rawRes.id || `res_${Date.now()}_${randomBytes(4).toString("hex")}`,
              reservationNumber: rawRes.reservationNumber || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
              createdAt: rawRes.createdAt || new Date().toISOString(),
              timestamp: Date.now(),
              fullName,
              phone,
              email: String(rawRes.email || "").trim(),
              partySize: String(numParty),
              date,
              time,
              seating: String(rawRes.seating || "indoor"),
              specialRequests: rawRes.specialRequests ? String(rawRes.specialRequests).trim() : undefined,
              status: "confirmed", // Customer reservations default to confirmed
            };
            processedReservations.push(res);
          } else {
            processedReservations.push(rawRes);
          }
        }

        for (const res of processedReservations) {
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
            // Unauthenticated callers cannot overwrite existing reservations
            if (!isStaff) continue;

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
            count: isStaff ? serverReservations.length : processedReservations.length,
            reservations: isStaff ? serverReservations : processedReservations,
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

  // Update reservation status (Staff Protected)
  if (path === "/api/reservations/update-status") {
    if (request.method === "POST") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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

  // Delete reservation endpoint (Staff Protected)
  if (path === "/api/reservations/delete") {
    if (request.method === "POST") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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

  // Clear all data endpoint (orders, reservations, and caches) (Staff Protected)
  if (path === "/api/clear-all" || path === "/api/clear-all/") {
    if (request.method === "POST") {
      if (!isStaffAuthenticated(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Staff authentication required" }),
          { status: 401, headers: corsHeaders },
        );
      }
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
