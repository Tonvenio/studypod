import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LEMONSQUEEZY } from '@/lib/billing/plans';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { variantId } = await request.json();
    if (!variantId) {
      return NextResponse.json({ error: 'variantId required' }, { status: 400 });
    }

    if (!LEMONSQUEEZY.apiKey) {
      return NextResponse.json({ error: 'Payment not configured yet' }, { status: 503 });
    }

    // Create LemonSqueezy checkout
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMONSQUEEZY.apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                user_id: user.id,
              },
              email: user.email,
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3011'}/settings?upgraded=true`,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: LEMONSQUEEZY.storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LemonSqueezy checkout error:', errText);
      return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 });
    }

    const data = await response.json();
    const checkoutUrl = data.data?.attributes?.url;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 },
    );
  }
}
