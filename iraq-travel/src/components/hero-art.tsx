/**
 * Illustrated hero panorama (an artwork, not a photograph): from left to right the
 * Ziggurat of Ur, the gate of Babylon, the reed marshes with a mashoof boat, and Erbil Citadel,
 * beneath a desert sky with the two rivers flowing in the foreground.
 */
export function HeroArt() {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081a2f" />
          <stop offset="0.55" stopColor="#163a63" />
          <stop offset="0.85" stopColor="#b8892b" />
          <stop offset="1" stopColor="#e5c57e" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6aa8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0f2a4a" />
        </linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a12" />
          <stop offset="1" stopColor="#1f160a" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2cc" />
          <stop offset="1" stopColor="#e5c57e" stopOpacity="0" />
        </radialGradient>
        <pattern id="brick" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 0H24M0 6H24M12 0V6M0 6V12M24 6V12" stroke="rgba(0,0,0,0.18)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width="1600" height="700" fill="url(#sky)" />
      {/* stars */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 260} r={i % 3 === 0 ? 1.6 : 1} fill="#fff" opacity={0.35 + ((i * 7) % 5) / 10} />
      ))}
      <circle cx="1180" cy="420" r="160" fill="url(#sun)" opacity="0.8" />

      {/* Ziggurat of Ur */}
      <g fill="#2a1d0c">
        <rect x="90" y="470" width="420" height="80" />
        <rect x="150" y="410" width="300" height="60" />
        <rect x="215" y="365" width="170" height="45" />
        <rect x="260" y="335" width="80" height="30" />
        <polygon points="285,550 315,550 315,335 285,335" fill="#3d2a10" />
      </g>
      <g fill="url(#brick)"><rect x="90" y="470" width="420" height="80" /><rect x="150" y="410" width="300" height="60" /></g>

      {/* Babylon gate with towers */}
      <g>
        <rect x="560" y="400" width="230" height="150" fill="#1d4a7c" />
        <rect x="540" y="370" width="50" height="180" fill="#163a63" />
        <rect x="760" y="370" width="50" height="180" fill="#163a63" />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={540 + i * 54} y="356" width="22" height="16" fill="#163a63" />)}
        <path d="M640 550 V470 Q675 430 710 470 V550 Z" fill="#081a2f" />
        <g fill="#d9b25f" opacity="0.9">
          <rect x="600" y="430" width="22" height="10" rx="3" /><rect x="728" y="430" width="22" height="10" rx="3" />
          <rect x="600" y="500" width="22" height="10" rx="3" /><rect x="728" y="500" width="22" height="10" rx="3" />
        </g>
      </g>

      {/* Marsh reeds & mudhif & mashoof */}
      <g stroke="#1f160a" strokeWidth="3">
        {Array.from({ length: 34 }).map((_, i) => (
          <line key={i} x1={850 + i * 9} y1="560" x2={846 + i * 9 + (i % 3) * 4} y2={470 - (i % 5) * 14} />
        ))}
      </g>
      <path d="M930 540 Q990 440 1050 540 Z" fill="#2a1d0c" />
      <path d="M950 540 V505 M970 540 V480 M990 540 V470 M1010 540 V480 M1030 540 V505" stroke="#5a4220" strokeWidth="3" />

      {/* Erbil Citadel on its mound */}
      <path d="M1180 560 Q1230 440 1300 440 H1460 Q1530 440 1580 560 Z" fill="#2a1d0c" />
      <g fill="#3d2a10">
        <rect x="1240" y="390" width="270" height="55" />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={1240 + i * 31} y="376" width="16" height="16" />)}
        <rect x="1355" y="400" width="40" height="45" fill="#1f160a" />
      </g>

      {/* Land and the two rivers */}
      <path d="M0 540 H1600 V700 H0 Z" fill="url(#land)" />
      <path d="M0 600 C300 570 520 640 800 610 S1300 580 1600 620 V650 C1300 615 1100 650 800 645 S300 610 0 640 Z" fill="url(#river)" opacity="0.95" />
      <path d="M0 660 C350 640 600 690 900 668 S1350 650 1600 675 V700 H0 Z" fill="url(#river)" opacity="0.75" />
      <path d="M1080 612 q30 10 70 0 l-10 8 q-25 6 -50 0 z" fill="#1f160a" />
      <line x1="1110" y1="611" x2="1130" y2="575" stroke="#1f160a" strokeWidth="2" />
    </svg>
  );
}
