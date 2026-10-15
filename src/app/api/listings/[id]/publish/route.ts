import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { catalog } from "@/lib/catalog/repository";

/**
 * POST /api/listings/[id]/publish.
 *
 * Moves one of the signed-in seller's own references from draft to published, so
 * it appears in the collection and on the storefront. Ownership is enforced in
 * the repository against the session's account id, never a body field, and a
 * reference that is not theirs answers exactly like one that does not exist.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account || account.role !== "seller") {
    return NextResponse.json(
      { error: "Sign in as a seller to publish a reference." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const product = await catalog.publishListing(id, account.id);
  if (!product) {
    return NextResponse.json(
      { error: "That reference could not be found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    product: { id: product.id, slug: product.slug, published: product.published },
  });
}
