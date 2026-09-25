import { site } from "./site-content";

export interface PrintableReceiptOrder {
  orderId: string;
  placedAt?: string | undefined;
  estimatedTime?: string | undefined;
  name: string;
  phone: string;
  email?: string | undefined;
  fulfilmentType: "pickup" | "delivery";
  deliveryAddress?: string | undefined;
  deliveryApt?: string | undefined;
  deliveryCity?: string | undefined;
  deliveryZip?: string | undefined;
  deliveryNotes?: string | undefined;
  includeUtensils?: boolean | undefined;
  orderNote?: string | undefined;
  paymentMethod?: "prepay" | "counter" | undefined;
  cardLast4?: string | undefined;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice?: number | undefined;
    total: number;
  }>;
  subtotal: number;
  discountAmount?: number | undefined;
  tax: number;
  deliveryFee?: number | undefined;
  tipAmount?: number | undefined;
  grandTotal: number;
}

/**
 * Builds a clean, compact, professional HTML receipt guaranteed to fit on a single page.
 */
function buildReceiptHtml(order: PrintableReceiptOrder): string {
  const currentDate = order.placedAt || new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isDelivery = order.fulfilmentType === "delivery";
  const addressLine = isDelivery
    ? `${order.deliveryAddress || ""}${order.deliveryApt ? ` Apt ${order.deliveryApt}` : ""}, ${order.deliveryCity || "Los Angeles"} ${order.deliveryZip || "90068"}`.trim()
    : site.address;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; font-weight: 700; width: 35px; vertical-align: top;">${item.quantity}x</td>
        <td style="padding: 4px 0; vertical-align: top;">
          <div style="font-weight: 600; color: #111;">${item.name}</div>
          ${item.unitPrice ? `<div style="font-size: 10px; color: #666;">$${item.unitPrice.toFixed(2)} each</div>` : ""}
        </td>
        <td style="padding: 4px 0; text-align: right; font-weight: 700; vertical-align: top; width: 65px;">$${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt - Beachwood Cafe #${order.orderId}</title>
  <style>
    @page {
      size: portrait;
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background: #ffffff;
      color: #111111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.35;
      width: 100%;
      height: auto;
    }
    .receipt-wrapper {
      max-width: 360px;
      margin: 0 auto;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px dashed #aaaaaa;
      border-radius: 6px;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .header {
      text-align: center;
      border-bottom: 1.5px solid #111111;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #1a3b6b;
      margin-bottom: 2px;
    }
    .brand-tagline {
      font-size: 10px;
      color: #555555;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }
    .contact-info {
      font-size: 10px;
      color: #444444;
      line-height: 1.3;
    }
    .order-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f7f3ec;
      border: 1px solid #e2d7c5;
      border-radius: 4px;
      padding: 5px 8px;
      margin: 8px 0;
      font-weight: 800;
    }
    .order-num {
      font-size: 13px;
      color: #1a3b6b;
    }
    .order-type {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #1a3b6b;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 3px;
    }
    .details-table {
      width: 100%;
      margin: 6px 0;
      font-size: 11px;
    }
    .details-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .details-table td.label {
      color: #666666;
      width: 70px;
      font-weight: 600;
    }
    .details-table td.val {
      font-weight: 600;
      color: #111111;
      text-align: right;
    }
    .divider {
      border: none;
      border-top: 1px dashed #bbbbbb;
      margin: 6px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    .items-table th {
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #555555;
      border-bottom: 1px solid #111111;
      padding-bottom: 3px;
      text-align: left;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 11px;
      color: #444444;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #111111;
      border-bottom: 1.5px solid #111111;
      padding: 5px 0;
      margin: 5px 0;
      font-size: 14px;
      font-weight: 900;
      color: #1a3b6b;
    }
    .note-box {
      background: #fffbe6;
      border: 1px solid #ffe58f;
      border-radius: 4px;
      padding: 4px 6px;
      margin-top: 6px;
      font-size: 10.5px;
      color: #614700;
    }
    .footer-section {
      text-align: center;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #cccccc;
      font-size: 10px;
      color: #555555;
      line-height: 1.4;
    }
    .barcode-line {
      font-family: "Courier New", Courier, monospace;
      letter-spacing: 3px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 5px;
      color: #222222;
    }

    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .receipt-wrapper {
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="brand-name">Beachwood Cafe</div>
      <div class="brand-tagline">Hollywood Hills · Scratch Kitchen</div>
      <div class="contact-info">
        ${site.address}<br>
        Tel: (323) 871-1717 · www.beachwoodcafe.com
      </div>
    </div>

    <!-- Order Header Badge -->
    <div class="order-badge-row">
      <span class="order-num">#${order.orderId}</span>
      <span class="order-type">${isDelivery ? "Delivery" : "Cafe Pickup"}</span>
    </div>

    <!-- Order Details -->
    <table class="details-table">
      <tr>
        <td class="label">Date / Time:</td>
        <td class="val">${currentDate}</td>
      </tr>
      <tr>
        <td class="label">Customer:</td>
        <td class="val">${order.name}</td>
      </tr>
      <tr>
        <td class="label">Phone:</td>
        <td class="val">${order.phone}</td>
      </tr>
      ${order.email ? `
      <tr>
        <td class="label">Email:</td>
        <td class="val">${order.email}</td>
      </tr>
      ` : ""}
      <tr>
        <td class="label">${isDelivery ? "Deliver to:" : "Pickup at:"}</td>
        <td class="val" style="word-break: break-word;">${addressLine}</td>
      </tr>
      ${order.estimatedTime ? `
      <tr>
        <td class="label">Est. Ready:</td>
        <td class="val" style="color: #b87508;">${order.estimatedTime}</td>
      </tr>
      ` : ""}
      <tr>
        <td class="label">Utensils:</td>
        <td class="val">${order.includeUtensils !== false ? "Included (Eco-friendly)" : "No utensils needed"}</td>
      </tr>
    </table>

    ${order.orderNote ? `
    <div class="note-box">
      <strong>Special Instructions:</strong> ${order.orderNote}
    </div>
    ` : ""}

    <hr class="divider">

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Qty</th>
          <th>Item Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <hr class="divider">

    <!-- Pricing Summary -->
    <div>
      <div class="totals-row">
        <span>Subtotal</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discountAmount && order.discountAmount > 0 ? `
      <div class="totals-row" style="color: #16a34a; font-weight: 600;">
        <span>Promo Discount</span>
        <span>-$${order.discountAmount.toFixed(2)}</span>
      </div>
      ` : ""}
      <div class="totals-row">
        <span>Sales Tax (9.5% LA)</span>
        <span>$${order.tax.toFixed(2)}</span>
      </div>
      ${order.deliveryFee && order.deliveryFee > 0 ? `
      <div class="totals-row">
        <span>Delivery Fee</span>
        <span>$${order.deliveryFee.toFixed(2)}</span>
      </div>
      ` : ""}
      ${order.tipAmount && order.tipAmount > 0 ? `
      <div class="totals-row">
        <span>Staff Tip</span>
        <span>$${order.tipAmount.toFixed(2)}</span>
      </div>
      ` : ""}
      <div class="grand-total-row">
        <span>GRAND TOTAL</span>
        <span>$${order.grandTotal.toFixed(2)}</span>
      </div>
      <div class="totals-row" style="font-size: 10px; color: #666;">
        <span>Payment Method</span>
        <span>${order.paymentMethod === "prepay" ? `Card (•••• ${order.cardLast4 || "PAID"})` : "Pay at counter"}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-section">
      <p style="font-weight: 700; color: #111; margin-bottom: 2px;">Thank you for dining with us!</p>
      <p>Locally sourced · Farm fresh ingredients · Handcrafted with care</p>
      <div class="barcode-line">*BWC-${order.orderId}*</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds a clean, high-contrast, single-page kitchen ticket for cafe staff.
 */
function buildKitchenTicketHtml(order: PrintableReceiptOrder): string {
  const currentDate = order.placedAt || new Date().toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const isDelivery = order.fulfilmentType === "delivery";

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #ddd;">
        <span style="font-size: 18px; font-weight: 900; width: 40px;">${item.quantity}x</span>
        <span style="font-size: 16px; font-weight: 700; flex: 1;">${item.name}</span>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Kitchen Ticket #${order.orderId}</title>
  <style>
    @page { size: portrait; margin: 6mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.3;
      padding: 10px;
      background: #fff;
      color: #000;
    }
    .ticket-box {
      max-width: 380px;
      margin: 0 auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="ticket-box">
    <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
      <h1 style="font-size: 20px; font-weight: 900; text-transform: uppercase;">KITCHEN ORDER TICKET</h1>
      <div style="font-size: 24px; font-weight: 900; margin: 4px 0;">#${order.orderId}</div>
      <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; background: #000; color: #fff; display: inline-block; padding: 2px 10px; border-radius: 4px;">
        ${isDelivery ? "OUT FOR DELIVERY" : "CAFE PICKUP"}
      </div>
    </div>

    <div style="font-size: 12px; margin-bottom: 10px; line-height: 1.4;">
      <div><strong>Time:</strong> ${currentDate}</div>
      <div><strong>Guest:</strong> ${order.name} (${order.phone})</div>
      ${isDelivery ? `<div><strong>Address:</strong> ${order.deliveryAddress || ""} ${order.deliveryApt || ""}</div>` : ""}
      <div><strong>Utensils:</strong> ${order.includeUtensils !== false ? "YES (Include Cutlery)" : "NO UTENSILS"}</div>
      ${order.orderNote ? `<div style="background: #eee; padding: 6px; margin-top: 4px; border-left: 3px solid #000; font-weight: bold;">NOTE: ${order.orderNote}</div>` : ""}
    </div>

    <div style="border-top: 2px solid #000; padding-top: 6px; margin-bottom: 10px;">
      ${itemsHtml}
    </div>

    <div style="border-top: 1px solid #000; padding-top: 6px; text-align: center; font-size: 11px;">
      Total Items: ${order.items.reduce((acc, i) => acc + i.quantity, 0)} · Beachwood Cafe Kitchen
    </div>
  </div>
</body>
</html>`;
}

/**
 * Universal printing helper that renders receipt into an isolated hidden iframe
 * so that the browser print engine sees ONLY the single-page receipt,
 * completely preventing multi-page duplication or background site bleeding.
 */
function printHtmlInIframe(htmlContent: string) {
  // Remove existing print frame if present
  const existingFrame = document.getElementById("bwc-receipt-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "bwc-receipt-print-frame";
  iframe.setAttribute(
    "style",
    "position: fixed; right: 100%; bottom: 100%; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none; z-index: -9999;"
  );
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Graceful fallback if iframe access fails
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Give the browser time to layout and prepare the print spool
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn("Iframe print error, falling back to window.print():", err);
      window.print();
    } finally {
      // Auto-clean the iframe after the print dialog is handled
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {
          // ignore
        }
      }, 4000);
    }
  }, 200);
}

/**
 * Prints a clean, single-page customer order receipt.
 */
export function printOrderReceipt(order: PrintableReceiptOrder) {
  const html = buildReceiptHtml(order);
  printHtmlInIframe(html);
}

/**
 * Prints a clean, single-page kitchen ticket.
 */
export function printKitchenTicket(order: PrintableReceiptOrder) {
  const html = buildKitchenTicketHtml(order);
  printHtmlInIframe(html);
}
