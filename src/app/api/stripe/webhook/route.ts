import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] Assinatura inválida:", error);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object as Stripe.Checkout.Session;
    const userId =
      checkout.metadata?.userId ?? checkout.client_reference_id ?? null;

    if (userId && checkout.payment_status === "paid") {
      const db = requireDb();
      await db
        .update(users)
        .set({
          realEntryPaid: true,
          realEntryPaidAt: new Date(),
          stripeCustomerId:
            typeof checkout.customer === "string"
              ? checkout.customer
              : checkout.customer?.id ?? null,
          realBalance: 3000,
        })
        .where(eq(users.id, userId));
    }
  }

  return NextResponse.json({ received: true });
}
