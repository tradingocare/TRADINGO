import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  generateInvoiceHtml(invoice: any): string {
    const company = invoice.company || {};
    const loc = company.locations?.[0] || {};
    const payment = invoice.payment || {};
    const items = invoice.items || [];
    const taxBreakdown = invoice.taxBreakdown || [];
    const totalAmount = Number(invoice.totalAmount);
    const subtotal = Number(invoice.subtotal);
    const taxAmount = Number(invoice.taxAmount || 0);
    const discountAmount = Number(invoice.discountAmount || 0);
    const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const taxRows = taxBreakdown.map((t: any) =>
      `<tr><td style="padding:6px 12px;border:1px solid #ddd;text-align:left">${t.taxType}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:center">${Number(t.rate).toFixed(2)}%</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:right">₹ ${Number(t.amount).toFixed(2)}</td></tr>`
    ).join('');

    const itemRows = items.map((item: any, i: number) =>
      `<tr><td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${i + 1}</td><td style="padding:8px 12px;border:1px solid #ddd">${item.description}</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${item.hsnSacCode || '—'}</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${item.quantity}</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right">₹ ${Number(item.unitPrice).toFixed(2)}</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right">₹ ${Number(item.amount).toFixed(2)}</td></tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
  body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FF4D00; }
  .brand h1 { color: #FF4D00; font-size: 28px; margin: 0; }
  .brand p { color: #666; font-size: 11px; margin: 2px 0; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { color: #333; font-size: 18px; margin: 0 0 5px; }
  .invoice-meta p { font-size: 11px; color: #666; margin: 2px 0; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 13px; color: #FF4D00; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; }
  .details { display: flex; gap: 40px; }
  .details div { flex: 1; }
  .details p { font-size: 11px; margin: 3px 0; color: #555; }
  .details strong { color: #333; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #FFF5F0; padding: 8px 12px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; color: #333; text-align: left; }
  td { font-size: 11px; }
  .totals { width: 300px; margin-left: auto; }
  .totals td { padding: 6px 12px; border: 1px solid #ddd; }
  .totals .grand { background: #FFF5F0; font-weight: bold; font-size: 14px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
  .footer p { font-size: 10px; color: #999; margin: 3px 0; }
  .declaration { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; font-size: 10px; color: #666; }
  .qr-placeholder { width: 80px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; text-align: center; float: right; margin-left: 20px; }
</style></head>
<body>
  <div class="header">
    <div class="brand">
      <h1>TRADINGO</h1>
      <p>A Brand of Niksa Global Ventures Limited</p>
      <p>GSTIN: 07AAKCN7471R1ZH</p>
      <p style="font-size:9px;color:#999;max-width:280px">House No. 194, Block-G, Pocket 6, Sector 16, Rohini, New Delhi &minus; 110089</p>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Date:</strong> ${now}</p>
      <p><strong>Status:</strong> ${invoice.status}</p>
    </div>
  </div>

  <div class="section">
    <h3>Invoice To</h3>
    <div class="details">
      <div>
        <p><strong>${company.name || '—'}</strong></p>
        <p>${loc.addressLine1 || ''} ${loc.city || ''} ${loc.state || ''}</p>
        <p>${loc.pincode ? 'PIN: ' + loc.pincode : ''}</p>
        <p>Email: ${company.email || '—'}</p>
        <p>Mobile: ${company.mobile || '—'}</p>
        ${company.gstNumber ? `<p><strong>GSTIN:</strong> ${company.gstNumber}</p>` : ''}
        ${company.panNumber ? `<p><strong>PAN:</strong> ${company.panNumber}</p>` : ''}
      </div>
      <div>
        <p><strong>Service:</strong> ${invoice.planName || 'Membership'}</p>
        <p><strong>HSN/SAC:</strong> ${invoice.hsnSacCode || '998311'}</p>
        <p><strong>Payment:</strong> ${payment.gateway || '—'}</p>
        ${payment.gatewayPaymentId ? `<p><strong>Transaction ID:</strong> ${payment.gatewayPaymentId}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Service Details</h3>
    <table>
      <thead><tr><th>#</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="6" style="text-align:center;padding:12px;color:#999">No items</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <h3>Tax Summary</h3>
    <table class="totals">
      <tr><td style="text-align:left">Subtotal</td><td style="text-align:right">₹ ${subtotal.toFixed(2)}</td></tr>
      ${discountAmount > 0 ? `<tr><td style="text-align:left">Discount</td><td style="text-align:right;color:red">− ₹ ${discountAmount.toFixed(2)}</td></tr>` : ''}
      ${taxRows}
      <tr class="grand"><td style="text-align:left">Grand Total</td><td style="text-align:right">₹ ${totalAmount.toFixed(2)}</td></tr>
    </table>
  </div>

  <div class="declaration">
    <div class="qr-placeholder">QR Code<br/>(E-Invoice)</div>
    <p><strong>Declaration:</strong></p>
    <p>We declare that this invoice shows the actual price of the services rendered and that all particulars are true and correct.</p>
    <p>This is a computer-generated invoice. No signature required.</p>
    <p><strong>Terms:</strong> Payment received. Subscription activated.</p>
    <p style="margin-top:8px;color:#333;"><strong>Authorized Signatory:</strong> For TRADINGO India Pvt. Ltd.</p>
  </div>

  <div class="footer">
    <p>TRADINGO India Pvt. Ltd. | www.tradingo.com | support@tradingo.com</p>
    <p>${company.gstNumber ? 'GSTIN: ' + company.gstNumber : ''}</p>
    <p>Invoice #${invoice.invoiceNumber} | Generated on ${now}</p>
  </div>
</body></html>`;
  }

  generatePdfBuffer(html: string): Buffer {
    this.logger.log('PDF generation requested (pdfkit/pdf-lib integration point)');
    return Buffer.from(html);
  }
}
