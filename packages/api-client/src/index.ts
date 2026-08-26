import { io, Socket } from "socket.io-client";

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
    const data = text ? JSON.parse(text) : undefined;

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
    },
    orders: {
      checkout: (payload: Record<string, unknown>) => client.post("/orders", payload),
      list: (query = "") => client.get(`/orders${query}`),
      get: (id: string) => client.get(`/orders/${id}`),
      updateStatus: (id: string, payload: Record<string, unknown>) =>
        client.patch(`/orders/${id}/status`, payload),
      cancel: (id: string, reason?: string) =>
        client.post(`/orders/${id}/cancel`, { reason }),
    },
    delivery: {
      respondToOffer: (deliveryId: string, accept: boolean) =>
        client.post(`/deliveries/${deliveryId}/respond`, { accept }),
      advanceStage: (deliveryId: string, payload: Record<string, unknown>) =>
        client.post(`/deliveries/${deliveryId}/advance`, payload),
      updateLocation: (deliveryId: string, payload: Record<string, unknown>) =>
        client.post(`/deliveries/${deliveryId}/location`, payload),
      goOnline: (isOnline: boolean) => client.patch("/drivers/me/status", { isOnline }),
      earnings: () => client.get("/drivers/me/earnings"),
    },
    coupons: {
      list: () => client.get("/coupons"),
      validate: (code: string, orderValue: number) =>
        client.post("/coupons/validate", { code, orderValue }),
      create: (payload: Record<string, unknown>) => client.post("/coupons", payload),
    },
    admin: {
      dashboard: () => client.get("/admin/dashboard"),
      restaurants: () => client.get("/admin/restaurants"),
      approveRestaurant: (id: string) => client.post(`/admin/restaurants/${id}/approve`, {}),
      orders: () => client.get("/admin/orders"),
      customers: () => client.get("/admin/customers"),
      drivers: () => client.get("/admin/drivers"),
      activeDeliveries: () => client.get("/admin/deliveries/active"),
      auditLog: () => client.get("/admin/audit-log"),
    },
    ai: {
      ask: (prompt: string, portal: string) =>
        client.post<{ reply: string }>("/ai/copilot", { prompt, portal }),
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
  };
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
