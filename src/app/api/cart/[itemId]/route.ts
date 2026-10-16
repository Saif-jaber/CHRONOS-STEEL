import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { isObject, readJson } from "@/lib/auth/api";
import { cart } from "@/lib/cart/repository";

/**
 * One line in the bag.
 *
 * PATCH sets its quantity; DELETE removes it. Both are scoped to the signed-in
 * account by the repository, and a line that is not the caller's answers exactly
 * like one that does not exist.
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to use your bag." }, { status: 401 });
  }

  const body = await readJson(request);
  if (!isObject(body) || typeof body.quantity !== "number") {
    return NextResponse.json(
      { error: "That quantity could not be read." },
      { status: 400 },
    );
  }

  const { itemId } = await params;
  const updated = await cart.setQuantity(account.id, itemId, body.quantity);
  if (!updated) {
    return NextResponse.json(
      { error: "That line is no longer in your bag." },
      { status: 404 },
    );
  }

  return NextResponse.json({ cart: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to use your bag." }, { status: 401 });
  }

  const { itemId } = await params;
  return NextResponse.json({ cart: await cart.removeItem(account.id, itemId) });
}
