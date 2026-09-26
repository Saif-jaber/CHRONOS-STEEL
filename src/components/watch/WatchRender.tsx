import { useId } from "react";
import type { DialSpec, Product, StrapOption } from "@/lib/types";
import { dialAppearance, finishTone, strapAppearance, darken } from "./appearance";
import {
  CX,
  CY,
  VIEW_H,
  VIEW_W,
  caseRadius,
  Crown,
  DateWindow,
  GmtRing,
  Hands,
  Indices,
  Lugs,
  MinuteTrack,
  MoonphaseAperture,
  PowerReserveSector,
  StrapBand,
  Subdial,
  lugWidthPx,
  polar,
  roundPx,
  strapGeometry,
} from "./geometry";

/**
 * The watch drawing.
 *
 * Everything visible here is derived from `product.caseSpec`, `product.movement`
 * and the two selected options, ?" there is no per-product artwork, so a dial
 * colour or a bracelet type added in the database appears here with no code
 * change. Sizes are honest: the 36 mm Sector is genuinely drawn smaller than
 * the 44 mm Vantage, on the same scale, which is the one thing a photograph of
 * a flat-lay can never do.
 *
 * This is Tier B enrichment, ?" hand-built SVG, ~10 KB, no image request, no
 * layout shift, and it renders identically at a 96 px card thumbnail and a
 * 720 px detail view.
 *
 * When your R2 photography is ready, replace the <svg> with an <Image> and keep
 * the wrapper's aspect ratio; the gallery, the variant cross-fade and the
 * variant manager around it do not change.
 */

export interface WatchRenderProps {
  product: Product;
  dial: DialSpec;
  strap: StrapOption;
  /** Lume charged, ?" draws the glow, and drops the room lighting. */
  night?: boolean;
  /**
   * A short cross-fade key. Bump it when the variant changes and the drawing
   * re-renders as a new layer that fades in over the old one, which is the only
   * motion primitive this site spends on the thing it is actually selling.
   */
  transitionKey?: string;
  className?: string;
  /** Decorative instances are hidden from assistive tech; the PDP supplies a label. */
  labelledBy?: string;
  /**
   * How much of the watch to draw.
   *
   * "card" is for the catalogue grid: case, dial, strap and hands, but none of
   * the engraving - no minute track, no bezel knurling, no index furniture, no
   * stitching. It is roughly a quarter of the bytes and, at 96 px, visually
   * indistinguishable from "full". "full" is for the product page and the
   * variant manager, where someone is actually reading the dial.
   */
  detail?: "card" | "full";
}

export function WatchRender({
  product,
  dial,
  strap,
  night = false,
  transitionKey,
  className,
  labelledBy,
  detail = "full",
}: WatchRenderProps) {
  const { caseSpec, movement, lume } = product;
  const radius = caseRadius(caseSpec.diameterMm);
  const metal = finishTone(caseSpec.material, caseSpec.finish);
  const appearance = dialAppearance(dial.option.colorHex, dial.option.finish);
  const strapLook = strapAppearance(strap.type, strap.colorHex, strap.stitchColorHex);
  const widthPx = lugWidthPx(caseSpec.lugWidthMm);

  // The dial sits inside the bezel, so it is smaller than the case by whatever
  // the bezel eats, ?" and a dive bezel eats a great deal more than a smooth one.
  const bezelInset = {
    smooth: 0.86,
    fluted: 0.88,
    "coin-edge": 0.9,
    dive: 0.8,
    tachymeter: 0.83,
    "gem-set": 0.87,
  }[caseSpec.bezel];
  const dialRadius = radius * bezelInset;

  const hasChrono = dial.complications.includes("chronograph");
  const hasGmt = dial.complications.includes("gmt");
  const hasMoon = dial.complications.includes("moonphase");
  const hasReserve = dial.complications.includes("power-reserve");
  const hasSmallSeconds = dial.complications.includes("small-seconds");
  const hasDate = dial.complications.includes("date");

  const sectorRail = product.collection === "Sector";
  const full = detail === "full";

  const label =
    labelledBy ??
    `${product.model}, ${caseSpec.diameterMm} mm ${caseSpec.material.replace(/-/g, " ")} case, ${dial.option.colorName} dial, ${strap.name} strap`;

  const uid = useId().replace(/:/g, "");

  const isDarkDial = appearance.isDark;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={labelledBy ? undefined : label}
      aria-hidden={labelledBy ? true : undefined}
      aria-labelledby={labelledBy}
      data-night={night || undefined}
      data-detail={detail}
      data-transition-key={transitionKey}
    >
      <defs>
        {/* Case flank: a broad vertical gradient reads as a turned metal band. */}
        <linearGradient id={`${uid}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={metal.light} />
          <stop offset="42%" stopColor={metal.mid} />
          <stop offset="78%" stopColor={metal.dark} />
          <stop offset="100%" stopColor={metal.mid} />
        </linearGradient>

        {/* Dial finish overlay. Sunburst is off-centre so it reads as a rotating
            sheen rather than a vignette; matte gets no overlay at all. */}
        {appearance.sheenStops && (
          <radialGradient
            id={`${uid}-dial`}
            cx="38%"
            cy="32%"
            r="78%"
            gradientTransform="rotate(-18 0.5 0.5)"
          >
            {appearance.sheenStops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </radialGradient>
        )}

        {/* Guilloché crosshatch. Two 45° line sets on a rotated grid, ?" a real
            engine-turned pattern, and free. */}
        {dial.option.finish === "guilloche" && (
          <pattern
            id={`${uid}-guilloche`}
            width="3.4"
            height="3.4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="3.4" height="3.4" fill="none" />
            <path d="M0 0 H3.4" stroke={isDarkDial ? "#FFFFFF" : "#000000"} strokeOpacity="0.07" strokeWidth="0.6" />
            <path d="M0 0 V3.4" stroke={isDarkDial ? "#FFFFFF" : "#000000"} strokeOpacity="0.05" strokeWidth="0.6" />
          </pattern>
        )}

        <clipPath id={`${uid}-dial-clip`}>
          <circle cx={CX} cy={CY} r={dialRadius} />
        </clipPath>
      </defs>

      {/* ---- Strap, behind everything ---- */}
      <g>
        <StrapBand
          geo={strapGeometry("top", radius, widthPx * 0.98)}
          appearance={strapLook}
          type={strap.type}
          uid={uid}
        />
        <StrapBand
          geo={strapGeometry("bottom", radius, widthPx * 0.98)}
          appearance={strapLook}
          type={strap.type}
          uid={uid}
        />
      </g>

      {/* ---- Crown sits behind the case band so the tube tucks under it ---- */}
      <Crown
        radius={radius}
        metal={metal}
        pushers={hasChrono ? 2 : hasMoon ? 0 : 0}
      />

      {/* ---- Lugs, then the case over their roots ---- */}
      <Lugs radius={radius} widthPx={widthPx} lugToLugMm={caseSpec.lugToLugMm} metal={metal} uid={uid} />
      <circle cx={CX} cy={CY} r={radius} fill={`url(#${uid}-case)`} />

      {/* A single specular arc on the upper-left flank. One highlight, not a
          gloss gradient: a lit metal edge, not a plastic button. */}
      <path
        d={describeArc(CX, CY, radius * 0.965, 186, 246)}
        fill="none"
        stroke={metal.sheen}
        strokeWidth={radius * 0.05}
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* ---- Bezel treatments ----
          Knurling, fluting and coin edges are engraving: below a pixel at card
          size, so "card" draws the bezel as a plain ring. */}
      {caseSpec.bezel === "dive" && (
        <DiveBezel radius={radius} dialRadius={dialRadius} metal={metal} uid={uid} detail={detail} />
      )}
      {caseSpec.bezel === "fluted" && (
        <FlutedBezel radius={radius} dialRadius={dialRadius} metal={metal} uid={uid} detail={detail} />
      )}
      {caseSpec.bezel === "tachymeter" && (
        <TachymeterBezel radius={radius} dialRadius={dialRadius} appearance={appearance} uid={uid} />
      )}
      {caseSpec.bezel === "coin-edge" && (
        <CoinEdgeBezel radius={radius} dialRadius={dialRadius} metal={metal} uid={uid} detail={detail} />
      )}

      {/* ---- Dial ---- */}
      <circle cx={CX} cy={CY} r={dialRadius} fill={appearance.base} />
      {dial.option.finish === "guilloche" && (
        <circle cx={CX} cy={CY} r={dialRadius} fill={`url(#${uid}-guilloche)`} />
      )}
      {appearance.sheenStops && <circle cx={CX} cy={CY} r={dialRadius} fill={`url(#${uid}-dial)`} />}

      <g clipPath={`url(#${uid}-dial-clip)`}>
        {hasGmt && <GmtRing dialRadius={dialRadius} appearance={appearance} />}
        {hasReserve && movement.powerReserveHours !== null && (
          <PowerReserveSector
            dialRadius={dialRadius}
            appearance={appearance}
            hours={movement.powerReserveHours}
          />
        )}

        <MinuteTrack dialRadius={dialRadius} appearance={appearance} rail={sectorRail} />

        <Indices
          dialRadius={dialRadius}
          style={dial.indexStyle}
          appearance={appearance}
          metal={metal}
          lume={lume}
          night={night}
          sectorRail={sectorRail}
          simplified={!full}
        />

        {/* Chronograph: running seconds at 9, 30-minute at 3, 12-hour at 6.
            That 3-6-9 arrangement is the convention, and the reason a
            monopusher puts its totaliser somewhere else entirely.

            A fully-ticked chrono is 102 separate <line> elements, so the ticks
            are the first thing dropped on a card: the subdial rings and the
            hands still read as a chronograph at 96 px. */}
        {hasChrono && (
          <>
            <Subdial deg={270} dialRadius={dialRadius} appearance={appearance} ticks={full ? 60 : 0} />
            <Subdial
              deg={90}
              dialRadius={dialRadius}
              appearance={appearance}
              ticks={full ? 30 : 0}
              numerals={full}
            />
            <Subdial
              deg={180}
              dialRadius={dialRadius}
              appearance={appearance}
              ticks={full ? 12 : 0}
              numerals={full}
            />
            <ChronoHands dialRadius={dialRadius} appearance={appearance} />
          </>
        )}

        {hasSmallSeconds && (
          <>
            <Subdial deg={180} dialRadius={dialRadius} appearance={appearance} ticks={full ? 60 : 0} />
            <SubdialHand deg={180} dialRadius={dialRadius} appearance={appearance} seconds={38} />
          </>
        )}

        {hasDate && <DateWindow deg={90} dialRadius={dialRadius} appearance={appearance} metal={metal} />}
        {hasMoon && <MoonphaseAperture deg={180} dialRadius={dialRadius} appearance={appearance} />}

        {/* Signature. Sits between 12 and centre, which is why the display time
            is 10:08, so the hands frame it instead of crossing it. */}
        <text
          x={CX}
          y={CY - dialRadius * 0.3}
          textAnchor="middle"
          fontSize={dialRadius * 0.105}
          fontFamily="var(--font-body)"
          fontWeight={500}
          letterSpacing="0.16em"
          fill={appearance.ink}
        >
          {dial.signature}
        </text>
        {dial.sublabel && (
          <text
            x={CX}
            y={CY - dialRadius * 0.16}
            textAnchor="middle"
            fontSize={dialRadius * 0.082}
            fontFamily="var(--font-measure)"
            letterSpacing="0.2em"
            fill={appearance.printing}
          >
            {dial.sublabel}
          </text>
        )}

        <Hands
          dialRadius={dialRadius}
          appearance={appearance}
          metal={metal}
          lume={lume}
          night={night}
          hasGmt={hasGmt}
          hasSmallSeconds={hasSmallSeconds}
          hasPowerReserve={hasReserve}
        />
      </g>

      {/* ---- Crystal ---- */}
      <path
        d={describeArc(CX, CY, dialRadius * 0.99, 200, 250)}
        fill="none"
        stroke={night ? "#2A3550" : "#FFFFFF"}
        strokeWidth={dialRadius * 0.045}
        strokeLinecap="round"
        opacity={night ? 0.18 : 0.26}
      />
      <circle
        cx={CX}
        cy={CY}
        r={dialRadius}
        fill="none"
        stroke={darken(metal.dark, 0.3)}
        strokeWidth={0.7}
        opacity={0.5}
      />
    </svg>
  );
}

/* ---- Bezel treatments -------------------------------------------------------------- */

function BezelBase({
  radius,
  dialRadius,
  metal,
  id,
}: {
  radius: number;
  dialRadius: number;
  metal: { light: string; mid: string; dark: string };
  id: string;
}) {
  return (
    <>
      <circle cx={CX} cy={CY} r={(radius + dialRadius) / 2} fill={metal.mid} />
      <circle
        cx={CX}
        cy={CY}
        r={radius}
        fill="none"
        stroke={metal.dark}
        strokeWidth={(radius - dialRadius) * 0.5}
        opacity={0.4}
      />
      <defs>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={metal.light} />
          <stop offset="55%" stopColor={metal.mid} />
          <stop offset="100%" stopColor={metal.dark} />
        </linearGradient>
      </defs>
      <circle cx={CX} cy={CY} r={(radius + dialRadius) / 2 + (radius - dialRadius) * 0.16} fill={`url(#${id}-bezel)`} />
      <circle cx={CX} cy={CY} r={dialRadius} fill="none" stroke={metal.dark} strokeWidth={0.8} />
    </>
  );
}

function DiveBezel({
  radius,
  dialRadius,
  metal,
  uid,
  detail,
}: {
  radius: number;
  dialRadius: number;
  metal: { light: string; mid: string; dark: string };
  uid: string;
  detail: "card" | "full";
}) {
  const id = `${uid}-dive`;
  const r = (radius + dialRadius) / 2;
  // The coin edge is a dashed circle rather than 120 individual teeth. `pathLength`
  // normalises the circumference to the tooth count, so one element covers the
  // whole knurl at any case diameter.
  const band = radius - dialRadius;
  const full = detail === "full";

  // The elapsed-time numerals are the reason a dive bezel exists, so they survive
  // to card size; only the knurl and the pip ring are dropped.
  const marks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => {
    const { x, y } = polar(r - band * 0.14, minute * 6);
    return (
      <text
        key={`dive-mark-${minute}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={roundPx(band * 0.3)}
        fontFamily="var(--font-measure)"
        fontWeight={500}
        fill={metal.light}
        opacity={0.92}
      >
        {minute === 0 ? "" : minute}
      </text>
    );
  });

  // The luminous pip at zero. A dive bezel without a zero pip is not a dive
  // bezel, and this is the one element on the watch that is read in the dark.
  const pip = polar(r, 0);

  return (
    <g>
      <BezelBase radius={radius} dialRadius={dialRadius} metal={metal} id={id} />
      {full && (
        <circle
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={metal.dark}
          strokeWidth={band * 0.42}
          strokeDasharray="0.5 0.5"
          pathLength={60}
          opacity={0.55}
        />
      )}
      {marks}
      <circle cx={pip.x} cy={pip.y} r={roundPx(band * 0.2)} fill="#D8F2D0" />
      <circle
        cx={pip.x}
        cy={pip.y}
        r={roundPx(band * 0.2)}
        fill="none"
        stroke={metal.dark}
        strokeWidth={0.6}
      />
    </g>
  );
}

function FlutedBezel({
  radius,
  dialRadius,
  metal,
  uid,
  detail,
}: {
  radius: number;
  dialRadius: number;
  metal: { light: string; mid: string; dark: string };
  uid: string;
  detail: "card" | "full";
}) {
  const r = (radius + dialRadius) / 2;
  return (
    <g>
      <BezelBase radius={radius} dialRadius={dialRadius} metal={metal} id={`${uid}-fluted`} />
      {/* 34 flutes as one dashed circle. Alternating light/dark is what makes
          fluting read as a cut surface rather than a texture. */}
      {detail === "full" && (
        <>
          <circle
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={metal.dark}
            strokeWidth={(radius - dialRadius) * 0.44}
            strokeDasharray="0.5 0.5"
            pathLength={34}
            opacity={0.5}
          />
          <circle
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={metal.light}
            strokeWidth={(radius - dialRadius) * 0.2}
            strokeDasharray="0.26 0.74"
            pathLength={34}
            opacity={0.35}
          />
        </>
      )}
    </g>
  );
}

function CoinEdgeBezel({
  radius,
  dialRadius,
  metal,
  uid,
  detail,
}: {
  radius: number;
  dialRadius: number;
  metal: { light: string; mid: string; dark: string };
  uid: string;
  detail: "card" | "full";
}) {
  const r = (radius + dialRadius) / 2;
  return (
    <g>
      <BezelBase radius={radius} dialRadius={dialRadius} metal={metal} id={`${uid}-coin`} />
      {/* Fine knurling, two rings: a tight 60-tooth ring and a coarser 30-tooth
          ring, which is what gives a coin edge its shimmer as it turns. */}
      {detail === "full" && (
        <>
          <circle
            cx={CX}
            cy={CY}
            r={r + (radius - dialRadius) * 0.18}
            fill="none"
            stroke={metal.dark}
            strokeWidth={0.9}
            strokeDasharray="0.55 0.45"
            pathLength={60}
            opacity={0.6}
          />
          <circle
            cx={CX}
            cy={CY}
            r={r + (radius - dialRadius) * 0.18}
            fill="none"
            stroke={metal.light}
            strokeWidth={1.1}
            strokeDasharray="0.5 0.5"
            pathLength={30}
            opacity={0.4}
          />
        </>
      )}
    </g>
  );
}

function TachymeterBezel({
  radius,
  dialRadius,
  appearance,
  uid,
}: {
  radius: number;
  dialRadius: number;
  appearance: { isDark: boolean; printing: string; ink: string };
  uid: string;
}) {
  const r = (radius + dialRadius) / 2;
  const id = `${uid}-tachy`;

  // Standard tachymeter graduations, in seconds over an hour.
  const graduations = [400, 300, 240, 200, 180, 160, 140, 120, 100, 90, 80, 70, 60, 50, 45, 40, 35, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#2A2A28" />
          <stop offset="100%" stopColor="#131312" />
        </linearGradient>
      </defs>
      <circle cx={CX} cy={CY} r={r + (radius - dialRadius) * 0.3} fill={`url(#${id}-ring)`} />
      {graduations.map((value) => {
        const angle = (3600 / value / 60) * 360;
        const { x, y } = polar(r + (radius - dialRadius) * 0.05, angle);
        return (
          <text
            key={`tachy-${value}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={(radius - dialRadius) * 0.24}
            fontFamily="var(--font-measure)"
            fill={appearance.isDark ? "#EDEAE2" : "#1A1A18"}
          >
            {value}
          </text>
        );
      })}
      <circle cx={CX} cy={CY} r={r - (radius - dialRadius) * 0.12} fill="none" stroke="#F2EFE7" strokeOpacity="0.28" strokeWidth={0.6} />
      <circle cx={CX} cy={CY} r={dialRadius} fill="none" stroke="#131312" strokeWidth={0.8} />
    </g>
  );
}

/* ---- Chronograph hands -------------------------------------------------------------- */

function ChronoHands({
  dialRadius,
  appearance,
}: {
  dialRadius: number;
  appearance: { isDark: boolean };
}) {
  const hand = (deg: number, seconds: number, colour: string) => {
    const centre = polar(dialRadius * 0.24, deg);
    const radians = ((seconds / 60) * 360 - 90) * (Math.PI / 180);
    const length = dialRadius * 0.185;
    return (
      <line
        key={`ch-${deg}`}
        x1={centre.x}
        y1={centre.y}
        x2={centre.x + Math.cos(radians) * length}
        y2={centre.y + Math.sin(radians) * length}
        stroke={colour}
        strokeWidth={dialRadius * 0.024}
        strokeLinecap="round"
      />
    );
  };
  const colour = appearance.isDark ? "#E8E4DA" : "#26262A";
  return (
    <g>
      {hand(270, 38, colour)}
      {hand(90, 22, colour)}
      {hand(180, 8, colour)}
    </g>
  );
}

function SubdialHand({
  deg,
  dialRadius,
  appearance,
  seconds,
}: {
  deg: number;
  dialRadius: number;
  appearance: { isDark: boolean };
  seconds: number;
}) {
  const centre = polar(dialRadius * 0.24, deg);
  const radians = ((seconds / 60) * 360 - 90) * (Math.PI / 180);
  const length = dialRadius * 0.185;
  return (
    <g>
      <line
        x1={centre.x}
        y1={centre.y}
        x2={centre.x + Math.cos(radians) * length}
        y2={centre.y + Math.sin(radians) * length}
        stroke={appearance.isDark ? "#E8E4DA" : "#26262A"}
        strokeWidth={dialRadius * 0.026}
        strokeLinecap="round"
      />
      <circle cx={centre.x} cy={centre.y} r={dialRadius * 0.022} fill={appearance.isDark ? "#E8E4DA" : "#26262A"} />
    </g>
  );
}

/* ---- Arc helper -------------------------------------------------------------- */

/** A partial circle as an SVG path, degrees measured clockwise from 12. */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
): string {
  const start = polar(radius, from);
  const end = polar(radius, to);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(
    2,
  )} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
