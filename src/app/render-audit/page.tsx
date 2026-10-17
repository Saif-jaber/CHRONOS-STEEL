import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/catalog/products";
import { buildVariants, resolveDialSpec } from "@/lib/catalog/variants";
import { WatchRender } from "@/components/watch/WatchRender";

export const dynamic = "force-static";


export default function RenderAudit() {
  if (process.env.RENDER_AUDIT !== "1") notFound();

  return (
    <main className="flex flex-col gap-12 p-8">
      {PRODUCTS.map((product) => {
        const variants = buildVariants(product);
        const shown = variants.slice(0, 4);
        return (
          <section key={product.id} className="flex flex-col gap-4">
            <h2 className="text-sm">
              {product.model} &middot; {product.caseSpec.diameterMm}mm / {product.caseSpec.bezel} /{" "}
              {variants.length} variants
            </h2>
            {(["card", "full"] as const).map((detail) => (
              <div key={detail} className="grid grid-cols-4 gap-4" data-tier={detail}>
                {shown.map((v) => (
                  <figure key={`${detail}-${v.key}`} className="flex flex-col gap-2">
                    <WatchRender
                      product={product}
                      dial={resolveDialSpec(product, v.dial)}
                      strap={v.strap}
                      className="w-full"
                      detail={detail}
                    />
                    <figcaption className="font-measure text-[10px]">
                      {detail} / {v.dial.colorName} / {v.strap.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}
