import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { isObject, readJson } from "@/lib/auth/api";
import { catalog } from "@/lib/catalog/repository";
import { parseListing } from "@/lib/catalog/listing";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account || account.role !== "seller") {
    return NextResponse.json(
      { error: "Sign in as a seller to edit a listing." },
      { status: 401 },
    );
  }

  const { id } = await params;
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

  const product = await catalog.updateListing(id, account.id, {
    ...parsed.input,
    sellerId: account.id,
  });
  if (!product) {
    return NextResponse.json(
      { error: "That reference could not be found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { product: { id: product.id, slug: product.slug, model: product.model } },
  );
}
