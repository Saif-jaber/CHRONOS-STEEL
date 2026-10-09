import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { isObject, readJson } from "@/lib/auth/api";
import { catalog } from "@/lib/catalog/repository";
import { parseListing } from "@/lib/catalog/listing";

/**
 * POST /api/listings.
 *
 * Creates a reference for the signed-in seller. The body is parsed and validated
 * by `parseListing` — the same function regardless of what the form checked — and
 * the seller id is taken from the session, never the body, so a seller cannot
 * post a listing onto someone else's storefront.
 *
 * Photographs arrive as R2 public URLs and are refused unless they point at this
 * bucket, which stops a listing being used to serve arbitrary third-party images.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account || account.role !== "seller") {
    return NextResponse.json(
      { error: "Sign in as a seller to publish a listing." },
      { status: 401 },
    );
  }

  const body = await readJson(request);
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "The listing could not be read. Try again." },
      { status: 400 },
    );
  }

  const parsed = parseListing(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Check the fields highlighted below.", errors: parsed.errors },
      { status: 400 },
    );
  }

  const product = await catalog.createListing({
    ...parsed.input,
    sellerId: account.id,
  });

  return NextResponse.json(
    { product: { id: product.id, slug: product.slug, model: product.model } },
    { status: 201 },
  );
}
