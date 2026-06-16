const TRADING_PREFIXES = [
  'supplier', 'manufacturer', 'wholesale', 'price', 'buy', 'purchase',
  'trade', 'b2b', 'dealer', 'distributor', 'exporter', 'importer',
  'vendor', 'seller', 'stockist', 'trader', 'bulk', 'order',
  'quotation', 'enquiry', 'rates', 'cost', 'india', 'made in india',
];

const PRODUCT_TYPE_SYNONYMS: Record<string, string[]> = {
  rods: ['bars', 'round bars', 'tmt bars'],
  bars: ['rods', 'round bars', 'tmt bars'],
  sheets: ['plates', 'panels', 'slabs'],
  plates: ['sheets', 'panels', 'slabs'],
  pipes: ['tubes', 'conduits', 'ducts'],
  tubes: ['pipes', 'conduits', 'ducts'],
  wire: ['cable', 'strand', 'thread'],
  cable: ['wire', 'lead', 'conductor'],
  coil: ['roll', 'sheet roll', 'strip'],
  powder: ['dust', 'fine', 'mesh'],
  granule: ['granular', 'pellets', 'beads'],
  pellet: ['granule', 'beads', 'prill'],
  oil: ['lubricant', 'fluid', 'grease'],
  grease: ['lubricant', 'oil', 'compound'],
  valve: ['tap', 'faucet', 'regulator'],
  pump: ['pump set', 'pumping unit'],
  motor: ['engine', 'drive', 'prime mover'],
  blade: ['knife', 'cutter', 'cutting edge'],
  bolt: ['fastener', 'screw', 'stud'],
  nut: ['fastener', 'hex nut', 'lock nut'],
  screw: ['fastener', 'bolt', 'self-tapping'],
  washer: ['spacer', 'shim', 'gasket'],
  gasket: ['seal', 'packing', 'washer'],
  seal: ['gasket', 'packing', 'oring'],
  filter: ['strainer', 'separator', 'clarifier'],
  tank: ['vessel', 'container', 'storage tank'],
  drum: ['barrel', 'container', 'keg'],
  bag: ['sack', 'pouch', 'pack'],
  bottle: ['jar', 'container', 'vial'],
  box: ['carton', 'crate', 'case'],
  crate: ['box', 'carton', 'container'],
  chemical: ['compound', 'reagent', 'substance'],
  acid: ['corrosive', 'chemical', 'reagent'],
  alloy: ['metal blend', 'compound', 'mixture'],
  fabric: ['cloth', 'textile', 'material'],
  yarn: ['thread', 'filament', 'fiber'],
  fiber: ['fibre', 'filament', 'yarn'],
  dye: ['color', 'pigment', 'stain'],
  pigment: ['color', 'dye', 'colorant'],
  paint: ['coating', 'enamel', 'varnish'],
  varnish: ['coating', 'lacquer', 'enamel'],
  wood: ['timber', 'lumber', 'plywood'],
  timber: ['wood', 'lumber', 'hardwood'],
  tile: ['flooring', 'slab', 'paver'],
  brick: ['block', 'paver', 'masonry unit'],
  cement: ['concrete', 'mortar', 'grout'],
  beam: ['girder', 'joist', 'rafter'],
  channel: ['c-channel', 'u-channel', 'section'],
  angle: ['angle bar', 'l-section', 'angle iron'],
  pipe: ['tube', 'conduit', 'line pipe'],
  hose: ['tube', 'flexible pipe', 'tubing'],
  belt: ['conveyor belt', 'strap', 'band'],
  roller: ['cylinder', 'drum', 'wheel'],
  bearing: ['ball bearing', 'roller bearing', 'bushing'],
  gear: ['gear wheel', 'cog', 'sprocket'],
  sprocket: ['gear', 'cog', 'sprocket wheel'],
  spring: ['coil spring', 'elastic', 'resilient'],
  clamp: ['clip', 'fastener', 'holder'],
  transformer: ['voltage converter', 'power transformer', 'step down'],
  capacitor: ['condenser', 'capacitor bank'],
  diode: ['rectifier', 'semiconductor'],
  resistor: ['resistor network', 'resistance'],
  sensor: ['detector', 'transducer', 'probe'],
  lens: ['optic', 'glass', 'eyepiece'],
  glove: ['hand protection', 'gauntlet', 'mitt'],
  helmet: ['head protection', 'hard hat', 'safety cap'],
  shoe: ['footwear', 'safety shoe', 'boot'],
  boot: ['footwear', 'shoe', 'gumboot'],
  ladder: ['step ladder', 'platform', 'scaffold'],
  scaffold: ['scaffolding', 'platform', 'staging'],
};

const INDIAN_MISSPELLINGS: Record<string, string[]> = {
  steel: ['steal', 'steele', 'steell'],
  aluminium: ['aluminum', 'alluminium', 'aluminimum', 'aluminium'],
  sulphur: ['sulfur', 'sulphar', 'sulfer'],
  fibre: ['fiber'],
  metre: ['meter'],
  tyre: ['tire'],
  colour: ['color'],
  catalogue: ['catalog', 'catalouge'],
  defence: ['defense'],
  licence: ['license'],
  practise: ['practice'],
  plough: ['plow'],
  mould: ['mold'],
  programme: ['program'],
  travelling: ['traveling'],
  jewellery: ['jewelry', 'jewellery'],
  grey: ['gray'],
  favour: ['favor'],
  honour: ['honor'],
  flavour: ['flavor'],
  labour: ['labor'],
  neighbour: ['neighbor'],
  centre: ['center'],
  litre: ['liter'],
  calibre: ['caliber'],
  cheque: ['check'],
  kerb: ['curb'],
  paise: ['paisa', 'paise'],
  lakh: ['lac', 'lakhs'],
  crore: ['crore', 'crores'],
};

function extractWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^\d+$/.test(w));
}

function getSynonymsForWord(word: string): string[] {
  return PRODUCT_TYPE_SYNONYMS[word] || [];
}

function getMisspellings(word: string): string[] {
  return INDIAN_MISSPELLINGS[word] || [];
}

export function generateSearchKeywords(name: string, aliases?: string[]): string[] {
  const keywords = new Set<string>();

  const words = extractWords(name);
  words.forEach((w) => keywords.add(w));

  words.forEach((w) => {
    const syns = getSynonymsForWord(w);
    syns.forEach((s) => keywords.add(s));
  });

  const fullName = name.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  keywords.add(fullName);

  keywords.add(`${fullName} price`);
  keywords.add(`${fullName} buy online`);
  keywords.add(`${fullName} india`);

  words.forEach((w) => {
    const miss = getMisspellings(w);
    miss.forEach((m) => {
      const corrected = fullName.replace(w, m);
      keywords.add(corrected);
    });
  });

  TRADING_PREFIXES.forEach((p) => {
    keywords.add(`${p} ${fullName}`);
  });

  if (aliases) {
    aliases.forEach((alias) => {
      const aliasWords = extractWords(alias);
      aliasWords.forEach((w) => keywords.add(w));
      keywords.add(alias.toLowerCase());
      TRADING_PREFIXES.forEach((p) => {
        keywords.add(`${p} ${alias.toLowerCase()}`);
      });
    });
  }

  return Array.from(keywords).sort();
}

export function generateSynonyms(categoryName: string, productName: string): string[] {
  const synonyms = new Set<string>();

  const words = extractWords(productName);
  words.forEach((w) => {
    const syns = getSynonymsForWord(w);
    syns.forEach((s) => synonyms.add(s));
  });

  const catWords = extractWords(categoryName);
  catWords.forEach((w) => {
    if (!words.includes(w)) {
      synonyms.add(`${w} ${productName.toLowerCase()}`);
    }
  });

  return Array.from(synonyms).sort();
}

export function generateTags(product: { name: string; category?: string; description?: string }): string[] {
  const tags = new Set<string>();

  const words = extractWords(product.name);
  words.forEach((w) => tags.add(w));

  if (product.category) {
    const catWords = extractWords(product.category);
    catWords.forEach((w) => tags.add(w));
    tags.add(product.category.toLowerCase());
  }

  if (product.description) {
    const descWords = extractWords(product.description);
    descWords.forEach((w) => {
      if (w.length > 2) tags.add(w);
    });
  }

  ['b2b', 'trade', 'industrial', 'supplier', 'manufacturer',
   'wholesale', 'india', 'bulk', 'commercial'].forEach((t) => tags.add(t));

  return Array.from(tags).sort();
}
