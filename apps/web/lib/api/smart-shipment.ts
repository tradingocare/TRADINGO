const BASE = '/api/smart-shipment';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface ShipmentDetail {
  id: string;
  shipmentNumber: string;
  orderId: string;
  type: string;
  status: string;
  courierProviderId: string | null;
  courierProvider: { id: string; name: string; slug: string; trackingUrl: string | null } | null;
  trackingNumber: string | null;
  weight: number | null;
  totalPackages: number;
  dispatchDate: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
  deliveryAddress: Record<string, unknown> | null;
  pickupAddress: Record<string, unknown> | null;
  specialInstructions: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  buyerCompany: { id: string; name: string; logo: string | null };
  sellerCompany: { id: string; name: string; logo: string | null };
  order: { id: string; orderNumber: string; status: string };
  packages: Array<{
    id: string;
    label: string | null;
    weight: number | null;
    contents: string | null;
    declaredValue: number | null;
  }>;
  timeline: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedByRole: string | null;
    location: string | null;
    note: string | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    docType: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export async function createShipment(data: { orderId: string; type?: string; weight?: number; totalPackages?: number; deliveryAddress?: Record<string, unknown>; pickupAddress?: Record<string, unknown>; specialInstructions?: string; buyerNotes?: string }): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assignCourier(shipmentId: string, data: { courierProviderId: string; trackingNumber: string; estimatedDeliveryDate?: string; courierDetails?: Record<string, unknown> }): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/${shipmentId}/assign-courier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateShipmentStatus(shipmentId: string, data: { status: string; note?: string; location?: string }): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/${shipmentId}/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBuyerShipments(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<ShipmentDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/buyer?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSellerShipments(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<ShipmentDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/seller?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchShipmentDetail(shipmentId: string): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/${shipmentId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateShipment(shipmentId: string, data: Record<string, unknown>): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/${shipmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchShipmentTimeline(shipmentId: string): Promise<ShipmentDetail['timeline']> {
  const res = await fetch(`${BASE}/${shipmentId}/timeline`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addShipmentDocument(shipmentId: string, data: { docType: string; fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }): Promise<unknown> {
  const res = await fetch(`${BASE}/${shipmentId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchShipmentDocuments(shipmentId: string): Promise<ShipmentDetail['documents']> {
  const res = await fetch(`${BASE}/${shipmentId}/documents`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCourierProviders(): Promise<Array<{ id: string; name: string; slug: string; trackingUrl: string | null }>> {
  const res = await fetch(`${BASE}/courier-providers`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function seedCouriers(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${BASE}/seed-couriers`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminShipmentAnalytics(): Promise<{ totalShipments: number; byStatus: Array<{ status: string; _count: { id: number } }>; byCourier: Array<{ courierProviderId: string; _count: { id: number } }>; delayedShipments: ShipmentDetail[]; recentShipments: ShipmentDetail[] }> {
  const res = await fetch(`${BASE}/admin/analytics`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminShipments(status?: string, page = 1, limit = 50): Promise<PaginatedResponse<ShipmentDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/admin/all?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminShipmentDetail(shipmentId: string): Promise<ShipmentDetail> {
  const res = await fetch(`${BASE}/admin/${shipmentId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
