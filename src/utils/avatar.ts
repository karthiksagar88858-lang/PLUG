export interface AvatarOptions {
  skinTone: string;
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'chiseled';
  hairStyle: 'short' | 'curly' | 'wavy' | 'bun' | 'buzz' | 'sideswept' | 'slick' | 'cap';
  hairColor: string;
  eyeStyle: 'friendly' | 'confident' | 'smiling' | 'wide' | 'focused';
  accessory: 'none' | 'roundGlasses' | 'squareGlasses' | 'sunglasses' | 'earphones' | 'campusCap';
  clothesStyle: 'hoodie' | 'tshirt' | 'polo' | 'denim';
  clothesColor: string;
  bgColor: string;
}

export const SKIN_TONES = [
  { label: 'Fair Ivory', value: '#FDE4D0' },
  { label: 'Warm Peach', value: '#F5CCA0' },
  { label: 'Wheatish Gold', value: '#E2A76F' },
  { label: 'Dusky Olive', value: '#C68642' },
  { label: 'Tan Bronze', value: '#8D5524' },
  { label: 'Deep Rich', value: '#503323' },
];

export const HAIR_COLORS = [
  { label: 'Jet Black', value: '#1A1A1A' },
  { label: 'Dark Espresso', value: '#362215' },
  { label: 'Chestnut Brown', value: '#5E381E' },
  { label: 'Burgundy Tint', value: '#6B212D' },
  { label: 'Caramel Blonde', value: '#B8860B' },
  { label: 'Silver Gray', value: '#8A95A5' },
];

export const CLOTHES_COLORS = [
  { label: 'Campus Teal', value: '#0F2A2E' },
  { label: 'Amber Gold', value: '#F59E0B' },
  { label: 'Navy Blue', value: '#1E3A8A' },
  { label: 'Emerald Pine', value: '#065F46' },
  { label: 'Crimson Red', value: '#991B1B' },
  { label: 'Charcoal', value: '#334155' },
];

export const BG_COLORS = [
  { label: 'Dark Teal', value: '#0F2A2E' },
  { label: 'Warm Amber', value: '#FEF3C7' },
  { label: 'Mint Breeze', value: '#D1FAE5' },
  { label: 'Sky Blue', value: '#E0F2FE' },
  { label: 'Lavender', value: '#EDE9FE' },
  { label: 'Sunset Coral', value: '#FFE4E6' },
  { label: 'Slate Night', value: '#1E293B' },
];

export const FACE_SHAPES: AvatarOptions['faceShape'][] = ['oval', 'round', 'square', 'heart', 'chiseled'];
export const HAIR_STYLES: AvatarOptions['hairStyle'][] = ['short', 'curly', 'wavy', 'bun', 'buzz', 'sideswept', 'slick', 'cap'];
export const EYE_STYLES: AvatarOptions['eyeStyle'][] = ['friendly', 'confident', 'smiling', 'wide', 'focused'];
export const ACCESSORIES: AvatarOptions['accessory'][] = ['none', 'roundGlasses', 'squareGlasses', 'sunglasses', 'earphones', 'campusCap'];
export const CLOTHES_STYLES: AvatarOptions['clothesStyle'][] = ['hoodie', 'tshirt', 'polo', 'denim'];

export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  skinTone: '#E2A76F',
  faceShape: 'oval',
  hairStyle: 'short',
  hairColor: '#1A1A1A',
  eyeStyle: 'friendly',
  accessory: 'none',
  clothesStyle: 'hoodie',
  clothesColor: '#0F2A2E',
  bgColor: '#FEF3C7',
};

export function generateAvatarSvg(options: AvatarOptions): string {
  const {
    skinTone,
    faceShape,
    hairStyle,
    hairColor,
    eyeStyle,
    accessory,
    clothesStyle,
    clothesColor,
    bgColor,
  } = options;

  // Face path based on faceShape
  let facePath = 'M 60 75 Q 60 125 100 135 Q 140 125 140 75 Q 140 45 100 45 Q 60 45 60 75 Z';
  if (faceShape === 'round') {
    facePath = 'M 56 80 Q 56 130 100 135 Q 144 130 144 80 Q 144 48 100 48 Q 56 48 56 80 Z';
  } else if (faceShape === 'square') {
    facePath = 'M 62 70 Q 62 120 75 132 Q 100 137 125 132 Q 138 120 138 70 Q 138 45 100 45 Q 62 45 62 70 Z';
  } else if (faceShape === 'heart') {
    facePath = 'M 58 70 Q 58 115 100 138 Q 142 115 142 70 Q 142 42 100 45 Q 58 42 58 70 Z';
  } else if (faceShape === 'chiseled') {
    facePath = 'M 60 72 L 64 112 L 100 136 L 136 112 L 140 72 Q 140 45 100 45 Q 60 45 60 72 Z';
  }

  // Eyes rendering
  let eyesSvg = `
    <!-- Eyes -->
    <ellipse cx="82" cy="88" rx="4.5" ry="5" fill="#1E293B" />
    <ellipse cx="118" cy="88" rx="4.5" ry="5" fill="#1E293B" />
    <circle cx="83.5" cy="86.5" r="1.5" fill="#FFFFFF" />
    <circle cx="119.5" cy="86.5" r="1.5" fill="#FFFFFF" />
    <!-- Eyebrows -->
    <path d="M 74 79 Q 83 75 91 78" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M 109 78 Q 117 75 126 79" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
  `;

  if (eyeStyle === 'smiling') {
    eyesSvg = `
      <path d="M 76 89 Q 82 82 88 89" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 112 89 Q 118 82 124 89" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 74 77 Q 83 73 91 76" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M 109 76 Q 117 73 126 77" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    `;
  } else if (eyeStyle === 'confident') {
    eyesSvg = `
      <ellipse cx="82" cy="88" rx="4.5" ry="4" fill="#1E293B" />
      <ellipse cx="118" cy="88" rx="4.5" ry="4" fill="#1E293B" />
      <circle cx="83.5" cy="87" r="1.3" fill="#FFFFFF" />
      <circle cx="119.5" cy="87" r="1.3" fill="#FFFFFF" />
      <path d="M 74 76 Q 83 74 91 79" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M 109 79 Q 117 74 126 76" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" fill="none" />
    `;
  } else if (eyeStyle === 'wide') {
    eyesSvg = `
      <ellipse cx="82" cy="88" rx="5.5" ry="6" fill="#1E293B" />
      <ellipse cx="118" cy="88" rx="5.5" ry="6" fill="#1E293B" />
      <circle cx="84" cy="86" r="2" fill="#FFFFFF" />
      <circle cx="120" cy="86" r="2" fill="#FFFFFF" />
      <path d="M 74 76 Q 82 72 90 76" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M 110 76 Q 118 72 126 76" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    `;
  } else if (eyeStyle === 'focused') {
    eyesSvg = `
      <ellipse cx="82" cy="89" rx="4" ry="4.5" fill="#1E293B" />
      <ellipse cx="118" cy="89" rx="4" ry="4.5" fill="#1E293B" />
      <circle cx="83" cy="88" r="1.2" fill="#FFFFFF" />
      <circle cx="119" cy="88" r="1.2" fill="#FFFFFF" />
      <path d="M 73 80 L 92 80" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" />
      <path d="M 108 80 L 127 80" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" />
    `;
  }

  // Nose & Smile
  const featuresSvg = `
    <!-- Nose -->
    <path d="M 98 94 Q 100 105 95 106 Q 100 108 104 105" stroke="#C68642" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.65" />
    <!-- Smile -->
    <path d="M 88 116 Q 100 126 112 116" stroke="#991B1B" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 88 116 Q 100 120 112 116" fill="#FFFFFF" opacity="0.8" />
    <!-- Cheeks blush -->
    <circle cx="74" cy="104" r="6" fill="#F43F5E" opacity="0.18" />
    <circle cx="126" cy="104" r="6" fill="#F43F5E" opacity="0.18" />
  `;

  // Hair rendering
  let hairSvg = '';
  if (hairStyle === 'short') {
    hairSvg = `
      <path d="M 58 72 C 54 40, 75 30, 100 30 C 125 30, 146 40, 142 72 C 138 52, 126 44, 100 44 C 74 44, 62 52, 58 72 Z" fill="${hairColor}" />
      <path d="M 56 68 Q 50 82 56 94 Q 60 76 66 66 Z" fill="${hairColor}" />
      <path d="M 144 68 Q 150 82 144 94 Q 140 76 134 66 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'curly') {
    hairSvg = `
      <circle cx="64" cy="46" r="16" fill="${hairColor}" />
      <circle cx="84" cy="36" r="17" fill="${hairColor}" />
      <circle cx="106" cy="34" r="18" fill="${hairColor}" />
      <circle cx="128" cy="42" r="16" fill="${hairColor}" />
      <circle cx="140" cy="58" r="14" fill="${hairColor}" />
      <circle cx="58" cy="62" r="14" fill="${hairColor}" />
      <circle cx="54" cy="80" r="12" fill="${hairColor}" />
      <circle cx="146" cy="78" r="12" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'wavy') {
    hairSvg = `
      <path d="M 55 76 Q 50 30 100 30 Q 150 30 145 76 Q 148 110 144 135 Q 138 120 136 86 Q 124 50 100 50 Q 76 50 64 86 Q 62 120 56 135 Q 52 110 55 76 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'bun') {
    hairSvg = `
      <circle cx="100" cy="22" r="16" fill="${hairColor}" />
      <path d="M 58 72 C 54 38, 75 32, 100 32 C 125 32, 146 38, 142 72 C 136 50, 122 45, 100 45 C 78 45, 64 50, 58 72 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'buzz') {
    hairSvg = `
      <path d="M 58 68 C 58 44, 75 36, 100 36 C 125 36, 142 44, 142 68 C 138 52, 124 45, 100 45 C 76 45, 62 52, 58 68 Z" fill="${hairColor}" opacity="0.9" />
    `;
  } else if (hairStyle === 'sideswept') {
    hairSvg = `
      <path d="M 54 74 Q 52 35 96 30 Q 144 26 146 64 Q 138 46 116 46 Q 76 46 60 76 Z" fill="${hairColor}" />
      <path d="M 140 60 Q 148 85 144 110 Q 136 78 134 60 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'slick') {
    hairSvg = `
      <path d="M 58 70 C 56 36, 75 30, 100 30 C 125 30, 144 36, 142 70 C 136 48, 124 42, 100 42 C 76 42, 64 48, 58 70 Z" fill="${hairColor}" />
      <path d="M 66 52 Q 100 46 134 52" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.25" />
    `;
  } else if (hairStyle === 'cap') {
    hairSvg = `
      <!-- Campus Cap -->
      <path d="M 54 62 C 54 38 75 32 100 32 C 125 32 146 38 146 62 Z" fill="${hairColor}" />
      <path d="M 44 62 Q 100 56 156 62 Q 130 72 44 62 Z" fill="#0F2A2E" />
      <rect x="91" y="44" width="18" height="10" rx="3" fill="#FBBF24" />
      <text x="100" y="52" font-size="6" font-family="sans-serif" font-weight="900" fill="#0F2A2E" text-anchor="middle">LPU</text>
    `;
  }

  // Clothes rendering
  let clothesSvg = '';
  if (clothesStyle === 'hoodie') {
    clothesSvg = `
      <!-- Hoodie -->
      <path d="M 40 200 L 40 160 Q 64 140 100 144 Q 136 140 160 160 L 160 200 Z" fill="${clothesColor}" />
      <!-- Hood neckline -->
      <path d="M 74 146 Q 100 170 126 146 Q 134 162 100 178 Q 66 162 74 146 Z" fill="#1E293B" opacity="0.3" />
      <!-- Drawstrings -->
      <path d="M 92 168 L 92 188" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8" />
      <path d="M 108 168 L 108 188" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8" />
    `;
  } else if (clothesStyle === 'polo') {
    clothesSvg = `
      <!-- Polo -->
      <path d="M 40 200 L 40 160 Q 64 140 100 144 Q 136 140 160 160 L 160 200 Z" fill="${clothesColor}" />
      <!-- Collar -->
      <polygon points="100,150 78,142 88,168 100,162" fill="#FFFFFF" opacity="0.9" />
      <polygon points="100,150 122,142 112,168 100,162" fill="#FFFFFF" opacity="0.9" />
      <line x1="100" y1="162" x2="100" y2="190" stroke="#FFFFFF" stroke-width="2" opacity="0.5" />
    `;
  } else if (clothesStyle === 'denim') {
    clothesSvg = `
      <!-- Denim Jacket -->
      <path d="M 40 200 L 40 160 Q 64 140 100 144 Q 136 140 160 160 L 160 200 Z" fill="#2563EB" />
      <path d="M 78 144 L 100 168 L 122 144 Z" fill="${clothesColor}" />
      <line x1="82" y1="152" x2="82" y2="200" stroke="#1D4ED8" stroke-width="2" />
      <line x1="118" y1="152" x2="118" y2="200" stroke="#1D4ED8" stroke-width="2" />
    `;
  } else {
    // tshirt
    clothesSvg = `
      <!-- Crewneck T-shirt -->
      <path d="M 40 200 L 40 160 Q 64 140 100 144 Q 136 140 160 160 L 160 200 Z" fill="${clothesColor}" />
      <path d="M 82 144 Q 100 156 118 144" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4" />
    `;
  }

  // Accessories rendering
  let accessorySvg = '';
  if (accessory === 'roundGlasses') {
    accessorySvg = `
      <!-- Round Specs -->
      <circle cx="82" cy="88" r="11" stroke="#0F2A2E" stroke-width="2.5" fill="#FFFFFF" fill-opacity="0.2" />
      <circle cx="118" cy="88" r="11" stroke="#0F2A2E" stroke-width="2.5" fill="#FFFFFF" fill-opacity="0.2" />
      <line x1="93" y1="88" x2="107" y2="88" stroke="#0F2A2E" stroke-width="2.5" />
      <line x1="71" y1="86" x2="62" y2="84" stroke="#0F2A2E" stroke-width="2" />
      <line x1="129" y1="86" x2="138" y2="84" stroke="#0F2A2E" stroke-width="2" />
    `;
  } else if (accessory === 'squareGlasses') {
    accessorySvg = `
      <!-- Square Specs -->
      <rect x="70" y="78" width="24" height="19" rx="4" stroke="#1E293B" stroke-width="2.5" fill="#FFFFFF" fill-opacity="0.2" />
      <rect x="106" y="78" width="24" height="19" rx="4" stroke="#1E293B" stroke-width="2.5" fill="#FFFFFF" fill-opacity="0.2" />
      <line x1="94" y1="86" x2="106" y2="86" stroke="#1E293B" stroke-width="2.5" />
      <line x1="70" y1="84" x2="62" y2="82" stroke="#1E293B" stroke-width="2" />
      <line x1="130" y1="84" x2="138" y2="82" stroke="#1E293B" stroke-width="2" />
    `;
  } else if (accessory === 'sunglasses') {
    accessorySvg = `
      <!-- Cool Sunglasses -->
      <path d="M 68 80 L 95 80 L 91 98 Q 78 102 70 95 Z" fill="#0F172A" stroke="#FBBF24" stroke-width="1.5" />
      <path d="M 105 80 L 132 80 L 130 95 Q 122 102 109 98 Z" fill="#0F172A" stroke="#FBBF24" stroke-width="1.5" />
      <line x1="95" y1="84" x2="105" y2="84" stroke="#FBBF24" stroke-width="2" />
    `;
  } else if (accessory === 'earphones') {
    accessorySvg = `
      <!-- Wireless campus earbuds / headset -->
      <rect x="52" y="80" width="8" height="16" rx="4" fill="#FFFFFF" stroke="#0F2A2E" stroke-width="1.5" />
      <rect x="140" y="80" width="8" height="16" rx="4" fill="#FFFFFF" stroke="#0F2A2E" stroke-width="1.5" />
      <line x1="56" y1="96" x2="56" y2="106" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
      <line x1="144" y1="96" x2="144" y2="106" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (accessory === 'campusCap') {
    accessorySvg = `
      <!-- Beanie / Cap Peak -->
      <path d="M 52 58 Q 100 50 148 58 Q 156 68 144 72 Q 100 64 56 72 Z" fill="#FBBF24" />
      <circle cx="100" cy="40" r="4" fill="#0F2A2E" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <!-- Background -->
  <rect width="200" height="200" rx="100" fill="${bgColor}" />
  
  <!-- Neck -->
  <rect x="88" y="118" width="24" height="32" rx="4" fill="${skinTone}" />
  <!-- Neck shadow -->
  <path d="M 88 126 Q 100 134 112 126 L 112 118 L 88 118 Z" fill="#000000" opacity="0.1" />

  <!-- Clothes -->
  ${clothesSvg}

  <!-- Ears -->
  <circle cx="60" cy="90" r="8" fill="${skinTone}" />
  <circle cx="140" cy="90" r="8" fill="${skinTone}" />
  <circle cx="60" cy="90" r="4" fill="#000000" opacity="0.1" />
  <circle cx="140" cy="90" r="4" fill="#000000" opacity="0.1" />

  <!-- Head Base -->
  <path d="${facePath}" fill="${skinTone}" />

  <!-- Eyes & Eyebrows -->
  ${eyesSvg}

  <!-- Nose & Smile -->
  ${featuresSvg}

  <!-- Hair -->
  ${hairSvg}

  <!-- Accessory -->
  ${accessorySvg}
</svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Deterministically generates a fresh, customized avatar based on user's name
 * Guaranteed to never be a robot or stock photo!
 */
export function generateNameAvatar(name: string): string {
  const clean = (name || 'Student').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const skinTone = SKIN_TONES[posHash % SKIN_TONES.length].value;
  const faceShape = FACE_SHAPES[posHash % FACE_SHAPES.length];
  const hairStyle = HAIR_STYLES[(posHash >> 2) % HAIR_STYLES.length];
  const hairColor = HAIR_COLORS[(posHash >> 4) % HAIR_COLORS.length].value;
  const eyeStyle = EYE_STYLES[(posHash >> 6) % EYE_STYLES.length];
  const accessory = ACCESSORIES[(posHash >> 8) % ACCESSORIES.length];
  const clothesStyle = CLOTHES_STYLES[(posHash >> 10) % CLOTHES_STYLES.length];
  const clothesColor = CLOTHES_COLORS[(posHash >> 12) % CLOTHES_COLORS.length].value;
  const bgColor = BG_COLORS[(posHash >> 14) % BG_COLORS.length].value;

  const svg = generateAvatarSvg({
    skinTone,
    faceShape,
    hairStyle,
    hairColor,
    eyeStyle,
    accessory,
    clothesStyle,
    clothesColor,
    bgColor,
  });

  return svgToDataUrl(svg);
}
