import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PoPdfService {
  private readonly logger = new Logger(PoPdfService.name);

  generateHtml(po: any): string {
    const p = po;
    const bg = '#0a0a0a';
    const cardBg = '#141414';
    const border = '#2a2a2a';
    const text = '#e5e5e5';
    const muted = '#888';
    const accent = '#FF4D00';

    const lineItems = (p.lineItems || []).map((li: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid ${border};color:${text}">${li.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${border};color:${muted};text-align:center">${li.quantity || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${border};color:${muted};text-align:center">${li.unit || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${border};color:${text};text-align:right">${p.currency || 'INR'} ${(li.unitPrice || 0).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${border};color:${text};text-align:right">${p.currency || 'INR'} ${(li.totalPrice || li.unitPrice * (li.quantity || 1) || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const timeline = (p.events || []).map((e: any) => `
      <div style="margin-bottom:8px;padding:8px 12px;background:${cardBg};border-radius:6px;border-left:3px solid ${accent}">
        <strong style="color:${text};font-size:13px;text-transform:capitalize">${(e.eventType || '').replace(/_/g, ' ').toLowerCase()}</strong>
        <span style="color:${muted};font-size:11px;float:right">${e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : ''}</span>
        ${e.actorRole ? `<br><span style="color:${muted};font-size:11px">By: ${e.actorRole}</span>` : ''}
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Purchase Order ${p.poNumber}</title>
<style>
  body { font-family: 'Segoe UI',Arial,sans-serif; background:${bg}; color:${text}; margin:0; padding:40px; font-size:13px; }
  .header { text-align:center; margin-bottom:40px; }
  .header h1 { color:${accent}; font-size:28px; margin:0; letter-spacing:2px; }
  .header h2 { color:${muted}; font-size:14px; font-weight:400; margin:4px 0; }
  .badge { display:inline-block; padding:4px 14px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; background:${accent}22; color:${accent}; border:1px solid ${accent}44; margin-top:8px; }
  .section { background:${cardBg}; border:1px solid ${border}; border-radius:12px; padding:24px; margin-bottom:20px; }
  .section h3 { color:${accent}; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 16px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .field { margin-bottom:4px; }
  .field label { color:${muted}; font-size:11px; display:block; }
  .field span { color:${text}; font-size:13px; font-weight:600; }
  table { width:100%; border-collapse:collapse; }
  th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; color:${muted}; border-bottom:2px solid ${border}; }
  td { padding:8px 12px; border-bottom:1px solid ${border}; }
  .total-row td { border-top:2px solid ${accent}; font-weight:700; color:${text}; }
  .footer { text-align:center; color:${muted}; font-size:11px; margin-top:40px; padding-top:20px; border-top:1px solid ${border}; }
  .signature-area { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:20px; }
  .signature-box { border:1px dashed ${border}; border-radius:8px; padding:20px; text-align:center; min-height:80px; }
  .signature-box label { color:${muted}; font-size:11px; display:block; margin-bottom:4px; }
</style></head><body>
  <div class="header">
    <h1>PURCHASE ORDER</h1>
    <h2>${p.poNumber}</h2>
    <div class="badge">${(p.status || '').replace(/_/g, ' ')}</div>
  </div>

  <div class="section">
    <h3>Parties</h3>
    <div class="grid">
      <div><label>Buyer</label><span>${po.buyerCompany?.name || 'N/A'}</span></div>
      <div><label>Seller</label><span>${po.sellerCompany?.name || 'N/A'}</span></div>
    </div>
  </div>

  <div class="section">
    <h3>References</h3>
    <div class="grid">
      <div><label>Negotiation ID</label><span>${p.negotiationId?.slice(0, 8) || '-'}</span></div>
      <div><label>Quote ID</label><span>${p.quoteId?.slice(0, 8) || '-'}</span></div>
      <div><label>RFQ ID</label><span>${p.rfqId?.slice(0, 8) || '-'}</span></div>
      <div><label>Date</label><span>${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '-'}</span></div>
    </div>
  </div>

  <div class="section">
    <h3>Products</h3>
    <table>
      <thead><tr>
        <th>Product</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th>
        <th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th>
      </tr></thead>
      <tbody>${lineItems || '<tr><td colspan="5" style="text-align:center;color:' + muted + '">No line items</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <h3>Commercial Terms</h3>
    <div class="grid">
      <div><label>Subtotal</label><span>${p.currency || 'INR'} ${(p.subtotal || 0).toLocaleString('en-IN')}</span></div>
      <div><label>Tax</label><span>${p.currency || 'INR'} ${(p.taxAmount || 0).toLocaleString('en-IN')}</span></div>
      <div><label>Discount</label><span>${p.discountPercent ? p.discountPercent + '%' : '-'}</span></div>
      <div><label style="color:${accent};font-weight:700">Total</label><span style="color:${accent};font-weight:700">${p.currency || 'INR'} ${(p.totalAmount || 0).toLocaleString('en-IN')}</span></div>
      <div><label>Delivery Terms</label><span>${p.deliveryTerms || '-'}</span></div>
      <div><label>Payment Terms</label><span>${p.paymentTerms ? p.paymentTerms.replace(/_/g, ' ') : '-'}</span></div>
      <div><label>Lead Time</label><span>${p.leadTimeDays ? p.leadTimeDays + ' days' : '-'}</span></div>
      <div><label>Valid Until</label><span>${p.validityDate ? new Date(p.validityDate).toLocaleDateString('en-IN') : '-'}</span></div>
      <div><label>Freight</label><span>${p.freight || '-'}</span></div>
      <div><label>Packing</label><span>${p.packing || '-'}</span></div>
      <div><label>Warranty</label><span>${p.warranty || '-'}</span></div>
      <div><label>GST Type</label><span>${p.gstType || '-'}</span></div>
    </div>
    ${p.specialConditions ? `<div style="margin-top:16px"><label>Special Conditions</label><span>${p.specialConditions}</span></div>` : ''}
    ${p.commercialNotes ? `<div style="margin-top:8px"><label>Commercial Notes</label><span>${p.commercialNotes}</span></div>` : ''}
  </div>

  <div class="section">
    <h3>Digital Acceptance Timeline</h3>
    ${timeline || '<p style="color:' + muted + '">No events recorded</p>'}
  </div>

  <div class="section">
    <h3>Signatures</h3>
    <div class="signature-area">
      <div class="signature-box">
        <label>Buyer Signature</label>
        ${p.buyerConfirmedAt ? `<span style="color:#4ade80;font-size:13px">✓ Confirmed ${new Date(p.buyerConfirmedAt).toLocaleDateString('en-IN')}</span>` : '<span style="color:' + muted + ';font-size:11px">Pending</span>'}
      </div>
      <div class="signature-box">
        <label>Seller Signature</label>
        ${p.sellerAcceptedAt ? `<span style="color:#4ade80;font-size:13px">✓ Accepted ${new Date(p.sellerAcceptedAt).toLocaleDateString('en-IN')}</span>` : '<span style="color:' + muted + ';font-size:11px">Pending</span>'}
      </div>
      <div class="signature-box">
        <label>System Lock</label>
        ${p.lockedAt ? `<span style="color:#4ade80;font-size:13px">✓ Locked ${new Date(p.lockedAt).toLocaleDateString('en-IN')}</span>` : '<span style="color:' + muted + ';font-size:11px">Pending</span>'}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>TRADINGO — Purchase Order System</p>
    <p>This is a computer-generated document. Digital acceptance is legally binding.</p>
  </div>
</body></html>`;
  }
}
