import React, { useId } from 'react';
import { useMotionEnabled } from './MotionPrimitives.tsx';

export interface DesignDropMarkProps {
  className?: string;
  variant?: 'default' | 'invoice' | 'mono';
  interactive?: boolean;
}

/**
 * Architectural "Ink-Drop Crest + Open Double-D" brand emblem for DesignDrop.
 * Uses unique SVG gradient IDs per instance so multiple emblems on the same page
 * (navbar, footer, invoice modal) never collide.
 */
export const DesignDropMark: React.FC<DesignDropMarkProps> = ({
  className = 'h-8 w-8',
  variant = 'default',
  interactive = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const motionEnabled = useMotionEnabled();

  const tileGradId = `dd-tile-${uid}`;
  const rimGradId = `dd-rim-${uid}`;
  const dropGradId = `dd-drop-${uid}`;
  const glowGradId = `dd-glow-${uid}`;

  const isMono = variant === 'mono';
  const isInvoice = variant === 'invoice';
  const canAnimate = interactive && motionEnabled;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${className} shrink-0 ${
        canAnimate
          ? 'transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-[1.06]'
          : ''
      }`}
    >
      <defs>
        {/* Obsidian inkwell tile surface */}
        <linearGradient id={tileGradId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isMono ? '#18181F' : '#1E1A2E'} />
          <stop offset="55%" stopColor="#12121A" />
          <stop offset="100%" stopColor="#09090D" />
        </linearGradient>

        {/* Studio rim specular stroke */}
        <linearGradient id={rimGradId} x1="44" y1="4" x2="6" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isMono ? '#FFFFFF' : '#FF5A5F'} stopOpacity={isMono ? '0.45' : '0.85'} />
          <stop offset="48%" stopColor={isMono ? '#A1A1AA' : '#8B5CF6'} stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.16" />
        </linearGradient>

        {/* Liquid ink droplet gradient (Electric Violet -> Magenta -> Coral) */}
        <linearGradient id={dropGradId} x1="16" y1="32" x2="36" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isMono ? '#E4E4E7' : '#7C3AED'} />
          <stop offset="55%" stopColor={isMono ? '#FAFAFA' : '#D946EF'} />
          <stop offset="100%" stopColor={isMono ? '#FFFFFF' : '#FF5A5F'} />
        </linearGradient>

        {/* Subtle ambient studio ink glow behind droplet tip */}
        <radialGradient
          id={glowGradId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(35 13) rotate(135) scale(26)"
        >
          <stop offset="0%" stopColor={isMono ? '#FFFFFF' : '#FF5A5F'} stopOpacity={isMono ? '0.12' : '0.28'} />
          <stop offset="55%" stopColor={isMono ? '#FFFFFF' : '#7C3AED'} stopOpacity={isMono ? '0.04' : '0.14'} />
          <stop offset="100%" stopColor="#0E0E14" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Asymmetrical Droplet-Crest Silhouette: 3 sculpted corners + 1 sharp ink-nib apex at top-right */}
      <path
        d="M17 3H40.5C43.2614 3 45 4.73858 45 7.5V31C45 38.732 38.732 45 31 45H17C9.26801 45 3 38.732 3 31V17C3 9.26801 9.26801 3 17 3Z"
        fill={isInvoice ? '#111116' : `url(#${tileGradId})`}
      />

      {/* Ambient studio sheen inside the crest */}
      {!isInvoice && (
        <path
          d="M17 3H40.5C43.2614 3 45 4.73858 45 7.5V31C45 38.732 38.732 45 31 45H17C9.26801 45 3 38.732 3 31V17C3 9.26801 9.26801 3 17 3Z"
          fill={`url(#${glowGradId})`}
        />
      )}

      {/* Precision hairline specular border */}
      <path
        d="M17 3.75H40.5C42.8472 3.75 44.25 5.15279 44.25 7.5V31C44.25 38.3178 38.3178 44.25 31 44.25H17C9.68223 44.25 3.75 38.3178 3.75 31V17C3.75 9.68223 9.68223 3.75 17 3.75Z"
        stroke={`url(#${rimGradId})`}
        strokeWidth="1.25"
      />

      {/* Outer Architectural Open-Shoulder "D" Ribbon (Warm Ivory) */}
      <path
        d="M24 12.25H14.5C13.2574 12.25 12.25 13.2574 12.25 14.5V33.5C12.25 34.7426 13.2574 35.75 14.5 35.75H23.25C30.5 35.75 35.75 30.8 35.75 23.75C35.75 22.7 35.62 21.68 35.38 20.72"
        stroke="#FAF9F6"
        strokeWidth="4.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Suspended Liquid Ink Droplet (completes the Double-D silhouette & aims at crest nib) */}
      <g
        className={
          canAnimate
            ? 'transition-transform duration-300 ease-out group-hover:translate-x-[1.2px] group-hover:-translate-y-[1.2px]'
            : ''
        }
      >
        <g transform="translate(22.6 25.4) rotate(45)">
          <path
            d="M0 -16.6C2.35 -9.5 6.35 -4.6 6.35 0A6.35 6.35 0 1 1 -6.35 0C-6.35 -4.6 -2.35 -9.5 0 -16.6Z"
            fill={`url(#${dropGradId})`}
          />
          {/* Crisp studio specular crescent inside the ink drop */}
          <path
            d="M-2.85 -1.1C-2.85 1.15 -1.45 2.9 0.55 3.15"
            stroke="#FFFFFF"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeOpacity="0.88"
          />
        </g>
      </g>

      {/* Micro print-registration accent dot at top-right nib apex */}
      <circle
        cx="39.5"
        cy="8.5"
        r="1.45"
        fill={isMono ? '#FFFFFF' : '#FF5A5F'}
        fillOpacity="0.92"
      />
    </svg>
  );
};

export interface DesignDropLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'invoice' | 'mono';
  showWordmark?: boolean;
  interactive?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    mark: 'h-7 w-7',
    text: 'text-[17px]',
    gap: 'gap-2',
    dropDot: 'h-2 w-2',
  },
  md: {
    mark: 'h-8 w-8',
    text: 'text-[19px]',
    gap: 'gap-2.5',
    dropDot: 'h-2 w-2',
  },
  lg: {
    mark: 'h-10 w-10',
    text: 'text-2xl',
    gap: 'gap-3',
    dropDot: 'h-2.5 w-2.5',
  },
} as const;

/**
 * Full DesignDrop brand lockup: unique Ink-Drop Crest + custom weight-contrasted wordmark
 * with a sculpted baseline teardrop period. Single-line, whitespace-nowrap, dark/light aware.
 */
export const DesignDropLogo: React.FC<DesignDropLogoProps> = ({
  size = 'md',
  variant = 'default',
  showWordmark = true,
  interactive = true,
  className = '',
}) => {
  const s = SIZE_MAP[size];
  const isInvoice = variant === 'invoice';
  const isMono = variant === 'mono';

  return (
    <span
      className={`inline-flex items-center ${s.gap} whitespace-nowrap shrink-0 select-none ${className}`}
    >
      <DesignDropMark className={s.mark} variant={variant} interactive={interactive} />

      {showWordmark && (
        <span
          className={`inline-flex items-baseline font-display ${s.text} leading-none tracking-[-0.035em]`}
        >
          <span
            className={
              isInvoice
                ? 'font-bold text-[#111116] dark:text-[#F5F5F7] print:text-black'
                : 'font-bold text-[#111116] dark:text-[#F5F5F7]'
            }
          >
            Design
          </span>
          <span
            className={
              isMono
                ? 'font-black tracking-[-0.045em] text-[#111116] dark:text-white'
                : isInvoice
                  ? 'font-black tracking-[-0.045em] text-[#7C3AED] dark:text-[#A78BFA] print:text-black'
                  : 'bg-gradient-to-r from-[#7C3AED] via-[#C026D3] to-[#FF5A5F] bg-clip-text font-black tracking-[-0.045em] text-transparent dark:from-[#A78BFA] dark:via-[#E879F9] dark:to-[#FF7A7F]'
            }
          >
            Drop
          </span>
          {/* Sculpted baseline ink-drop period tying the wordmark to the emblem */}
          <svg
            viewBox="0 0 10 12"
            fill="none"
            aria-hidden="true"
            className={`ml-0.5 inline-block ${s.dropDot} translate-y-[0.5px] shrink-0`}
          >
            <path
              d="M5 0.6C6.4 3.4 8.8 5.2 8.8 7.6A3.8 3.8 0 1 1 1.2 7.6C1.2 5.2 3.6 3.4 5 0.6Z"
              className={
                isMono
                  ? 'fill-current'
                  : isInvoice
                    ? 'fill-[#FF5A5F] print:fill-black'
                    : 'fill-[#FF5A5F] dark:fill-[#FF7A7F]'
              }
            />
          </svg>
        </span>
      )}
    </span>
  );
};
