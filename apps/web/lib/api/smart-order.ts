const BASE = '/api/smart-order';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  [key: string]: unknown;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  timeline: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    changedByRole: string | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    docType: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }>;
  buyerCompany: { id: string; name: string; logo: string | null };
  sellerCompany: { id: string; name: string; logo: string | null };
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export async function createOrderFromPo(poId: string): Promise<CreateOrderResponse> {
  const res = await fetch(`${BASE}/${poId}/create-from-po`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBuyerOrders(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<OrderDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/buyer?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSellerOrders(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<OrderDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/seller?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await fetch(`${BASE}/${orderId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: string, note?: string): Promise<OrderDetail> {
  const res = await fetch(`${BASE}/${orderId}/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateOrder(orderId: string, data: Record<string, unknown>): Promise<OrderDetail> {
  const res = await fetch(`${BASE}/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelOrder(orderId: string, data: { reason: string; reasonText?: string; note?: string }): Promise<OrderDetail> {
  const res = await fetch(`${BASE}/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function requestReturn(orderId: string, data: { reason: string; description?: string; quantity?: number }): Promise<unknown> {
  const res = await fetch(`${BASE}/${orderId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOrderTimeline(orderId: string): Promise<OrderDetail['timeline']> {
  const res = await fetch(`${BASE}/${orderId}/timeline`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOrderDocuments(orderId: string): Promise<OrderDetail['documents']> {
  const res = await fetch(`${BASE}/${orderId}/documents`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOrderAnalytics(): Promise<unknown> {
  const res = await fetch(`${BASE}/analytics`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminOrderAnalytics(): Promise<{ totalOrders: number; byStatus: Array<{ status: string; _count: { id: number } }>; recentOrders: OrderDetail[] }> {
  const res = await fetch(`${BASE}/admin/analytics`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminOrders(status?: string, page = 1, limit = 50): Promise<PaginatedResponse<OrderDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/admin/all?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await fetch(`${BASE}/admin/${orderId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
