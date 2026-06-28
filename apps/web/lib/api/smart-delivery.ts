const BASE = '/api/smart-delivery';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface DeliveryDetail {
  id: string;
  deliveryNumber: string;
  shipmentId: string;
  orderId: string;
  status: string;
  deliveredAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  receiverName: string | null;
  receiverMobile: string | null;
  courierNotes: string | null;
  buyerNotes: string | null;
  rejectionReason: string | null;
  rejectionNote: string | null;
  buyerCompany: { id: string; name: string; logo: string | null };
  sellerCompany: { id: string; name: string; logo: string | null };
  shipment: { id: string; shipmentNumber: string; trackingNumber: string | null; courierProvider?: { name: string } | null };
  order: { id: string; orderNumber: string; totalAmount?: number; currency?: string };
  proofOfDelivery: {
    id: string;
    receiverName: string | null;
    receiverMobile: string | null;
    otpVerified: boolean;
    digitalSignatureUrl: string | null;
    photoUrls: unknown;
    geoLatitude: number | null;
    geoLongitude: number | null;
    courierNotes: string | null;
    buyerNotes: string | null;
    deliveredAt: string;
    confirmedAt: string | null;
  } | null;
  timeline: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedByRole: string | null;
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
  [key: string]: unknown;
}

export async function createDelivery(data: { shipmentId: string; receiverName?: string; receiverMobile?: string; courierNotes?: string }): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmDelivery(deliveryId: string, data?: { receiverName?: string; receiverMobile?: string; otpVerified?: boolean; digitalSignatureUrl?: string; photoUrls?: string; geoLatitude?: number; geoLongitude?: number; courierNotes?: string; buyerNotes?: string }): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/${deliveryId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function rejectDelivery(deliveryId: string, data: { reason: string; note?: string }): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/${deliveryId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateDeliveryStatus(deliveryId: string, data: { status: string; note?: string }): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/${deliveryId}/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBuyerDeliveries(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<DeliveryDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/buyer?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSellerDeliveries(status?: string, page = 1, limit = 20): Promise<PaginatedResponse<DeliveryDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/seller?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/${deliveryId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDeliveryTimeline(deliveryId: string): Promise<DeliveryDetail['timeline']> {
  const res = await fetch(`${BASE}/${deliveryId}/timeline`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addDeliveryDocument(deliveryId: string, data: { docType: string; fileName: string; fileUrl: string }): Promise<unknown> {
  const res = await fetch(`${BASE}/${deliveryId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDeliveryDocuments(deliveryId: string): Promise<DeliveryDetail['documents']> {
  const res = await fetch(`${BASE}/${deliveryId}/documents`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminDeliveryAnalytics(): Promise<{ total: number; byStatus: Array<{ status: string; _count: { id: number } }>; pendingConfirmation: number; failedDeliveries: DeliveryDetail[]; recent: DeliveryDetail[] }> {
  const res = await fetch(`${BASE}/admin/analytics`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminDeliveries(status?: string, page = 1, limit = 50): Promise<PaginatedResponse<DeliveryDetail>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${BASE}/admin/all?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminDeliveryDetail(deliveryId: string): Promise<DeliveryDetail> {
  const res = await fetch(`${BASE}/admin/${deliveryId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
