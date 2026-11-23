import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderStatus, SavedDesign } from '../src/types/index.ts';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export const isServerSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const client: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function isUuid(val?: string): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!client) return false;
  try {
    const { data: insertedOrder, error: orderErr } = await client
      .from('orders')
      .upsert(
        {
          order_number: order.orderNumber,
          user_id: isUuid(order.userId) ? order.userId : null,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          shipping_address: order.shippingAddress,
          delivery_method: order.deliveryMethod,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          status: order.status,
          subtotal: order.subtotal,
          gst_amount: order.gstAmount,
          shipping_fee: order.shippingFee,
          discount_amount: order.discountAmount,
          total_amount: order.totalAmount,
          coupon_code: order.couponCode || null,
          cancel_reason: order.cancelReason || null,
          return_reason: order.returnReason || null,
        },
        { onConflict: 'order_number' }
      )
      .select('id')
      .single();

    if (orderErr || !insertedOrder) return false;

    const orderId = insertedOrder.id as string;

    if (order.items.length > 0) {
      await client.from('order_items').delete().eq('order_id', orderId);
      await client.from('order_items').insert(
        order.items.map((item) => ({
          order_id: orderId,
          product_id: isUuid(item.productId) ? item.productId : null,
          product_name: item.productName,
          color_name: item.colorName,
          size: item.size,
          print_area: item.printArea,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          design_preview_url: item.designPreviewUrl || null,
          canvas_json: item.canvasJson ? safeParseJson(item.canvasJson) : null,
        }))
      );
    }

    if (order.tracking.length > 0) {
      const latest = order.tracking[order.tracking.length - 1];
      await client.from('order_tracking').insert({
        order_id: orderId,
        status: latest.status,
        note: latest.note,
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function syncOrderStatusToSupabase(
  orderNumber: string,
  status: OrderStatus,
  note: string,
  extra?: { paymentStatus?: string; cancelReason?: string; returnReason?: string }
): Promise<boolean> {
  if (!client) return false;
  try {
    const updateBody: Record<string, unknown> = { status };
    if (extra?.paymentStatus) updateBody.payment_status = extra.paymentStatus;
    if (extra?.cancelReason) updateBody.cancel_reason = extra.cancelReason;
    if (extra?.returnReason) updateBody.return_reason = extra.returnReason;

    const { data, error } = await client
      .from('orders')
      .update(updateBody)
      .eq('order_number', orderNumber)
      .select('id')
      .single();

    if (error || !data) return false;

    await client.from('order_tracking').insert({
      order_id: data.id,
      status,
      note,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  if (!client) return null;
  try {
    const { data: rows, error } = await client
      .from('orders')
      .select('*, order_items(*), order_tracking(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !rows || rows.length === 0) return null;

    return rows.map((r) => {
      const items = Array.isArray(r.order_items)
        ? r.order_items.map((it: Record<string, unknown>) => ({
            id: String(it.id),
            productId: String(it.product_id || 'prod-1'),
            productName: String(it.product_name || 'Custom Item'),
            productType: String(it.print_area) === 'wrap' ? ('mug' as const) : ('tshirt' as const),
            imageUrl:
              String(it.design_preview_url || '') ||
              '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg',
            colorName: String(it.color_name || 'Charcoal Black'),
            colorHex: '#18181B',
            size: String(it.size || 'M'),
            printArea: (it.print_area as 'front' | 'back' | 'wrap' | 'none') || 'front',
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unit_price || 0),
            designPreviewUrl: it.design_preview_url ? String(it.design_preview_url) : undefined,
            canvasJson: it.canvas_json ? JSON.stringify(it.canvas_json) : undefined,
          }))
        : [];

      const tracking = Array.isArray(r.order_tracking)
        ? r.order_tracking
            .map((tr: Record<string, unknown>) => ({
              status: tr.status as OrderStatus,
              timestamp: String(tr.created_at || r.created_at),
              note: String(tr.note || ''),
            }))
            .sort((a: { timestamp: string }, b: { timestamp: string }) =>
              a.timestamp.localeCompare(b.timestamp)
            )
        : [];

      return {
        id: String(r.id),
        orderNumber: String(r.order_number),
        userId: r.user_id ? String(r.user_id) : undefined,
        customerName: String(r.customer_name),
        customerEmail: String(r.customer_email),
        customerPhone: String(r.customer_phone),
        shippingAddress: r.shipping_address,
        deliveryMethod: (r.delivery_method as 'standard' | 'express') || 'standard',
        paymentMethod: (r.payment_method as 'razorpay_test' | 'cod') || 'cod',
        paymentStatus: (r.payment_status as 'pending' | 'paid' | 'refunded') || 'pending',
        status: r.status as OrderStatus,
        subtotal: Number(r.subtotal || 0),
        gstAmount: Number(r.gst_amount || 0),
        shippingFee: Number(r.shipping_fee || 0),
        discountAmount: Number(r.discount_amount || 0),
        totalAmount: Number(r.total_amount || 0),
        couponCode: r.coupon_code ? String(r.coupon_code) : undefined,
        cancelReason: r.cancel_reason ? String(r.cancel_reason) : undefined,
        returnReason: r.return_reason ? String(r.return_reason) : undefined,
        items,
        tracking:
          tracking.length > 0
            ? tracking
            : [{ status: r.status as OrderStatus, timestamp: String(r.created_at), note: 'Order synced.' }],
        createdAt: String(r.created_at),
      };
    });
  } catch {
    return null;
  }
}

export async function syncDesignToSupabase(design: SavedDesign): Promise<boolean> {
  if (!client) return false;
  try {
    const payload = {
      title: design.title,
      user_id: isUuid(design.userId) ? design.userId : null,
      product_id: isUuid(design.productId) ? design.productId : null,
      product_type: design.productType,
      color_hex: design.colorHex,
      print_area: design.printArea,
      canvas_json: safeParseJson(design.canvasJson) || { raw: design.canvasJson },
      preview_url: design.previewDataUrl || null,
      updated_at: design.updatedAt,
    };

    if (isUuid(design.id)) {
      const { error } = await client.from('designs').upsert({ id: design.id, ...payload });
      return !error;
    }

    const { error } = await client.from('designs').insert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchDesignsFromSupabase(): Promise<SavedDesign[] | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('designs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return null;

    return data.map((d) => ({
      id: String(d.id),
      userId: d.user_id ? String(d.user_id) : undefined,
      title: String(d.title || 'My Custom Design'),
      productId: String(d.product_id || 'prod-1'),
      productType: d.product_type === 'mug' ? 'mug' : 'tshirt',
      colorName: 'Custom Color',
      colorHex: String(d.color_hex || '#18181B'),
      printArea: (d.print_area as 'front' | 'back' | 'wrap') || 'front',
      canvasJson: typeof d.canvas_json === 'string' ? d.canvas_json : JSON.stringify(d.canvas_json || {}),
      previewDataUrl: String(d.preview_url || ''),
      updatedAt: String(d.updated_at || d.created_at || new Date().toISOString()),
    }));
  } catch {
    return null;
  }
}

function safeParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
