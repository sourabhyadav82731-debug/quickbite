import { MigrationInterface } from "typeorm";
import { InitialSchema1787752965858 } from "./1787752965858-InitialSchema";
import { AddCustomerPricing1787774226159 } from "./1787774226159-AddCustomerPricing";
import { AddPhotosWithdrawalsLocation1787843295730 } from "./1787843295730-AddPhotosWithdrawalsLocation";
import { AddRestaurantDashboardFeatures1787845843910 } from "./1787845843910-AddRestaurantDashboardFeatures";
import { AddMobileOtpLogin1787847700155 } from "./1787847700155-AddMobileOtpLogin";
import { AddOtpRequestedAt1787848134833 } from "./1787848134833-AddOtpRequestedAt";
import { RemoveOtpLoginSystem1788011121024 } from "./1788011121024-RemoveOtpLoginSystem";
import { AddDeliveryDeliveredAt1788013966755 } from "./1788013966755-AddDeliveryDeliveredAt";
import { AddAdminControlCenter1788015186752 } from "./1788015186752-AddAdminControlCenter";
import { AddCouponPerUserLimit1788015300000 } from "./1788015300000-AddCouponPerUserLimit";
import { AddRefundRequestedBy1788015400000 } from "./1788015400000-AddRefundRequestedBy";

// Explicit list (not a glob) so migration loading behaves the same whether run via
// ts-node in dev or from compiled output later — add each generated migration here.
export const ALL_MIGRATIONS: (new () => MigrationInterface)[] = [
  InitialSchema1787752965858,
  AddCustomerPricing1787774226159,
  AddPhotosWithdrawalsLocation1787843295730,
  AddRestaurantDashboardFeatures1787845843910,
  AddMobileOtpLogin1787847700155,
  AddOtpRequestedAt1787848134833,
  RemoveOtpLoginSystem1788011121024,
  AddDeliveryDeliveredAt1788013966755,
  AddAdminControlCenter1788015186752,
  AddCouponPerUserLimit1788015300000,
  AddRefundRequestedBy1788015400000,
];
