import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Subscribe to live Supabase Realtime order updates when configured.
 * Returns a clean unsubscribe callback (no-op if Supabase env vars aren't set yet).
 */
export function subscribeToOrderRealtime(
  orderNumber: string,
  onChange: () => void
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`order-track-${orderNumber}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `order_number=eq.${orderNumber}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
