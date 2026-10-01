import type { ReactNode } from "react";
import type { IndexStyle, StrapType } from "@/lib/types";
import {
  LUME_FILL,
  LUME_GLOW,
  type DialAppearance,
  type MetalAppearance,
  type StrapAppearance,
  darken,
} from "./appearance";

/**
 * Geometry for the watch drawing.
 *
 * Everything is derived from the product's own measurements, so the case you
 * see is the case that is described: a 44 mm Vantage really is drawn larger than
 * a 36 mm Sector, and the 4.2 mm Reserve really is the thinnest thing on the
 * page. `MM` is the conversion, pixels per millimetre at the reference size.
 *
 * 0° is 12 o'clock and angles increase clockwise, which is how a dial is
 * actually numbered and saves an axis flip in every index routine.
 */

export const MM = 1.409;

/** The drawing box. 220 × 290 holds a 44 mm case with strap above and below. */
export const VIEW_W = 220;
export const VIEW_H = 290;
export const CX = VIEW_W / 2;
export const CY = VIEW_H / 2;

export function caseRadius(diameterMm: number): number {
  return (diameterMm / 2) * MM;
}

export function lugWidthPx(lugWidthMm: number): number {
  return lugWidthMm * 1.24;
}

/** How far each lug tip reaches past the case, from the lug-to-lug figure. */
export function lugExtension(diameterMm: number, lugToLugMm: number): number {
  return ((lugToLugMm - diameterMm) / 2) * MM;
}

/**
 * Rounds a coordinate for serialisation. Every mark in the drawing goes through
 * this, and it is worth roughly 40% of the inline payload: an unrounded
 * `102.38069600000001` is 19 characters where `102.38` is 6, and at 220 units
 * wide the third decimal is far below a device pixel. Pure serialisation
 * concern, all maths still runs at full float precision.
 *
 * Note for future edits: a comment anywhere in this project that contains a
 * bare utility name will be picked up by Tailwind's scanner and emitted into the
 * shipped stylesheet. `scripts/audit-home.cjs` asserts that no radius utility
 * is present, so keep class-like tokens out of comments.
 */
const px = (n: number): number => Math.round(n * 100) / 100;

/** Exported for the renderer's own radii, which need the same rounding. */
export const roundPx = px;

/** Polar to cartesian, 0° at 12 o'clock, clockwise positive. */
export function polar(radius: number, degrees: number): { x: number; y: number } {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: px(CX + radius * Math.cos(radians)), y: px(CY + radius * Math.sin(radians)) };
}

/**
 * Polar about an arbitrary centre. Subsidiary dials need this: their hands and
 * ticks are laid out around their own centre, not the middle of the movement.
 */
export function polarRing(
  centre: { x: number; y: number },
  radius: number,
  degrees: number,
): { x: number; y: number } {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: px(centre.x + radius * Math.cos(radians)),
    y: px(centre.y + radius * Math.sin(radians)),
  };
}

/* ── Display time ────────────────────────────────────────────────────────
 * 10:08:37 is the display convention: the hands frame the signature instead of
 * covering it, and the seconds hand sits clear of both. Fixed rather than live,
 * because a catalogue whose thumbnails disagree with each other reads as a bug.
 */
const HOUR_DEGREES = ((10 + 8 / 60) / 12) * 360;
const MINUTE_DEGREES = ((8 + 37 / 60) / 60) * 360;
const SECOND_DEGREES = (37 / 60) * 360;

export const DISPLAY_TIME = { hour: HOUR_DEGREES, minute: MINUTE_DEGREES, second: SECOND_DEGREES };

/* ── Strap ───────────────────────────────────────────────────────────────
 * The band runs from the case edge to the frame boundary, so the watch reads as
 * continuing past the crop rather than ending inside it. */

export interface StrapGeometry {
  top: { x: number; y: number };
  width: number;
  from: number;
  to: number;
}

export function strapGeometry(
  side: "top" | "bottom",
  radius: number,
  widthPx: number,
): StrapGeometry {
  const edge = CY - radius;
  return {
    top: { x: CX, y: side === "top" ? edge : CY + radius },
    width: widthPx,
    from: side === "top" ? -4 : CY + radius,
    to: side === "top" ? edge : VIEW_H + 4,
  };
}

export function StrapBand({
  geo,
  appearance,
  type,
  uid = "s",
}: {
  geo: StrapGeometry;
  appearance: StrapAppearance;
  type: StrapType;
  /** Per-instance id prefix. SVG gradient ids are document-global, so two
      cards showing the same strap type would otherwise share one gradient. */
  uid?: string;
}) {
  const { top, width, from, to } = geo;
  const half = width / 2;
  const gradientId = `${uid}-strap-${type}-${from < CY ? "t" : "b"}`;
  const isTop = from < CY;

  // Taper: a strap is narrower where it meets the lugs and widest at the clasp.
  const innerHalf = half * 0.94;
  const outerHalf = half * 1.06;
  const innerY = isTop ? to : from;
  const outerY = isTop ? from : to;

  const band = `M ${top.x - innerHalf} ${innerY}
    L ${top.x - outerHalf} ${outerY}
    L ${top.x + outerHalf} ${outerY}
    L ${top.x + innerHalf} ${innerY} Z`;

  // Link dividers are accumulated into two paths, one for the horizontal
  // separators, one for the bracelet's centre links, instead of two <line>
  // elements per row. At eight rows a band that was 16 elements is now 2.
  let dividers = "";
  let centres = "";
  const pitch = type === "bracelet" ? 11 : 9;
  const span = Math.abs(outerY - innerY);
  const count = Math.max(2, Math.floor(span / pitch));
  // Centre links are wider than the outer pair, which is what makes a bracelet
  // read as a bracelet rather than a ladder.
  const linkInset = type === "bracelet" ? width * 0.13 : 0;

  for (let i = 1; i < count; i += 1) {
    const t = i / count;
    const y = px(innerY + (outerY - innerY) * t);
    const halfAtY = innerHalf + (outerHalf - innerHalf) * t;
    dividers += `M${px(top.x - halfAtY + linkInset)} ${y}H${px(top.x + halfAtY - linkInset)}`;
    if (type === "bracelet") {
      centres += `M${px(top.x)} ${px(y - pitch * 0.5)}V${px(y + pitch * 0.5)}`;
    }
  }

  const stitchLines: ReactNode[] = [];
  if (appearance.stitch) {
    const offset = half * 0.66;
    const dash = 3.4;
    stitchLines.push(
      <line
        key={`${gradientId}-stitch-l`}
        x1={top.x - offset}
        y1={Math.min(innerY, outerY) + 3}
        x2={top.x - offset}
        y2={Math.max(innerY, outerY) - 3}
        stroke={appearance.stitchColor}
        strokeWidth={0.9}
        strokeDasharray={`${dash} ${dash * 1.3}`}
        strokeLinecap="round"
        opacity={0.9}
      />,
      <line
        key={`${gradientId}-stitch-r`}
        x1={top.x + offset}
        y1={Math.min(innerY, outerY) + 3}
        x2={top.x + offset}
        y2={Math.max(innerY, outerY) - 3}
        stroke={appearance.stitchColor}
        strokeWidth={0.9}
        strokeDasharray={`${dash} ${dash * 1.3}`}
        strokeLinecap="round"
        opacity={0.9}
      />,
    );
  }

  const holes: ReactNode[] = [];
  if (appearance.perforations) {
    const offset = half * 0.34;
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 6.5;
      const y = innerY + (outerY - innerY) * t;
      for (const side of [-1, 1]) {
        holes.push(
          <circle
            key={`${gradientId}-hole-${i}-${side}`}
            cx={top.x + side * offset}
            cy={y}
            r={1.5}
            fill={darken(appearance.base, 0.55)}
          />,
        );
      }
    }
  }

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1={isTop ? "0" : "1"} x2="0" y2={isTop ? "1" : "0"}>
          <stop offset="0%" stopColor={appearance.dark} />
          <stop offset="26%" stopColor={appearance.light} />
          <stop offset="62%" stopColor={appearance.base} />
          <stop offset="100%" stopColor={appearance.dark} />
        </linearGradient>
      </defs>
      <path d={band} fill={`url(#${gradientId})`} />
      {appearance.construction === "mesh" && (
        <path
          d={Array.from({ length: 22 }, (_, i) => {
            const t = (i + 1) / 23;
            const y = px(innerY + (outerY - innerY) * t);
            return `M${px(top.x - half)} ${y}H${px(top.x + half)}`;
          }).join("")}
          stroke={appearance.light}
          strokeWidth={0.4}
          opacity={0.5}
        />
      )}
      <path
        d={dividers}
        stroke={appearance.dark}
        strokeWidth={type === "bracelet" ? 1.1 : 0.6}
        strokeLinecap="round"
      />
      {centres !== "" && (
        <path d={centres} stroke={appearance.dark} strokeWidth={0.7} opacity={0.7} />
      )}
      {holes}
      {stitchLines}
    </g>
  );
}

/* ── Lugs ───────────────────────────────────────────────────────────────
 * Two prongs at each end, splayed 9° off the vertical. That splay is the whole
 * reason the 44 mm Vantage measures 49.4 mm lug-to-lug instead of the 52 mm its
 * diameter implies, and because the prongs are off-axis, the tip radius has to
 * be derived from the *vertical* extent, not from the lug-to-lug figure directly.
 * `LUG_SPREAD` is the cosine that reconciles the two. */

const LUG_SPREAD = 9;

export function Lugs({
  radius,
  widthPx,
  lugToLugMm,
  metal,
  uid = "l",
}: {
  radius: number;
  widthPx: number;
  lugToLugMm: number;
  metal: MetalAppearance;
  uid?: string;
}) {
  const half = widthPx / 2;
  // Solve for the tip radius that produces the stated lug-to-lug once the
  // prongs are projected back onto the vertical axis.
  const tip = (lugToLugMm * MM) / (2 * Math.cos((LUG_SPREAD * Math.PI) / 180));
  const inner = half * 0.26;
  const outer = half * 0.97;

  const prong = (deg: number) => {
    const radians = ((deg - 90) * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);
    // Perpendicular to the prong axis, used to taper it. Named `taperX/taperY`
    // rather than `px/py` because `px` is the coordinate-rounding helper above
    // and shadowing it here would make the two unrelated things read alike.
    const taperX = -dy;
    const taperY = dx;

    const at = (radiusAlong: number, offset: number) => ({
      x: CX + dx * radiusAlong + taperX * offset,
      y: CY + dy * radiusAlong + taperY * offset,
    });

    const baseA = at(radius * 0.99, -inner);
    const baseB = at(radius * 0.99, outer);
    const tipA = at(tip, -inner * 0.8);
    const tipB = at(tip, outer * 0.86);
    const shoulder = at(tip * 0.995, -inner * 0.2);

    return [
      `M ${baseA.x.toFixed(2)} ${baseA.y.toFixed(2)}`,
      `L ${tipA.x.toFixed(2)} ${tipA.y.toFixed(2)}`,
      `Q ${shoulder.x.toFixed(2)} ${shoulder.y.toFixed(2)} ${tipB.x.toFixed(2)} ${tipB.y.toFixed(2)}`,
      `L ${baseB.x.toFixed(2)} ${baseB.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  };

  const angles = [LUG_SPREAD, -LUG_SPREAD, 180 - LUG_SPREAD, 180 + LUG_SPREAD];
  const lugGradientId = `${uid}-lug-metal`;

  return (
    <g>
      <defs>
        <linearGradient id={lugGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={metal.light} />
          <stop offset="48%" stopColor={metal.mid} />
          <stop offset="100%" stopColor={metal.dark} />
        </linearGradient>
      </defs>
      {angles.map((deg) => (
        <path key={deg} d={prong(deg)} fill={`url(#${lugGradientId})`} />
      ))}
    </g>
  );
}

/* ── Minute track ───────────────────────────────────────────────────────
 * Drawn as two dashed circles rather than 60 <line> elements. `pathLength` is
 * normalised to the tick count, so the dash maths is a ratio of the circumference
 * and not a function of the dial radius, the same markup is correct for the
 * 36 mm and the 44 mm. Minor ticks are a 60-dash circle; the twelve five-minute
 * markers are a 12-dash circle drawn at a slightly smaller radius and heavier
 * stroke, which is how they read on a real dial: longer and bolder.
 */

export function MinuteTrack({
  dialRadius,
  appearance,
  rail = false,
}: {
  dialRadius: number;
  appearance: DialAppearance;
  rail?: boolean;
}) {
  const outer = dialRadius * 0.955;
  const fiveRadius = outer - dialRadius * 0.012;

  return (
    <g>
      {rail && (
        <>
          {/* Railroad track: the minute ring inside its own hairline, which is
              the whole point of the Sector dial. */}
          <circle
            cx={CX}
            cy={CY}
            r={px(outer + dialRadius * 0.045)}
            fill="none"
            stroke={appearance.printing}
            strokeWidth={0.7}
          />
          <circle
            cx={CX}
            cy={CY}
            r={px(outer - dialRadius * 0.105)}
            fill="none"
            stroke={appearance.printing}
            strokeWidth={0.7}
          />
        </>
      )}

      <circle
        cx={CX}
        cy={CY}
        r={px(outer)}
        fill="none"
        stroke={appearance.printing}
        strokeWidth={0.6}
        strokeDasharray="0.34 0.66"
        pathLength={60}
        opacity={0.72}
      />
      <circle
        cx={CX}
        cy={CY}
        r={px(fiveRadius)}
        fill="none"
        stroke={appearance.printing}
        strokeWidth={1.3}
        strokeDasharray="0.42 0.58"
        pathLength={12}
        opacity={0.95}
      />
    </g>
  );
}

/* ── Indices ──────────────────────────────────────────────────────────────
 * `simplified` collapses the twelve applied markers into a single <path> of
 * dots. It is what a catalogue card uses: at 96 px the difference between a
 * polished baton and a printed dot is invisible, and the saving is 24 elements.
 */

const ROMAN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export function Indices({
  dialRadius,
  style,
  appearance,
  metal,
  lume,
  night,
  sectorRail,
  simplified = false,
}: {
  dialRadius: number;
  style: IndexStyle;
  appearance: DialAppearance;
  metal: MetalAppearance;
  lume: boolean;
  night: boolean;
  sectorRail: boolean;
  simplified?: boolean;
}) {
  // The rail eats the outer 10% of the dial, so the indices step in when it is
  // present, otherwise the XII would land on top of the track.
  const reach = dialRadius * (sectorRail ? 0.78 : 0.87);
  const furniture = night && lume ? LUME_GLOW : metal.furniture;
  const lumeFill = night && lume ? LUME_GLOW : LUME_FILL;
  const isDarkDial = appearance.isDark;

  if (simplified && style !== "roman" && style !== "arabic") {
    // Twelve dots, one path. `M x y a r r 0 1 0 .01 0` is the compact way to
    // stamp a filled circle without twelve separate <circle> elements.
    const r = dialRadius * 0.05;
    const d = Array.from({ length: 12 }, (_, i) => {
      const p = polar(reach, i * 30);
      return `M${px(p.x - r)} ${px(p.y)}a${px(r)} ${px(r)} 0 1 0 ${px(r * 2)} 0a${px(r)} ${px(
        r,
      )} 0 1 0 ${px(-r * 2)} 0`;
    }).join("");
    return <path d={d} fill={furniture} />;
  }

  const baton = (deg: number) => {
    const w = dialRadius * 0.062;
    const len = dialRadius * 0.19;
    return (
      <g key={`baton-${deg}`} transform={`rotate(${deg} ${CX} ${CY})`}>
        <rect
          x={CX - w / 2}
          y={CY - reach}
          width={w}
          height={len}
          rx={w * 0.3}
          fill={furniture}
        />
        <rect
          x={CX - w / 2 + w * 0.22}
          y={CY - reach + len * 0.16}
          width={w * 0.56}
          height={len * 0.6}
          rx={w * 0.16}
          fill={lume ? lumeFill : appearance.isDark ? darken(furniture, 0.4) : furniture}
          opacity={lume ? 0.95 : 0}
        />
      </g>
    );
  };

  const dauphine = (deg: number) => {
    const outer = reach;
    const inner = reach - dialRadius * 0.2;
    const half = dialRadius * 0.072;
    return (
      <g key={`dauphine-${deg}`} transform={`rotate(${deg} ${CX} ${CY})`}>
        <polygon
          points={`${CX},${CY - outer} ${CX - half},${CY - inner} ${CX + half},${CY - inner}`}
          fill={furniture}
        />
        {/* The fold line. A dauphine index is two facets, and without this it
            reads as a plain triangle. */}
        <line
          x1={CX}
          y1={CY - outer}
          x2={CX}
          y2={CY - inner}
          stroke={isDarkDial ? "#00000055" : "#FFFFFF88"}
          strokeWidth={0.7}
        />
        <polygon
          points={`${CX - half * 0.42},${CY - outer + dialRadius * 0.035} ${CX - half * 0.5},${CY - inner} ${CX},${CY - inner}`}
          fill={lume ? lumeFill : "none"}
          opacity={lume ? 0.9 : 0}
        />
      </g>
    );
  };

  const numeral = (deg: number, label: string) => {
    const { x, y } = polar(reach - dialRadius * 0.06, deg);
    const size = dialRadius * (label.length > 2 ? 0.235 : 0.275);
    return (
      <text
        key={`numeral-${deg}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size}
        fontFamily="var(--font-display)"
        fill={appearance.ink}
        letterSpacing="-0.02em"
      >
        {label}
      </text>
    );
  };

  const arrow = (deg: number) => (
    <g key={`arrow-${deg}`} transform={`rotate(${deg} ${CX} ${CY})`}>
      <polygon
        points={`${CX},${CY - reach} ${CX - dialRadius * 0.052},${CY - reach + dialRadius * 0.11} ${CX + dialRadius * 0.052},${CY - reach + dialRadius * 0.11}`}
        fill={furniture}
      />
    </g>
  );

  switch (style) {
    case "roman":
      return <g>{ROMAN.map((label, i) => numeral(i * 30, label))}</g>;
    case "arabic":
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => numeral(i * 30, String(i === 0 ? 12 : i)))}
        </g>
      );
    case "dauphine":
      return <g>{Array.from({ length: 12 }, (_, i) => dauphine(i * 30))}</g>;
    case "minimal":
      return <g>{[0, 90, 180, 270].map((deg) => baton(deg))}</g>;
    case "mixed":
      return (
        <g>
          {[0, 90, 180, 270].map((deg) => numeral(deg, String(deg === 0 ? 12 : deg / 30)))}
          {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => baton(deg))}
        </g>
      );
    case "baton":
    default:
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => baton(i * 30))}
          {arrow(0)}
        </g>
      );
  }
}

/* ── Complication furniture ───────────────────────────────────────────── */

export function Subdial({
  deg,
  dialRadius,
  appearance,
  ticks = 12,
  numerals = false,
}: {
  deg: number;
  dialRadius: number;
  appearance: DialAppearance;
  ticks?: number;
  numerals?: boolean;
}) {
  const r = dialRadius * 0.24;
  const centre = polar(r, deg);
  const marks: ReactNode[] = [];
  const quarterEvery = Math.max(1, Math.round(ticks / 4));

  for (let i = 0; i < ticks; i += 1) {
    const isQuarter = i % quarterEvery === 0;
    // Tick angles are absolute on the dial, so the subdial is indexed from its
    // own position and reads upright, the way a real subsidiary dial is cut.
    const angle = deg + i * (360 / ticks);
    const a = polarRing(centre, r * (isQuarter ? 0.68 : 0.78), angle);
    const b = polarRing(centre, r * 0.9, angle);
    marks.push(
      <line
        key={`sd-${deg}-${i}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={appearance.printing}
        strokeWidth={isQuarter ? 0.9 : 0.5}
      />,
    );
  }

  return (
    <g>
      <circle cx={centre.x} cy={centre.y} r={r} fill="none" stroke={appearance.printing} strokeWidth={0.6} />
      {marks}
      {numerals &&
        [0, 1, 2, 3].map((i) => {
          const p = polarRing(centre, r * 0.5, i * 90);
          return (
            <text
              key={`sd-num-${deg}-${i}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={r * 0.36}
              fontFamily="var(--font-measure)"
              fill={appearance.printing}
            >
              {i * 15}
            </text>
          );
        })}
    </g>
  );
}

export function DateWindow({
  deg,
  dialRadius,
  appearance,
  metal,
  value = "28",
}: {
  deg: number;
  dialRadius: number;
  appearance: DialAppearance;
  metal: MetalAppearance;
  value?: string;
}) {
  const { x, y } = polar(dialRadius * 0.66, deg);
  const w = dialRadius * 0.19;
  const h = dialRadius * 0.15;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={1.5}
        fill={appearance.isDark ? "#F2EFE7" : "#FBF9F4"}
        stroke={metal.mid}
        strokeWidth={0.8}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={h * 0.72}
        fontFamily="var(--font-measure)"
        fill="#1A1A18"
      >
        {value}
      </text>
    </g>
  );
}

export function MoonphaseAperture({
  deg,
  dialRadius,
  appearance,
  uid = "m",
}: {
  deg: number;
  dialRadius: number;
  appearance: DialAppearance;
  uid?: string;
}) {
  const { x, y } = polar(dialRadius * 0.56, deg);
  const r = dialRadius * 0.27;
  const clipId = `${uid}-moon-clip-${deg}`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`} />
        </clipPath>
      </defs>
      <path
        d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`}
        fill="#0E1526"
        stroke={appearance.printing}
        strokeWidth={0.8}
      />
      <g clipPath={`url(#${clipId})`}>
        {/* Waxing gibbous. The disc is lit from the left, which is why the
            terminator is an ellipse rather than a circle. */}
        <circle cx={x - r * 0.18} cy={y - r * 0.06} r={r * 0.52} fill="#E8E4D6" />
        <ellipse cx={x + r * 0.24} cy={y - r * 0.06} rx={r * 0.4} ry={r * 0.52} fill="#0E1526" />
        {[
          [x - r * 0.5, y - r * 0.42, 0.8],
          [x + r * 0.34, y - r * 0.5, 0.6],
          [x - r * 0.1, y - r * 0.62, 0.55],
        ].map(([sx, sy, s], i) => (
          <circle key={`star-${i}`} cx={sx} cy={sy} r={s} fill="#F2EFE7" opacity={0.9} />
        ))}
      </g>
      <path
        d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`}
        fill="none"
        stroke={appearance.printing}
        strokeWidth={0.7}
      />
    </g>
  );
}

/** The 24-hour ring. Numerals start at 13 so the 12 o'clock position is 24. */
export function GmtRing({ dialRadius, appearance }: { dialRadius: number; appearance: DialAppearance }) {
  const r = dialRadius * 0.9;
  const ring = polar(r, 0);
  const labels: React.ReactNode[] = [];
  for (let hour = 13; hour <= 24; hour += 1) {
    const { x, y } = polar(dialRadius * 0.8, (hour % 24) * 15);
    labels.push(
      <text
        key={`gmt-${hour}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={dialRadius * 0.1}
        fontFamily="var(--font-measure)"
        fill={appearance.printing}
      >
        {String(hour).padStart(2, "0")}
      </text>,
    );
  }
  return (
    <g>
      <circle cx={ring.x} cy={ring.y} r={dialRadius * 0.855} fill="none" stroke={appearance.printing} strokeWidth={0.5} opacity={0.6} />
      {labels}
    </g>
  );
}

/** A 0–72 hour sector. The last third is warmer so the reading survives
 *  peripheral vision, which is the point of putting it on a dial at all. */
export function PowerReserveSector({
  dialRadius,
  appearance,
  hours,
}: {
  dialRadius: number;
  appearance: DialAppearance;
  hours: number;
}) {
  const r = dialRadius * 0.8;
  const start = -55;
  const sweep = 110;
  const empty = polar(r, start);
  const mid = polar(r, start + sweep);

  return (
    <g>
      <path
        d={`M ${empty.x} ${empty.y} A ${r} ${r} 0 0 1 ${mid.x} ${mid.y}`}
        fill="none"
        stroke={appearance.printing}
        strokeWidth={dialRadius * 0.055}
        strokeLinecap="round"
      />
      <path
        d={`M ${polar(r, start + (sweep * 2) / 3).x} ${polar(r, start + (sweep * 2) / 3).y} A ${r} ${r} 0 0 1 ${mid.x} ${mid.y}`}
        fill="none"
        stroke="#B8763A"
        strokeWidth={dialRadius * 0.055}
        strokeLinecap="round"
        opacity={0.85}
      />
      <text
        x={CX}
        y={CY - dialRadius * 0.52}
        textAnchor="middle"
        fontSize={dialRadius * 0.115}
        fontFamily="var(--font-measure)"
        fill={appearance.printing}
        letterSpacing="0.08em"
      >
        {hours} H
      </text>
    </g>
  );
}

/* ── Hands ────────────────────────────────────────────────────────────── */

export function Hands({
  dialRadius,
  appearance,
  metal,
  lume,
  night,
  hasGmt,
  hasSmallSeconds,
  hasPowerReserve,
}: {
  dialRadius: number;
  appearance: DialAppearance;
  metal: MetalAppearance;
  lume: boolean;
  night: boolean;
  hasGmt: boolean;
  hasSmallSeconds: boolean;
  hasPowerReserve: boolean;
}) {
  const furniture = night && lume ? LUME_GLOW : metal.furniture;
  const lumeFill = night && lume ? LUME_GLOW : LUME_FILL;

  // Complications take the lower dial, so the hour and minute hands are pulled
  // in to stop them crossing a subdial they have no business crossing.
  const inset = hasSmallSeconds || hasPowerReserve || hasGmt ? 0.86 : 1;
  const hourLength = dialRadius * 0.5 * inset;
  const minuteLength = dialRadius * 0.76 * inset;

  const batonHand = (degrees: number, length: number, width: number) => (
    <g key={`hand-${degrees}`} transform={`rotate(${degrees} ${CX} ${CY})`}>
      <path
        d={`M ${CX - width / 2} ${CY + length * 0.16}
            L ${CX - width * 0.34} ${CY - length}
            L ${CX + width * 0.34} ${CY - length}
            L ${CX + width / 2} ${CY + length * 0.16} Z`}
        fill={furniture}
      />
      {lume && (
        <path
          d={`M ${CX - width * 0.24} ${CY + length * 0.1}
              L ${CX - width * 0.16} ${CY - length * 0.86}
              L ${CX + width * 0.16} ${CY - length * 0.86}
              L ${CX + width * 0.24} ${CY + length * 0.1} Z`}
          fill={lumeFill}
          opacity={0.92}
        />
      )}
    </g>
  );

  const secondsHand = (degrees: number, length: number, fromCenter: boolean) => (
    <g key={`sec-${degrees}`} transform={`rotate(${degrees} ${CX} ${CY})`}>
      <line
        x1={CX}
        y1={fromCenter ? CY + length * 0.28 : CY + length * 0.22}
        x2={CX}
        y2={CY - length}
        stroke={appearance.isDark ? "#E8E4DA" : "#26262A"}
        strokeWidth={dialRadius * 0.028}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY - length * 0.82} r={dialRadius * 0.045} fill={lume ? lumeFill : "none"} stroke={lume ? "none" : appearance.isDark ? "#E8E4DA" : "#26262A"} strokeWidth={0.9} />
      <circle cx={CX} cy={fromCenter ? CY + length * 0.2 : CY} r={dialRadius * 0.05} fill={appearance.isDark ? "#E8E4DA" : "#26262A"} />
    </g>
  );

  const gmtHand = (degrees: number) => (
    <g key={`gmt-hand-${degrees}`} transform={`rotate(${degrees} ${CX} ${CY})`}>
      <line
        x1={CX}
        y1={CY + dialRadius * 0.1}
        x2={CX}
        y2={CY - dialRadius * 0.7}
        stroke={appearance.isDark ? "#D9A441" : "#A9741F"}
        strokeWidth={dialRadius * 0.032}
        strokeLinecap="round"
      />
      <polygon
        points={`${CX},${CY - dialRadius * 0.88} ${CX - dialRadius * 0.075},${CY - dialRadius * 0.7} ${CX + dialRadius * 0.075},${CY - dialRadius * 0.7}`}
        fill={appearance.isDark ? "#D9A441" : "#A9741F"}
      />
    </g>
  );

  return (
    <g>
      {hasGmt && gmtHand(DISPLAY_TIME.hour + (24 - 10) * 15)}
      {batonHand(DISPLAY_TIME.hour, hourLength, dialRadius * 0.062)}
      {batonHand(DISPLAY_TIME.minute, minuteLength, dialRadius * 0.05)}
      {secondsHand(DISPLAY_TIME.second, dialRadius * 0.82, !hasSmallSeconds)}
      {hasGmt && gmtHand(DISPLAY_TIME.minute)}
      {/* Cap over the stack, so no hand edge shows through the one above it. */}
      <circle cx={CX} cy={CY} r={dialRadius * 0.052} fill={furniture} />
      <circle cx={CX} cy={CY} r={dialRadius * 0.02} fill={appearance.isDark ? "#141414" : "#2A2A28"} />
    </g>
  );
}

/* ── Crown and pushers ───────────────────────────────────────────────── */

export function Crown({
  radius,
  metal,
  pushers = 0,
}: {
  radius: number;
  metal: MetalAppearance;
  /** 0 = time-only crown, 2 = chronograph, 1 = mono-push. */
  pushers?: number;
}) {
  const crownX = CX + radius * 0.985;
  const crownW = radius * 0.18;
  const crownH = radius * 0.27;

  // Pushers sit above and below the crown, each tilted along the case flank so
  // they read as machined from the same block rather than stuck on the side.
  const pusherOffsets = pushers === 2 ? [-1, 1] : pushers === 1 ? [1] : [];

  return (
    <g>
      {pusherOffsets.map((sign) => {
        const y = CY + sign * radius * 0.34;
        const length = radius * 0.19;
        const rise = radius * 0.06;
        return (
          <g key={`pusher-${sign}`}>
            <path
              d={`M ${crownX - 1} ${y - rise * 0.5}
                  L ${crownX + length} ${y - rise}
                  L ${crownX + length} ${y + rise}
                  L ${crownX - 1} ${y + rise * 0.5} Z`}
              fill={metal.mid}
            />
            <line
              x1={crownX + length * 0.55}
              y1={y - rise * 0.86}
              x2={crownX + length * 0.55}
              y2={y + rise * 0.86}
              stroke={metal.dark}
              strokeWidth={0.7}
            />
          </g>
        );
      })}

      <rect
        x={crownX}
        y={CY - crownH / 2}
        width={crownW}
        height={crownH}
        rx={crownW * 0.28}
        fill={metal.mid}
      />
      {/* Knurling: five short cuts, enough to read as a grip at card size. */}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`crown-cut-${i}`}
          x1={crownX + crownW * (0.22 + i * 0.15)}
          y1={CY - crownH / 2 + crownH * 0.16}
          x2={crownX + crownW * (0.22 + i * 0.15)}
          y2={CY + crownH / 2 - crownH * 0.16}
          stroke={metal.dark}
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}
