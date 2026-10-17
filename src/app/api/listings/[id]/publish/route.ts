import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { catalog } from "@/lib/catalog/repository";

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
