const TRANSLITERATION_MAP: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', æ: 'ae',
  ç: 'c', è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ñ: 'n', ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ø: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ý: 'y', þ: 'th', ß: 'ss',
  ā: 'a', ă: 'a', ą: 'a', ć: 'c', ĉ: 'c', ċ: 'c', č: 'c',
  ď: 'd', đ: 'd', ē: 'e', ĕ: 'e', ė: 'e', ę: 'e', ě: 'e',
  ĝ: 'g', ğ: 'g', ġ: 'g', ģ: 'g', ĥ: 'h', ħ: 'h',
  ĩ: 'i', ī: 'i', ĭ: 'i', į: 'i', İ: 'i', ı: 'i',
  ĳ: 'ij', ĵ: 'j', ķ: 'k', ļ: 'l', ľ: 'l', ł: 'l',
  ņ: 'n', ň: 'n', ŉ: 'n', ŋ: 'n', ō: 'o', ŏ: 'o', ő: 'o',
  œ: 'oe', ŕ: 'r', ř: 'r', ś: 's', ŝ: 's', ş: 's', š: 's',
  ţ: 't', ť: 't', ŧ: 't', ũ: 'u', ū: 'u', ŭ: 'u', ů: 'u', ű: 'u', ų: 'u',
  ŵ: 'w', ŷ: 'y', ź: 'z', ż: 'z', ž: 'z',
  '№': 'no', '©': 'c', '®': 'r', '™': 'tm',
  '₹': 'inr', '₽': 'rub', '€': 'eur', '$': 'usd', '£': 'gbp',
  '½': '1-2', '⅓': '1-3', '⅔': '2-3', '¼': '1-4', '¾': '3-4',
  '×': 'x', '÷': 'by', '±': 'plus-minus', '°': 'deg',
  '%': 'percent', '&': 'and', '|': 'or',
  '→': 'to', '←': 'from', '↑': 'up', '↓': 'down',
};

const INDIAN_TERM_MAP: Record<string, string> = {
  sari: 'saree', salwar: 'salwar-kameez', churidar: 'churidar',
  lehenga: 'lehenga', anarkali: 'anarkali', kurta: 'kurta',
  dhoti: 'dhoti', sherwani: 'sherwani', bandhgala: 'bandhgala',
  choli: 'choli', dupatta: 'dupatta', pallu: 'pallu',
  gharara: 'gharara', sharara: 'sharara', patiala: 'patiala',
  palazzo: 'palazzo', lungi: 'lungi',
  mundu: 'mundu', veshti: 'veshti', angavastram: 'angavastram',
  roti: 'roti', naan: 'naan', paratha: 'paratha', puri: 'puri',
  bhakri: 'bhakri', dosa: 'dosa', idli: 'idli', vada: 'vada',
  sambar: 'sambar', rasam: 'rasam', chutney: 'chutney',
  papad: 'papad', mithai: 'mithai', peda: 'peda', barfi: 'barfi',
  laddu: 'laddu', jalebi: 'jalebi', gulab: 'gulab', jamun: 'jamun',
  kaju: 'kaju-katli', rasgulla: 'rasgulla', sandesh: 'sandesh',
  chamki: 'chamki', gota: 'gota-patti', zari: 'zari', resham: 'resham',
  chikankari: 'chikankari', kantha: 'kantha', kalamkari: 'kalamkari',
  bandhani: 'bandhani', ikat: 'ikat', patola: 'patola',
  pochampally: 'pochampally', kanchipuram: 'kanchipuram',
  banarasi: 'banarasi', paithani: 'paithani',
};

export function generateSlug(name: string): string {
  let slug = name.trim().toLowerCase();

  for (const [char, replacement] of Object.entries(TRANSLITERATION_MAP)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement);
  }

  slug = slug
    .replace(/[^a-z0-9\s\-_.]/g, ' ')
    .replace(/[\s_.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled';
}

export function generateUniqueSlug(name: string, existingSlugs: Set<string>): string {
  const baseSlug = generateSlug(name);
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let counter = 2;
  let slug: string;
  do {
    slug = `${baseSlug}-${counter}`;
    counter++;
  } while (existingSlugs.has(slug));

  return slug;
}
