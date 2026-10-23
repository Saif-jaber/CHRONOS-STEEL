import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { isObject, readJson } from "@/lib/auth/api";
import { cart } from "@/lib/cart/repository";
import { recordAddToBag } from "@/lib/seller/events";

function unauthorised(): NextResponse {
  return NextResponse.json({ error: "Sign in to use your bag." }, { status: 401 });
}

export async function GET(): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) return unauthorised();
  return NextResponse.json({ cart: await cart.getCart(account.id) });
}

export async function POST(request: Request): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) return unauthorised();

  const body = await readJson(request);
  if (!isObject(body) || typeof body.productId !== "string") {
    return NextResponse.json(
      { error: "That reference could not be added. Try again." },
      { status: 400 },
    );
  }

  const result = await cart.addItem(account.id, {
    productId: body.productId,
    dialId: typeof body.dialId === "string" ? body.dialId : undefined,
    strapId: typeof body.strapId === "string" ? body.strapId : undefined,
    quantity: typeof body.quantity === "number" ? body.quantity : undefined,
  });

  if (!result.ok) {
    const refusal = {
      "not-found": { error: "That reference could not be found.", status: 404 },
      "not-for-sale": { error: "That reference is not for sale.", status: 409 },
      unbuildable: {
        error: "That dial and strap cannot be built together.",
        status: 400,
      },
    }[result.reason];
    return NextResponse.json({ error: refusal.error }, { status: refusal.status });
  }

  await recordAddToBag(body.productId, account.id);

  return NextResponse.json({ cart: result.cart }, { status: 201 });
}

export async function DELETE(): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) return unauthorised();
  await cart.clear(account.id);
  return NextResponse.json({ cart: await cart.getCart(account.id) });
}
