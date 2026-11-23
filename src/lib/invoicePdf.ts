import { jsPDF } from 'jspdf';
import type { Order } from '../types/index.ts';

export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(14, 14, 18);
  doc.rect(0, 0, pageWidth, 98, 'F');

  // Mini Ink-Drop Crest Emblem (28x28 at x=40, y=22)
  doc.setFillColor(26, 23, 40);
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(1);
  doc.roundedRect(40, 22, 28, 28, 7, 7, 'FD');
  // Architectural white D spine + arc accent
  doc.setDrawColor(250, 249, 246);
  doc.setLineWidth(2.4);
  doc.line(48, 29, 48, 43);
  doc.line(48, 29, 55, 29);
  doc.line(48, 43, 55, 43);
  // Coral-violet ink droplet dot inside D
  doc.setFillColor(255, 90, 95);
  doc.circle(55.5, 36.5, 4.2, 'F');
  doc.setFillColor(124, 58, 237);
  doc.circle(54.2, 37.5, 2.5, 'F');
  // Top-right nib registration dot
  doc.setFillColor(255, 90, 95);
  doc.circle(64, 26, 1.3, 'F');

  // Dual-tone DesignDrop wordmark
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 245, 247);
  doc.text('Design', 76, 43);
  const designWidth = doc.getTextWidth('Design');
  doc.setTextColor(167, 139, 250);
  doc.text('Drop', 76 + designWidth, 43);
  const dropWidth = doc.getTextWidth('Drop');
  doc.setFillColor(255, 90, 95);
  doc.circle(76 + designWidth + dropWidth + 4, 41, 2.3, 'F');

  doc.setTextColor(210, 210, 220);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Custom T-Shirts & Mugs Print Studio', 40, 66);
  doc.text('GSTIN: 33AABCD1234E1Z5  |  support@designdrop.in', 40, 80);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 40, 44, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #INV-${order.orderNumber}`, pageWidth - 40, 62, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - 40, 77, { align: 'right' });

  // Customer Details
  doc.setTextColor(25, 25, 32);
  let y = 132;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed & Shipped To:', 40, y);
  doc.text('Order Summary:', pageWidth - 220, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 18;
  doc.text(order.customerName, 40, y);
  doc.text(`Order ID: ${order.orderNumber}`, pageWidth - 220, y);
  y += 15;
  doc.text(order.shippingAddress.street, 40, y);
  doc.text(
    `Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay Test'}`,
    pageWidth - 220,
    y
  );
  y += 15;
  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`,
    40,
    y
  );
  doc.text(`Status: ${order.status}`, pageWidth - 220, y);
  y += 15;
  doc.text(`Phone: ${order.customerPhone}`, 40, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Delivery PIN: ${order.shippingAddress.postalCode}`, pageWidth - 220, y);
  doc.setFont('helvetica', 'normal');

  // Table header
  y += 34;
  doc.setFillColor(242, 242, 247);
  doc.rect(40, y, pageWidth - 80, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Item', 50, y + 17);
  doc.text('Size & Color', 250, y + 17);
  doc.text('Qty', 390, y + 17, { align: 'right' });
  doc.text('Price (incl. GST)', 465, y + 17, { align: 'right' });
  doc.text('Total', pageWidth - 50, y + 17, { align: 'right' });

  y += 38;
  doc.setFont('helvetica', 'normal');
  for (const item of order.items) {
    doc.text(item.productName.slice(0, 34), 50, y);
    doc.text(`${item.size}, ${item.colorName}`.slice(0, 24), 250, y);
    doc.text(String(item.quantity), 390, y, { align: 'right' });
    doc.text(`Rs ${item.unitPrice}`, 465, y, { align: 'right' });
    doc.text(`Rs ${item.unitPrice * item.quantity}`, pageWidth - 50, y, { align: 'right' });
    y += 22;
    doc.setDrawColor(230, 230, 236);
    doc.line(40, y - 10, pageWidth - 40, y - 10);
  }

  // Totals with Base Price + 18% GST breakdown (9% CGST + 9% SGST)
  y += 16;
  const taxableAfterDiscount = Math.max(0, order.subtotal - order.discountAmount);
  const gstTotal = order.gstAmount || Math.round((taxableAfterDiscount * 18) / 118);
  const basePrice = Math.max(0, taxableAfterDiscount - gstTotal);
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;
  const labelX = pageWidth - 245;
  const valX = pageWidth - 50;

  const drawRow = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, labelX, y);
    doc.text(val, valX, y, { align: 'right' });
    y += 18;
  };

  drawRow('Item Total (Tax Included):', `Rs ${order.subtotal}`);
  if (order.discountAmount > 0) {
    drawRow(`Discounts (${order.couponCode || 'Bundle / Offer'}):`, `-Rs ${order.discountAmount}`);
  }
  drawRow('Base Price (Before GST):', `Rs ${basePrice}`);
  drawRow('CGST (9%):', `Rs ${cgst}`);
  drawRow('SGST (9%):', `Rs ${sgst}`);
  drawRow('Delivery Fee:', order.shippingFee === 0 ? 'Free' : `Rs ${order.shippingFee}`);
  y += 4;
  doc.setDrawColor(124, 58, 237);
  doc.line(labelX, y - 10, valX, y - 10);
  drawRow('Grand Total (18% GST Incl.):', `Rs ${order.totalAmount}`, true);

  // Footer note
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 120);
  doc.text('Thank you for creating with DesignDrop! Need help? Email support@designdrop.in', 40, y);

  doc.save(`DesignDrop-Invoice-${order.orderNumber}.pdf`);
}
