"use client";

/**
 * LegalSeal — decorative emblem for contract drafts.
 *
 * Generic "scales of justice" seal in a circular ring with laurel branches.
 * Deliberately NOT the State Emblem of India (Ashoka Lions) — that emblem is
 * restricted to Government use under the State Emblem of India (Prohibition
 * of Improper Use) Act, 2005. This is a stylized commercial seal.
 */

interface LegalSealProps {
  size?: number;
  className?: string;
  /** Inner motto, e.g. "DRAFT" or "JurisGPT" */
  innerText?: string;
}

export function LegalSeal({
  size = 80,
  className,
  innerText = "JurisGPT",
}: LegalSealProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="Legal document seal"
    >
      <defs>
        <path
          id="seal-curve"
          d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          fill="none"
        />
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="0.4" />

      {/* Decorative dots around ring */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const x = 50 + 46 * Math.cos(angle);
        const y = 50 + 46 * Math.sin(angle);
        return (
          <circle key={i} cx={x} cy={y} r="0.4" fill="currentColor" opacity={0.6} />
        );
      })}

      {/* Top text on curve */}
      <text
        fontSize="6"
        fill="currentColor"
        letterSpacing="2"
        fontFamily="serif"
        fontWeight="600"
      >
        <textPath href="#seal-curve" startOffset="14%">
          INDIAN LEGAL DOCUMENT
        </textPath>
      </text>

      {/* Bottom text */}
      <text
        fontSize="5"
        fill="currentColor"
        letterSpacing="1.5"
        fontFamily="serif"
        opacity="0.7"
      >
        <textPath href="#seal-curve" startOffset="62%">
          ★ DRAFT ★ JURISGPT ★
        </textPath>
      </text>

      {/* Scales of justice — central icon */}
      <g transform="translate(50, 50)">
        {/* Vertical pillar */}
        <line x1="0" y1="-18" x2="0" y2="14" stroke="currentColor" strokeWidth="1.4" />
        {/* Top knob */}
        <circle cx="0" cy="-18" r="1.6" fill="currentColor" />
        {/* Crossbar */}
        <line x1="-14" y1="-12" x2="14" y2="-12" stroke="currentColor" strokeWidth="1.2" />

        {/* Left scale */}
        <line x1="-12" y1="-12" x2="-12" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <line x1="-12" y1="-12" x2="-7" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <line x1="-12" y1="-12" x2="-17" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <path
          d="M -18,-6 Q -12,-2 -6,-6"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="0.8"
        />

        {/* Right scale */}
        <line x1="12" y1="-12" x2="12" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <line x1="12" y1="-12" x2="7" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <line x1="12" y1="-12" x2="17" y2="-6" stroke="currentColor" strokeWidth="0.6" />
        <path
          d="M 6,-6 Q 12,-2 18,-6"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="0.8"
        />

        {/* Base */}
        <rect x="-6" y="14" width="12" height="2" fill="currentColor" />
        <rect x="-9" y="16" width="18" height="1.2" fill="currentColor" />

        {/* Laurel — left branch */}
        <g opacity="0.55">
          <path
            d="M -22,8 Q -28,2 -26,-6 Q -24,-12 -20,-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          {[-13, -9, -5, -1, 3].map((y, i) => (
            <ellipse
              key={i}
              cx={-23 - (i % 2) * 1.5}
              cy={y}
              rx="1.6"
              ry="0.8"
              transform={`rotate(${-30 - i * 5} ${-23} ${y})`}
              fill="currentColor"
            />
          ))}
        </g>

        {/* Laurel — right branch */}
        <g opacity="0.55">
          <path
            d="M 22,8 Q 28,2 26,-6 Q 24,-12 20,-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          {[-13, -9, -5, -1, 3].map((y, i) => (
            <ellipse
              key={i}
              cx={23 + (i % 2) * 1.5}
              cy={y}
              rx="1.6"
              ry="0.8"
              transform={`rotate(${30 + i * 5} ${23} ${y})`}
              fill="currentColor"
            />
          ))}
        </g>
      </g>

      {/* Inner motto plate */}
      <text
        x="50"
        y="84"
        textAnchor="middle"
        fontSize="4.5"
        fill="currentColor"
        fontFamily="serif"
        fontWeight="700"
        letterSpacing="0.5"
      >
        {innerText}
      </text>
    </svg>
  );
}

/**
 * Decorative diamond divider for sections.
 */
export function DiamondDivider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-6 ${className ?? ""}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-foreground/30 to-foreground/40" />
      <svg width="14" height="14" viewBox="0 0 14 14" className="text-foreground/40">
        <path d="M 7,0 L 14,7 L 7,14 L 0,7 Z" fill="currentColor" />
      </svg>
      <svg width="10" height="10" viewBox="0 0 10 10" className="text-foreground/30">
        <path d="M 5,0 L 10,5 L 5,10 L 0,5 Z" fill="currentColor" />
      </svg>
      <svg width="14" height="14" viewBox="0 0 14 14" className="text-foreground/40">
        <path d="M 7,0 L 14,7 L 7,14 L 0,7 Z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-foreground/30 to-foreground/40" />
    </div>
  );
}

/**
 * Indian rupee-stamp paper top-banner.
 */
export function StampPaperBanner() {
  return (
    <div className="relative -mx-8 -mt-8 mb-6 px-8 py-4 border-b-2 border-foreground/15 bg-gradient-to-b from-amber-50/40 to-transparent dark:from-amber-950/10">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-semibold leading-relaxed">
          <p>Government of India</p>
          <p className="text-foreground/70">Non-Judicial Stamp</p>
          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 border border-foreground/30 rounded-sm">
            <span className="font-bold tracking-wide">₹ 100</span>
          </div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-semibold leading-relaxed">
          <p>Indian Stamp Act, 1899</p>
          <p>State Schedule Applicable</p>
          <p className="mt-1 text-foreground/40 italic normal-case tracking-normal text-[9px]">
            (To be affixed before execution)
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Decorative wax-seal placeholder for signature blocks.
 */
export function SignatureSeal({ label = "SEAL" }: { label?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-dashed border-foreground/25 bg-foreground/5">
      <span className="text-[8px] uppercase tracking-widest text-foreground/40 font-bold">
        {label}
      </span>
    </div>
  );
}
