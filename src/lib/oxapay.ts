/**
 * OxaPay live payment integration.
 * Requires the merchant API key from the live OxaPay dashboard.
 */

const API = "https://api.oxapay.com/v1";

export interface LiveInvoice {
  provider: "oxapay-live";
  trackId: string;
  payLink: string;
}

function apiKey(): string {
  const key = process.env.OXAPAY_API_KEY?.trim();
  if (!key) {
    throw new Error("oxapay_live_api_key_missing");
  }
  return key;
}

export async function createLiveInvoice(
  orderId: string,
  amountUsd: number,
  returnUrl: string
): Promise<LiveInvoice> {
  const key = apiKey();

  const res = await fetch(`${API}/payment/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", merchant_api_key: key },
    body: JSON.stringify({
      amount: amountUsd,
      currency: "USD",
      lifetime: 30,
      order_id: orderId,
      return_url: returnUrl,
      description: "KLAUN-EC plan",
      sandbox: false,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data?.track_id) {
    throw new Error(`oxapay_invoice_failed: ${body?.message ?? res.status}`);
  }
  return {
    provider: "oxapay-live",
    trackId: String(body.data.track_id),
    payLink: String(body.data.payment_url ?? ""),
  };
}

/** True only when OxaPay reports the live invoice as paid. */
export async function isLiveInvoicePaid(trackId: string): Promise<boolean> {
  const key = apiKey();
  const res = await fetch(`${API}/payment/${encodeURIComponent(trackId)}`, {
    headers: { merchant_api_key: key },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return String(body?.data?.status ?? "").toLowerCase() === "paid";
}
