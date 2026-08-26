"use client";

// Loads Razorpay's hosted Standard Checkout script and opens it. Card/UPI/bank
// details are entered inside Razorpay's own hosted modal — none of it ever touches
// this app's code, and the Razorpay secret key never appears here (only the
// publishable key ID, which Razorpay's own docs confirm is safe for the browser).

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface OpenCheckoutOptions {
  keyId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure: (reason: string) => void;
  onCancel: () => void;
}

let scriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(opts: OpenCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    opts.onFailure("Could not load the payment SDK. Check your connection and try again.");
    return;
  }
  if (!opts.keyId) {
    opts.onFailure("Online payments are not configured yet.");
    return;
  }

  const RazorpayCtor = (window as any).Razorpay;
  const rzp = new RazorpayCtor({
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: opts.currency,
    order_id: opts.razorpayOrderId,
    name: opts.name ?? "QuickBite",
    description: opts.description ?? "Order payment",
    prefill: opts.prefill,
    theme: { color: "#FF6B35" },
    handler: (response: RazorpaySuccessResponse) => opts.onSuccess(response),
    modal: {
      ondismiss: () => opts.onCancel(),
    },
  });

  rzp.on("payment.failed", (response: any) => {
    opts.onFailure(response?.error?.description ?? "Payment failed");
  });

  rzp.open();
}
