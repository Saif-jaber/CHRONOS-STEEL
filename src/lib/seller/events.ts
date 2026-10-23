import "server-only";
import { prisma } from "@/lib/prisma";

export async function recordAddToBag(
  productId: string,
  accountId: string,
): Promise<void> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true },
    });
    if (!product?.sellerId) return;

    await prisma.sellerEvent.create({
      data: {
        type: "add_to_bag",
        sellerId: product.sellerId,
        productId,
        accountId,
      },
    });
  } catch {
    /* Analytics must never block a customer from adding a piece to the bag. */
  }
}
