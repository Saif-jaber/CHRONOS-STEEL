"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Button,
  ButtonLink,
} from "@/components/ui/Button";
import {
  Checkbox,
  ColorField,
  FormNote,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Field";
import { IconClose } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Add a reference.
 *
 * The seller fills in one reference with one dial and one strap; the server turns
 * that into the catalogue's two-axis shape. The closed-set options below mirror
 * the unions in `lib/types.ts`; the server re-validates every one of them, so
 * these lists are a convenience, not the gate.
 *
 * Photographs are uploaded to R2 the moment they are chosen, not on submit, so
 * the slow part happens while the seller is still filling in the price. The form
 * then carries only the resulting URLs, which keeps the create request small and
 * the bytes out of the Next server entirely.
 */

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const MATERIALS = [
  "stainless-steel",
  "titanium",
  "white-gold",
  "yellow-gold",
  "rose-gold",
  "platinum",
  "bronze",
  "ceramic",
].map((value) => ({ value, label: humanise(value) }));

const FINISHES = ["polished", "brushed", "sandblasted", "bead-blasted"].map((value) => ({
  value,
  label: humanise(value),
}));

const BEZELS = ["smooth", "fluted", "dive", "tachymeter", "coin-edge", "gem-set"].map((value) => ({
  value,
  label: humanise(value),
}));

const CRYSTALS = ["sapphire", "domed-sapphire", "mineral", "acrylic"].map((value) => ({
  value,
  label: humanise(value),
}));

const MOVEMENTS = ["automatic", "manual", "quartz"].map((value) => ({
  value,
  label: humanise(value),
}));

const WINDINGS = ["self-winding", "hand-wound", "quartz"].map((value) => ({
  value,
  label: humanise(value),
}));

const STRAPS = ["leather", "bracelet", "rubber", "nato", "mesh", "perforated"].map((value) => ({
  value,
  label: humanise(value),
}));

const DIAL_FINISHES = ["matte", "sunburst", "lacquered", "guilloche", "salmon"].map((value) => ({
  value,
  label: humanise(value),
}));

const INDEX_STYLES = ["baton", "roman", "arabic", "dauphine", "mixed", "minimal"].map((value) => ({
  value,
  label: humanise(value),
}));

const CURRENCIES = ["USD", "EUR", "GBP", "JPY"].map((value) => ({ value, label: value }));

function humanise(value: string): string {
  const spaced = value.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type FormValues = {
  brand: string;
  model: string;
  reference: string;
  collection: string;
  yearIntroduced: string;
  summary: string;
  story: string;
  basePrice: string;
  currency: string;
  diameterMm: string;
  thicknessMm: string;
  lugToLugMm: string;
  lugWidthMm: string;
  material: string;
  finish: string;
  bezel: string;
  crystal: string;
  waterResistanceM: string;
  movementType: string;
  caliber: string;
  manufacturer: string;
  powerReserveHours: string;
  frequencyVph: string;
  jewels: string;
  components: string;
  winding: string;
  dialName: string;
  dialColorName: string;
  dialColorHex: string;
  dialFinish: string;
  strapType: string;
  strapName: string;
  strapMaterial: string;
  strapColorName: string;
  strapColorHex: string;
  indexStyle: string;
  stock: string;
  editionSize: string;
  tags: string;
  lume: boolean;
  featured: boolean;
};

const EMPTY: FormValues = {
  brand: "",
  model: "",
  reference: "",
  collection: "",
  yearIntroduced: String(new Date().getFullYear()),
  summary: "",
  story: "",
  basePrice: "",
  currency: "USD",
  diameterMm: "40",
  thicknessMm: "12",
  lugToLugMm: "",
  lugWidthMm: "20",
  material: "stainless-steel",
  finish: "brushed",
  bezel: "smooth",
  crystal: "sapphire",
  waterResistanceM: "100",
  movementType: "automatic",
  caliber: "",
  manufacturer: "",
  powerReserveHours: "",
  frequencyVph: "",
  jewels: "",
  components: "",
  winding: "self-winding",
  dialName: "Dial",
  dialColorName: "",
  dialColorHex: "#1a1a1a",
  dialFinish: "matte",
  strapType: "leather",
  strapName: "",
  strapMaterial: "",
  strapColorName: "",
  strapColorHex: "#2b2b2b",
  indexStyle: "baton",
  stock: "",
  editionSize: "",
  tags: "",
  lume: false,
  featured: false,
};

/** Keys in on-screen order, so focus can find the first failure. */
const FIELD_ORDER: ReadonlyArray<keyof FormValues> = [
  "brand",
  "model",
  "reference",
  "collection",
  "yearIntroduced",
  "summary",
  "basePrice",
  "diameterMm",
  "dialColorName",
  "strapColorName",
];

interface UploadedImage {
  url: string;
  name: string;
}

export function ListingForm({ storageConfigured }: { storageConfigured: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadError(null);

    if (images.length + files.length > MAX_IMAGES) {
      setUploadError(`You can add up to ${MAX_IMAGES} photographs.`);
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files can be added.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setUploadError("Each photograph must be under 8 MB.");
        return;
      }
    }

    setUploading(true);
    try {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((file) => ({ type: file.type, size: file.size })),
        }),
      });

      if (!presign.ok) {
        const data = await presign.json().catch(() => null);
        setUploadError(
          data && typeof data.error === "string"
            ? data.error
            : "The photographs could not be uploaded.",
        );
        return;
      }

      const { uploads } = (await presign.json()) as {
        uploads: Array<{ key: string; uploadUrl: string; publicUrl: string }>;
      };

      await Promise.all(
        uploads.map((upload, index) =>
          fetch(upload.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": files[index]!.type },
            body: files[index]!,
          }).then((response) => {
            if (!response.ok) throw new Error("upload failed");
          }),
        ),
      );

      setImages((current) => [
        ...current,
        ...uploads.map((upload, index) => ({
          url: upload.publicUrl,
          name: files[index]!.name,
        })),
      ]);
    } catch {
      setUploadError("The photographs could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((current) => current.filter((image) => image.url !== url));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (uploading) {
      setServerError("Wait for the photographs to finish uploading.");
      return;
    }

    setSending(true);

    let response: Response;
    try {
      response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, images: images.map((image) => image.url) }),
      });
    } catch {
      setSending(false);
      setServerError("The listing could not be sent. Try again.");
      return;
    }

    if (response.ok) {
      router.push("/seller");
      router.refresh();
      return;
    }

    setSending(false);
    const data = await response.json().catch(() => null);
    if (data && typeof data === "object") {
      if (typeof (data as { error?: unknown }).error === "string") {
        setServerError((data as { error: string }).error);
      }
      const fieldErrors = (data as { errors?: Record<string, string> }).errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
        const first = FIELD_ORDER.find((key) => fieldErrors[key]);
        if (first) document.getElementById(first)?.focus();
      }
    } else {
      setServerError("The listing could not be saved. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-xl">
      <Section title="The reference" note="How the watch is named and found.">
        <TextField
          id="brand"
          label="Brand or maker"
          value={values.brand}
          onChange={(v) => set("brand", v)}
          error={errors.brand}
          placeholder="e.g. Chronos & Steel"
        />
        <TextField
          id="model"
          label="Model"
          value={values.model}
          onChange={(v) => set("model", v)}
          error={errors.model}
          placeholder="e.g. Meridian 38"
        />
        <TextField
          id="reference"
          label="Reference"
          value={values.reference}
          onChange={(v) => set("reference", v)}
          error={errors.reference}
          placeholder="e.g. CS-114-02"
        />
        <TextField
          id="collection"
          label="Collection"
          value={values.collection}
          onChange={(v) => set("collection", v)}
          error={errors.collection}
          placeholder="e.g. Meridian"
        />
        <NumberField
          id="yearIntroduced"
          label="Year introduced"
          value={values.yearIntroduced}
          onChange={(v) => set("yearIntroduced", v)}
          error={errors.yearIntroduced}
          min={1900}
          max={2100}
          step={1}
        />
        <div className="sm:col-span-2">
          <TextField
            id="summary"
            label="Summary"
            value={values.summary}
            onChange={(v) => set("summary", v)}
            error={errors.summary}
            placeholder="One sentence, plain."
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            id="story"
            label="Story"
            value={values.story}
            onChange={(v) => set("story", v)}
            error={errors.story}
            hint="Optional. Two or three paragraphs of editorial."
          />
        </div>
      </Section>

      <Section title="Case and dial" note="These drive the drawing of the watch.">
        <NumberField
          id="diameterMm"
          label="Case diameter (mm)"
          value={values.diameterMm}
          onChange={(v) => set("diameterMm", v)}
          error={errors.diameterMm}
          min={20}
          max={60}
          step={0.1}
        />
        <NumberField
          id="lugWidthMm"
          label="Lug width (mm)"
          value={values.lugWidthMm}
          onChange={(v) => set("lugWidthMm", v)}
          error={errors.lugWidthMm}
          min={10}
          max={30}
          step={0.5}
          hint="The strap is cut to this width."
        />
        <SelectField
          id="material"
          label="Case material"
          value={values.material}
          onChange={(v) => set("material", v)}
          options={MATERIALS}
        />
        <SelectField
          id="bezel"
          label="Bezel"
          value={values.bezel}
          onChange={(v) => set("bezel", v)}
          options={BEZELS}
        />
        <TextField
          id="dialColorName"
          label="Dial colour name"
          value={values.dialColorName}
          onChange={(v) => set("dialColorName", v)}
          error={errors.dialColorName}
          placeholder="e.g. Midnight blue"
        />
        <ColorField
          id="dialColorHex"
          label="Dial colour"
          value={values.dialColorHex}
          onChange={(v) => set("dialColorHex", v)}
          error={errors.dialColorHex}
        />
        <SelectField
          id="dialFinish"
          label="Dial finish"
          value={values.dialFinish}
          onChange={(v) => set("dialFinish", v)}
          options={DIAL_FINISHES}
        />
        <SelectField
          id="indexStyle"
          label="Hour markers"
          value={values.indexStyle}
          onChange={(v) => set("indexStyle", v)}
          options={INDEX_STYLES}
        />
      </Section>

      <Section title="Strap" note="One strap, cut to the lug width above.">
        <SelectField
          id="strapType"
          label="Strap type"
          value={values.strapType}
          onChange={(v) => set("strapType", v)}
          options={STRAPS}
        />
        <TextField
          id="strapColorName"
          label="Strap colour name"
          value={values.strapColorName}
          onChange={(v) => set("strapColorName", v)}
          error={errors.strapColorName}
          placeholder="e.g. Black alligator"
        />
        <ColorField
          id="strapColorHex"
          label="Strap colour"
          value={values.strapColorHex}
          onChange={(v) => set("strapColorHex", v)}
          error={errors.strapColorHex}
        />
        <TextField
          id="strapName"
          label="Strap name"
          value={values.strapName}
          onChange={(v) => set("strapName", v)}
          error={errors.strapName}
          placeholder="Optional"
        />
      </Section>

      <Section title="Price and availability" note="Priced before it is configured, never after.">
        <NumberField
          id="basePrice"
          label="Base price"
          value={values.basePrice}
          onChange={(v) => set("basePrice", v)}
          error={errors.basePrice}
          min={1}
          step={1}
          placeholder="e.g. 4500"
        />
        <SelectField
          id="currency"
          label="Currency"
          value={values.currency}
          onChange={(v) => set("currency", v)}
          options={CURRENCIES}
        />
        <NumberField
          id="stock"
          label="In stock"
          value={values.stock}
          onChange={(v) => set("stock", v)}
          error={errors.stock}
          min={0}
          step={1}
          hint="Leave empty for made to order."
        />
        <NumberField
          id="editionSize"
          label="Edition size"
          value={values.editionSize}
          onChange={(v) => set("editionSize", v)}
          error={errors.editionSize}
          min={1}
          step={1}
          hint="Leave empty for no limit."
        />
        <div className="sm:col-span-2">
          <TextField
            id="tags"
            label="Tags"
            value={values.tags}
            onChange={(v) => set("tags", v)}
            hint="Comma-separated, up to eight. They are matched by search."
            placeholder="dive, steel, automatic"
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-sm">
          <Checkbox
            id="featured"
            checked={values.featured}
            onChange={(v) => set("featured", v)}
          >
            Feature this reference at the top of the collection.
          </Checkbox>
          <Checkbox id="lume" checked={values.lume} onChange={(v) => set("lume", v)}>
            The dial is lumed.
          </Checkbox>
        </div>
      </Section>

      <details className="rule-t pt-sm">
        <summary className="eyebrow cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          Movement and further specifications
        </summary>
        <div className="mt-md grid gap-md sm:grid-cols-2">
          <SelectField
            id="movementType"
            label="Movement"
            value={values.movementType}
            onChange={(v) => set("movementType", v)}
            options={MOVEMENTS}
          />
          <SelectField
            id="winding"
            label="Winding"
            value={values.winding}
            onChange={(v) => set("winding", v)}
            options={WINDINGS}
          />
          <TextField
            id="caliber"
            label="Calibre"
            value={values.caliber}
            onChange={(v) => set("caliber", v)}
            error={errors.caliber}
          />
          <TextField
            id="manufacturer"
            label="Movement maker"
            value={values.manufacturer}
            onChange={(v) => set("manufacturer", v)}
            error={errors.manufacturer}
            hint="Defaults to the brand."
          />
          <NumberField
            id="powerReserveHours"
            label="Power reserve (h)"
            value={values.powerReserveHours}
            onChange={(v) => set("powerReserveHours", v)}
            error={errors.powerReserveHours}
            min={0}
            step={1}
          />
          <NumberField
            id="frequencyVph"
            label="Frequency (vph)"
            value={values.frequencyVph}
            onChange={(v) => set("frequencyVph", v)}
            error={errors.frequencyVph}
            min={0}
            step={1}
          />
          <NumberField
            id="jewels"
            label="Jewels"
            value={values.jewels}
            onChange={(v) => set("jewels", v)}
            error={errors.jewels}
            min={0}
            step={1}
          />
          <NumberField
            id="components"
            label="Components"
            value={values.components}
            onChange={(v) => set("components", v)}
            error={errors.components}
            min={0}
            step={1}
          />
          <SelectField
            id="finish"
            label="Case finish"
            value={values.finish}
            onChange={(v) => set("finish", v)}
            options={FINISHES}
          />
          <SelectField
            id="crystal"
            label="Crystal"
            value={values.crystal}
            onChange={(v) => set("crystal", v)}
            options={CRYSTALS}
          />
          <NumberField
            id="thicknessMm"
            label="Thickness (mm)"
            value={values.thicknessMm}
            onChange={(v) => set("thicknessMm", v)}
            error={errors.thicknessMm}
            min={4}
            max={30}
            step={0.1}
          />
          <NumberField
            id="lugToLugMm"
            label="Lug to lug (mm)"
            value={values.lugToLugMm}
            onChange={(v) => set("lugToLugMm", v)}
            error={errors.lugToLugMm}
            min={24}
            max={80}
            step={0.1}
            hint="Left empty, it is derived from the diameter."
          />
          <NumberField
            id="waterResistanceM"
            label="Water resistance (m)"
            value={values.waterResistanceM}
            onChange={(v) => set("waterResistanceM", v)}
            error={errors.waterResistanceM}
            min={0}
            max={2000}
            step={10}
          />
          <TextField
            id="strapMaterial"
            label="Strap material"
            value={values.strapMaterial}
            onChange={(v) => set("strapMaterial", v)}
            error={errors.strapMaterial}
            hint="Defaults to the strap type."
          />
          <TextField
            id="dialName"
            label="Dial name"
            value={values.dialName}
            onChange={(v) => set("dialName", v)}
            error={errors.dialName}
          />
        </div>
      </details>

      <section className="rule-t pt-sm">
        <div className="flex items-baseline justify-between gap-md">
          <div>
            <h2 className="text-xl">Photographs</h2>
            <p className="mt-2xs measure text-sm leading-relaxed text-muted">
              One or more photographs. They are stored on Cloudflare R2 and shown on
              the card in place of the drawn watch.
            </p>
          </div>
          <span className="measure shrink-0 text-xs text-faint">
            {images.length}/{MAX_IMAGES}
          </span>
        </div>

        {!storageConfigured ? (
          <div className="mt-md">
            <FormNote tone="error">
              Image storage is not configured. Add the R2_ variables to <code>.env</code>{" "}
              and restart the server to enable uploads. The listing can still be saved
              without photographs.
            </FormNote>
          </div>
        ) : null}

        <input
          ref={fileRef}
          id="listing-images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={uploadFiles}
        />

        {images.length > 0 ? (
          <ul className="mt-md grid grid-cols-2 gap-sm sm:grid-cols-4">
            {images.map((image) => (
              <li key={image.url} className="relative">
                <span className="block bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.name}
                    className="aspect-square w-full object-cover"
                  />
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(image.url)}
                  aria-label={`Remove ${image.name}`}
                  className="hit absolute right-1 top-1 inline-flex size-6 items-center justify-center bg-navy/80 text-paper transition-opacity dur-base ease-out hover:opacity-80"
                >
                  <IconClose className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-md flex flex-wrap items-center gap-md">
          <Button
            type="button"
            variant="outline"
            disabled={!storageConfigured || uploading || images.length >= MAX_IMAGES}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Add photographs"}
          </Button>
          <span className="text-xs text-faint">JPEG, PNG, WebP or AVIF, up to 8 MB each.</span>
        </div>

        {uploadError ? (
          <div className="mt-md">
            <FormNote tone="error">{uploadError}</FormNote>
          </div>
        ) : null}
      </section>

      <div className="rule-t flex flex-col gap-md pt-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-md">
          <Button type="submit" disabled={sending || uploading} className={cx(sending && "opacity-70")}>
            {sending ? "Publishing…" : "Publish listing"}
          </Button>
          <ButtonLink href="/seller" variant="outline">
            Cancel
          </ButtonLink>
        </div>
        <p className="measure text-xs text-faint">
          Published references appear on your storefront and in the collection straight away.
        </p>
      </div>

      {serverError ? <FormNote tone="error">{serverError}</FormNote> : null}
    </form>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="rule-t pt-sm">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-2xs measure text-sm leading-relaxed text-muted">{note}</p>
      <div className="mt-md grid gap-md sm:grid-cols-2">{children}</div>
    </section>
  );
}
