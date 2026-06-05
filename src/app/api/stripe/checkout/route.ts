import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getStripe,
  REAL_ENTRY_AMOUNT_CENTS,
  REAL_ENTRY_CURRENCY,
} from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login primeiro" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Pagamentos não configurados" },
      { status: 503 }
    );
  }

  const db = requireDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (user.realEntryPaid) {
    return NextResponse.json({ error: "Inscrição já paga" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { userId: user.id, type: "real_entry" },
    line_items: [
      {
        price_data: {
          currency: REAL_ENTRY_CURRENCY,
          unit_amount: REAL_ENTRY_AMOUNT_CENTS,
          product_data: {
            name: "Inscrição Cartola — Dinheiro Real",
            description: "Acesso ao ambiente de palpites com dinheiro real",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/palpites?inscricao=paga`,
    cancel_url: `${appUrl}/palpites?inscricao=cancelada`,
  });

  return NextResponse.json({ url: checkout.url });
}
