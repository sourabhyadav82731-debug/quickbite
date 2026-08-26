import { Logger, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";

export const RAZORPAY_CLIENT = "RAZORPAY_CLIENT";

const logger = new Logger("RazorpayProvider");

// Returns undefined (not a throw) when credentials are missing, so the app still boots
// and COD keeps working. PaymentsService rejects online-payment attempts cleanly in
// that case instead of crashing on an undefined client.
export const razorpayClientProvider: Provider = {
  provide: RAZORPAY_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Razorpay | undefined => {
    const keyId = config.get<string>("RAZORPAY_KEY_ID");
    const keySecret = config.get<string>("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      logger.warn(
        "RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured — online payments are disabled; COD remains available.",
      );
      return undefined;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  },
};
