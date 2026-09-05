import { io, Socket } from "socket.io-client";

// Kept as local, minimal DTOs rather than importing @quickbite/types, matching
// this file's existing convention (every other domain method below uses
// inline/generic shapes too, with no dependency on that package).
export interface WalletBalanceDto {
  availableBalance: number;
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  pendingWithdrawals: number;
}

export interface WithdrawalRequestDto {
  id: string;
  ownerType: "DRIVER" | "RESTAURANT";
  ownerId: string;
  amount: number;
  payoutMethod: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  referenceId?: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
}

export type TokenGetter = () => string | null;
export type TokenSetter = (accessToken: string, refreshToken: string) => void;
export type TokenClearer = () => void;

interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: TokenGetter;
  getRefreshToken: TokenGetter;
  onTokensRefreshed: TokenSetter;
  onAuthFailure: TokenClearer;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private opts: ApiClientOptions;
  private refreshingPromise: Promise<boolean> | null = null;

  constructor(opts: ApiClientOptions) {
    this.opts = opts;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    _retried = false,
  ): Promise<T> {
    const token = this.opts.getAccessToken();
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !_retried) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(method, path, body, true);
      this.opts.onAuthFailure();
    }

    const text = await res.text();
    // A successful response with an empty body (e.g. GET /deliveries/order/:id
    // before any delivery exists) means "no data", not "no value at all" — must
    // resolve to null, never undefined. React Query explicitly forbids a
    // queryFn resolving to undefined and throws exactly for that reason.
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? res.statusText, data);
    }
    return data as T;
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshingPromise) return this.refreshingPromise;
    this.refreshingPromise = (async () => {
      const refreshToken = this.opts.getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${this.opts.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        this.opts.onTokensRefreshed(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshingPromise = null;
      }
    })();
    return this.refreshingPromise;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

// ---------- Domain API modules ----------
// Thin, typed convenience wrappers over a shared ApiClient instance.

export function createDomainApis(client: ApiClient) {
  return {
    auth: {
      login: (payload: { email: string; password: string }) =>
        client.post<{ accessToken: string; refreshToken: string; user: unknown }>(
          "/auth/login",
          payload,
        ),
      register: (payload: Record<string, unknown>) =>
        client.post("/auth/register", payload),
      me: () => client.get("/auth/me"),
    },
    restaurants: {
      list: (query = "") => client.get(`/restaurants${query}`),
      listMine: () => client.get("/restaurants/mine"),
      get: (id: string) => client.get(`/restaurants/${id}`),
      menu: (id: string) => client.get(`/restaurants/${id}/menu`),
      create: (payload: Record<string, unknown>) => client.post("/restaurants", payload),
      update: (id: string, payload: Record<string, unknown>) =>
        client.patch(`/restaurants/${id}`, payload),
      setAvailability: (id: string, payload: { availabilityStatus: string; pauseReason?: string }) =>
        client.patch(`/restaurants/${id}/availability`, payload),
      getAvailability: (id: string) =>
        client.get<{ open: boolean; reason?: string }>(`/restaurants/${id}/availability`),
      listHolidays: (id: string) => client.get(`/restaurants/${id}/holidays`),
      addHoliday: (id: string, payload: { date: string; label: string }) =>
        client.post(`/restaurants/${id}/holidays`, payload),
      deleteHoliday: (id: string, holidayId: string) =>
        client.delete(`/restaurants/${id}/holidays/${holidayId}`),
    },
    menu: {
      createCategory: (restaurantId: string, payload: Record<string, unknown>) =>
        client.post(`/restaurants/${restaurantId}/categories`, payload),
      createDish: (restaurantId: string, payload: Record<string, unknown>) =>
        client.post(`/restaurants/${restaurantId}/dishes`, payload),
      updateDish: (dishId: string, payload: Record<string, unknown>) =>
        client.patch(`/dishes/${dishId}`, payload),
      toggleStock: (dishId: string, isInStock: boolean) =>
        client.patch(`/dishes/${dishId}/stock`, { isInStock }),
      createAddonGroup: (dishId: string, payload: Record<string, unknown>) =>
        client.post(`/dishes/${dishId}/addon-groups`, payload),
      updateCategory: (categoryId: string, payload: Record<string, unknown>) =>
        client.patch(`/categories/${categoryId}`, payload),
      deleteCategory: (categoryId: string) => client.delete(`/categories/${categoryId}`),
      reorderCategories: (restaurantId: string, orderedIds: string[]) =>
        client.post(`/restaurants/${restaurantId}/categories/reorder`, { orderedIds }),
      deleteDish: (dishId: string) => client.delete(`/dishes/${dishId}`),
    },
    staff: {
      list: (restaurantId: string) => client.get(`/staff?restaurantId=${restaurantId}`),
      invite: (payload: Record<string, unknown>) => client.post("/staff", payload),
      update: (staffId: string, payload: Record<string, unknown>) =>
        client.patch(`/staff/${staffId}`, payload),
    },
    orders: {
      checkout: (payload: Record<string, unknown>) => client.post("/orders", payload),
      list: (query = "") => client.get(`/orders${query}`),
      get: (id: string) => client.get(`/orders/${id}`),
      updateStatus: (id: string, payload: Record<string, unknown>) =>
        client.patch(`/orders/${id}/status`, payload),
      cancel: (id: string, reason?: string) =>
        client.post(`/orders/${id}/cancel`, { reason }),
      requestRefund: (id: string, reason: string) =>
        client.post(`/orders/${id}/refund-request`, { reason }),
    },
    delivery: {
      respondToOffer: (deliveryId: string, accept: boolean) =>
        client.post(`/deliveries/${deliveryId}/respond`, { accept }),
      generatePickupOtp: (orderId: string) =>
        client.post<{ deliveryId: string; pickupOtp: string | null; pickedUp: boolean }>(
          `/deliveries/order/${orderId}/pickup-otp`,
        ),
      advanceStage: (deliveryId: string, payload: Record<string, unknown>) =>
        client.post(`/deliveries/${deliveryId}/advance`, payload),
      updateLocation: (deliveryId: string, payload: Record<string, unknown>) =>
        client.post(`/deliveries/${deliveryId}/location`, payload),
      goOnline: (isOnline: boolean) => client.patch("/drivers/me/status", { isOnline }),
      earnings: () => client.get("/drivers/me/earnings"),
      activeForRestaurant: (restaurantId: string) =>
        client.get(`/deliveries/restaurant/${restaurantId}/active`),
    },
    coupons: {
      list: () => client.get("/coupons"),
      listMine: (restaurantId: string) => client.get(`/coupons/mine?restaurantId=${restaurantId}`),
      validate: (code: string, orderValue: number) =>
        client.post("/coupons/validate", { code, orderValue }),
      create: (payload: Record<string, unknown>) => client.post("/coupons", payload),
      update: (id: string, payload: Record<string, unknown>) =>
        client.patch(`/coupons/${id}`, payload),
    },
    admin: {
      dashboard: () => client.get("/admin/dashboard"),
      revenueAnalytics: (range: string, from?: string, to?: string) =>
        client.get(
          `/admin/analytics/revenue?range=${range}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`,
        ),
      financialReport: (from: string, to: string) =>
        client.get(`/admin/reports/financial?from=${from}&to=${to}`),

      orders: (query = "") => client.get(`/admin/orders${query}`),
      orderDetail: (id: string) => client.get(`/admin/orders/${id}`),

      payments: (query = "") => client.get(`/admin/payments${query}`),

      refunds: (query = "") => client.get(`/admin/refunds${query}`),
      getRefund: (id: string) => client.get(`/admin/refunds/${id}`),
      createRefund: (orderId: string, reason: string, refundAmount?: number) =>
        client.post(`/admin/orders/${orderId}/refund`, { reason, refundAmount }),
      approveRefund: (id: string) => client.post(`/admin/refunds/${id}/approve`, {}),
      rejectRefund: (id: string, note: string) =>
        client.post(`/admin/refunds/${id}/reject`, { note }),
      processRefund: (id: string, adminNote?: string) =>
        client.post(`/admin/refunds/${id}/process`, { adminNote }),

      coupons: (scope?: "platform" | "restaurant") =>
        client.get(`/admin/coupons${scope ? `?scope=${scope}` : ""}`),

      restaurants: () => client.get("/admin/restaurants"),
      restaurantDetail: (id: string) => client.get(`/admin/restaurants/${id}`),
      approveRestaurant: (id: string) => client.post(`/admin/restaurants/${id}/approve`, {}),
      suspendRestaurant: (id: string) => client.post(`/admin/restaurants/${id}/suspend`, {}),

      drivers: () => client.get("/admin/drivers"),
      driverDetail: (userId: string) => client.get(`/admin/drivers/${userId}`),

      customers: () => client.get("/admin/customers"),
      customerDetail: (id: string) => client.get(`/admin/customers/${id}`),

      suspendUser: (id: string) => client.post(`/admin/users/${id}/suspend`, {}),
      activateUser: (id: string) => client.post(`/admin/users/${id}/activate`, {}),

      reviews: (query = "") => client.get(`/admin/reviews${query}`),
      setReviewVisibility: (id: string, isHidden: boolean) =>
        client.patch(`/admin/reviews/${id}/visibility`, { isHidden }),

      activeDeliveries: () => client.get("/admin/deliveries/active"),
      search: (q: string) => client.get(`/admin/search?q=${encodeURIComponent(q)}`),
      auditLog: () => client.get("/admin/audit-log"),
    },
    ai: {
      ask: (prompt: string, portal: string) =>
        client.post<{ reply: string }>("/ai/copilot", { prompt, portal }),
    },
    geocoding: {
      reverse: (lat: number, lng: number) =>
        client.post<{
          formattedAddress: string;
          houseNumber?: string;
          area?: string;
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
          lat: number;
          lng: number;
        }>("/geocoding/reverse", { lat, lng }),
    },
    support: {
      ask: (payload: { message: string; language: string; role?: string; context?: Record<string, unknown> }) =>
        client.post<{ message: string; actions: { label: string; route: string }[] }>(
          "/support/assistant",
          payload,
        ),
      greeting: (language: string) =>
        client.get<{ message: string }>(`/support/assistant/greeting?language=${encodeURIComponent(language)}`),
    },
    payments: {
      getForOrder: (orderId: string) => client.get(`/payments/order/${orderId}`),
      verify: (payload: {
        orderId: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
      }) => client.post<{ verified: boolean }>("/payments/verify", payload),
    },
    notifications: {
      list: () => client.get("/notifications"),
      markRead: (id: string) => client.patch(`/notifications/${id}/read`, {}),
    },
    users: {
      updateProfile: (payload: Record<string, unknown>) => client.patch("/users/me", payload),
      changePassword: (currentPassword: string, newPassword: string) =>
        client.post<{ success: boolean }>("/users/me/change-password", { currentPassword, newPassword }),
    },
    uploads: {
      listRestaurantPhotos: (restaurantId: string) =>
        client.get(`/restaurants/${restaurantId}/photos`),
      deleteRestaurantPhoto: (restaurantId: string, photoId: string) =>
        client.delete(`/restaurants/${restaurantId}/photos/${photoId}`),
      setPrimaryRestaurantPhoto: (restaurantId: string, photoId: string) =>
        client.patch(`/restaurants/${restaurantId}/photos/${photoId}/primary`, {}),
      removeUserAvatar: () => client.delete<{ success: boolean }>("/users/me/avatar"),
    },
    withdrawals: {
      driverBalance: () => client.get<WalletBalanceDto>("/withdrawals/driver/balance"),
      requestDriverWithdrawal: (amount: number, payoutMethod: string) =>
        client.post("/withdrawals/driver", { amount, payoutMethod }),
      driverHistory: () => client.get<WithdrawalRequestDto[]>("/withdrawals/driver/history"),
      restaurantBalance: (restaurantId: string) =>
        client.get<WalletBalanceDto>(
          `/withdrawals/restaurant/balance?restaurantId=${restaurantId}`,
        ),
      requestRestaurantWithdrawal: (restaurantId: string, amount: number, payoutMethod: string) =>
        client.post("/withdrawals/restaurant", { restaurantId, amount, payoutMethod }),
      restaurantHistory: (restaurantId: string) =>
        client.get<WithdrawalRequestDto[]>(
          `/withdrawals/restaurant/history?restaurantId=${restaurantId}`,
        ),
      adminList: () => client.get<WithdrawalRequestDto[]>("/withdrawals"),
      adminUpdateStatus: (
        id: string,
        status: string,
        referenceId?: string,
        failureReason?: string,
      ) => client.patch(`/withdrawals/${id}/status`, { status, referenceId, failureReason }),
    },
  };
}

// ---------- Multipart uploads ----------
// The shared ApiClient above only ever sends JSON — file uploads need their
// own raw fetch (FormData, no Content-Type header so the browser sets the
// multipart boundary itself), but must still carry the same bearer token and
// the same 401-retry-once-after-refresh behavior as every other request.
export async function uploadFile(
  path: string,
  file: File,
  opts: { baseUrl: string; getAccessToken: TokenGetter },
): Promise<{ url: string } & Record<string, unknown>> {
  const form = new FormData();
  form.append("file", file);
  const token = opts.getAccessToken();
  const res = await fetch(`${opts.baseUrl}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data);
  }
  return data;
}

// ---------- Realtime ----------

export function createSocket(
  baseUrl: string,
  namespace: "/ws/orders" | "/ws/delivery",
  token: string,
): Socket {
  return io(`${baseUrl}${namespace}`, {
    auth: { token },
    transports: ["websocket"],
  });
}
