import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { LEMONSQUEEZY } from '@/lib/billing/plans';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature
    if (LEMONSQUEEZY.webhookSecret) {
      const signature = request.headers.get('x-signature') || '';
      const hmac = crypto.createHmac('sha256', LEMONSQUEEZY.webhookSecret);
      hmac.update(rawBody);
      const digest = hmac.digest('hex');

      if (digest !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;
    const userId = customData?.user_id;

    if (!userId) {
      console.log('LemonSqueezy webhook: no user_id in custom_data');
      return NextResponse.json({ received: true });
    }

    // Use service role for webhook operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const attrs = event.data?.attributes;

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        const plan = attrs?.variant_id === LEMONSQUEEZY.examBoostVariantId ? 'exam_boost' : 'pro';
        const status = mapStatus(attrs?.status);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          lemon_customer_id: String(attrs?.customer_id),
          lemon_subscription_id: String(event.data?.id),
          plan,
          status,
          current_period_start: attrs?.current_period_start,
          current_period_end: attrs?.current_period_end || attrs?.ends_at,
          cancel_at_period_end: attrs?.cancelled || false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        console.log(`Subscription ${eventName}: user=${userId} plan=${plan} status=${status}`);
        break;
      }

      case 'subscription_cancelled': {
        await supabase.from('subscriptions').update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        console.log(`Subscription cancelled: user=${userId}`);
        break;
      }

      case 'subscription_expired': {
        await supabase.from('subscriptions').update({
          status: 'expired',
          plan: 'free',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        console.log(`Subscription expired: user=${userId}`);
        break;
      }

      case 'order_created': {
        // Handle Exam Boost one-time purchase
        if (attrs?.first_order_item?.variant_id === Number(LEMONSQUEEZY.examBoostVariantId)) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            lemon_customer_id: String(attrs?.customer_id),
            plan: 'exam_boost',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          console.log(`Exam Boost purchased: user=${userId}`);
        }
        break;
      }

      default:
        console.log(`LemonSqueezy webhook: unhandled event ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function mapStatus(lsStatus: string): string {
  switch (lsStatus) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'cancelled': return 'cancelled';
    case 'expired': return 'expired';
    case 'paused': return 'paused';
    case 'on_trial': return 'active';
    default: return 'active';
  }
}
