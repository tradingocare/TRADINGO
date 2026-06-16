import { PrismaClient, TemplateFieldType } from '@prisma/client';

const prisma = new PrismaClient();

interface FieldDef {
  key: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  sortOrder?: number;
  options?: string[];
  validation?: Record<string, any>;
}

interface SectionDef {
  key: string;
  title: string;
  description?: string;
  sortOrder: number;
  icon?: string;
  fields: FieldDef[];
}

interface TemplateDef {
  name: string;
  categorySlug: string;
  sections: SectionDef[];
}

function field(key: string, label: string, type: TemplateFieldType, opts?: Partial<FieldDef>): FieldDef {
  return { key, label, type, sortOrder: 0, ...opts };
}

const FOOD_TEMPLATE: TemplateDef = {
  name: 'Food & Beverage Template',
  categorySlug: 'food-beverage',
  sections: [
    {
      key: 'basic-information', title: 'Basic Information', sortOrder: 1, icon: 'info',
      fields: [
        field('product-name', 'Product Name', 'TEXT', { isRequired: true, placeholder: 'e.g. Organic Basmati Rice', sortOrder: 1 }),
        field('brand', 'Brand', 'TEXT', { placeholder: 'Brand name', sortOrder: 2 }),
        field('short-description', 'Short Description', 'TEXTAREA', { helpText: 'Brief product summary (max 200 chars)', sortOrder: 3 }),
        field('full-description', 'Full Description', 'RICH_TEXT', { sortOrder: 4 }),
        field('hs-code', 'HS Code', 'TEXT', { helpText: 'Harmonized System code for customs', sortOrder: 5 }),
        field('gtin', 'GTIN / Barcode', 'TEXT', { placeholder: 'Global Trade Item Number', sortOrder: 6 }),
      ],
    },
    {
      key: 'specifications', title: 'Specifications', sortOrder: 2, icon: 'settings',
      fields: [
        field('shelf-life', 'Shelf Life', 'TEXT', { placeholder: 'e.g. 12 months', sortOrder: 1, isRequired: true }),
        field('storage-type', 'Storage Type', 'SELECT', { options: ['Ambient', 'Refrigerated', 'Frozen', 'Controlled Atmosphere'], sortOrder: 2, isRequired: true }),
        field('ingredients', 'Ingredients', 'TEXTAREA', { placeholder: 'List key ingredients', sortOrder: 3 }),
        field('nutritional-info', 'Nutritional Information', 'JSON', { helpText: 'JSON object with nutritional values per serving', sortOrder: 4 }),
        field('allergens', 'Allergens', 'TAGS', { helpText: 'e.g. Nuts, Gluten, Dairy', sortOrder: 5 }),
        field('dietary-info', 'Dietary Information', 'MULTI_SELECT', { options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Organic', 'Non-GMO', 'Halal', 'Kosher'], sortOrder: 6 }),
        field('certifications', 'Certifications', 'MULTI_SELECT', { options: ['FSSAI', 'ISO 22000', 'HACCP', 'USDA Organic', 'FDA', 'EU Organic'], sortOrder: 7 }),
        field('manufacture-date', 'Manufacture Date', 'DATE', { sortOrder: 8 }),
        field('expiry-date', 'Expiry Date', 'DATE', { sortOrder: 9, isRequired: true }),
      ],
    },
    {
      key: 'pricing', title: 'Pricing', sortOrder: 3, icon: 'dollar-sign',
      fields: [
        field('unit', 'Unit', 'SELECT', { options: ['Kg', 'g', 'L', 'ml', 'Piece', 'Box', 'Carton', 'Case', 'Pallet', 'Ton'], sortOrder: 1, isRequired: true }),
        field('price-per-unit', 'Price per Unit', 'PRICE', { placeholder: '0.00', sortOrder: 2, isRequired: true }),
        field('currency', 'Currency', 'SELECT', { options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], sortOrder: 3, isRequired: true }),
        field('moq', 'Minimum Order Quantity', 'NUMBER', { placeholder: '1', helpText: 'Minimum quantity per order', sortOrder: 4 }),
        field('bulk-pricing', 'Bulk Pricing Tiers', 'JSON', { helpText: 'JSON array of {minQty, maxQty, price}', sortOrder: 5 }),
      ],
    },
    {
      key: 'packaging', title: 'Packaging & Shipping', sortOrder: 4, icon: 'package',
      fields: [
        field('packaging-type', 'Packaging Type', 'SELECT', { options: ['Pouch', 'Jar', 'Bottle', 'Box', 'Bag', 'Drum', 'Can', 'Vacuum Pack'], sortOrder: 1 }),
        field('pack-size', 'Pack Size', 'TEXT', { placeholder: 'e.g. 1kg, 500ml', sortOrder: 2 }),
        field('units-per-pack', 'Units Per Pack', 'NUMBER', { sortOrder: 3 }),
        field('lead-time', 'Lead Time', 'TEXT', { placeholder: 'e.g. 7-10 days', sortOrder: 4 }),
        field('delivery-eta', 'Delivery ETA', 'TEXT', { placeholder: 'e.g. 3-5 business days', sortOrder: 5 }),
        field('shipping-info', 'Shipping Information', 'TEXTAREA', { sortOrder: 6 }),
      ],
    },
    {
      key: 'media', title: 'Images & Videos', sortOrder: 5, icon: 'image',
      fields: [
        field('product-images', 'Product Images', 'IMAGE', { helpText: 'Upload up to 5 images', sortOrder: 1 }),
        field('product-videos', 'Product Videos', 'VIDEO', { sortOrder: 2 }),
        field('product-brochure', 'Brochure', 'PDF', { sortOrder: 3 }),
        field('catalog', 'Catalog', 'PDF', { sortOrder: 4 }),
      ],
    },
    {
      key: 'documents', title: 'Documents & Certificates', sortOrder: 6, icon: 'file-text',
      fields: [
        field('fssai-license', 'FSSAI License', 'FILE', { helpText: 'Upload FSSAI license document', sortOrder: 1, isRequired: true }),
        field('gst-certificate', 'GST Certificate', 'FILE', { sortOrder: 2 }),
        field('iso-certificate', 'ISO Certificate', 'FILE', { sortOrder: 3 }),
        field('lab-reports', 'Lab Test Reports', 'FILE', { helpText: 'Upload third-party lab test reports', sortOrder: 4 }),
        field('msds', 'MSDS (Material Safety Data Sheet)', 'PDF', { sortOrder: 5 }),
        field('other-certificates', 'Other Certificates', 'FILE', { sortOrder: 6 }),
      ],
    },
    {
      key: 'near-me', title: 'Near Me', sortOrder: 7, icon: 'map-pin',
      fields: [
        field('latitude', 'Latitude', 'LOCATION', { helpText: 'Business location latitude', sortOrder: 1 }),
        field('longitude', 'Longitude', 'LOCATION', { helpText: 'Business location longitude', sortOrder: 2 }),
        field('visibility-radius', 'Visibility Radius', 'SELECT', { options: ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'], sortOrder: 3 }),
      ],
    },
    {
      key: 'seo', title: 'SEO', sortOrder: 8, icon: 'search',
      fields: [
        field('seo-title', 'SEO Title', 'TEXT', { sortOrder: 1 }),
        field('seo-description', 'SEO Description', 'TEXTAREA', { sortOrder: 2 }),
        field('seo-keywords', 'SEO Keywords', 'TAGS', { sortOrder: 3 }),
      ],
    },
  ],
};

const ELECTRONICS_TEMPLATE: TemplateDef = {
  name: 'Electronics Template',
  categorySlug: 'electronics',
  sections: [
    {
      key: 'basic-information', title: 'Basic Information', sortOrder: 1, icon: 'info',
      fields: [
        field('product-name', 'Product Name', 'TEXT', { isRequired: true, placeholder: 'e.g. Smart LED TV 55"', sortOrder: 1 }),
        field('brand', 'Brand', 'TEXT', { sortOrder: 2, isRequired: true }),
        field('model', 'Model Number', 'TEXT', { sortOrder: 3 }),
        field('short-description', 'Short Description', 'TEXTAREA', { sortOrder: 4 }),
        field('full-description', 'Full Description', 'RICH_TEXT', { sortOrder: 5 }),
        field('hs-code', 'HS Code', 'TEXT', { sortOrder: 6 }),
      ],
    },
    {
      key: 'specifications', title: 'Technical Specifications', sortOrder: 2, icon: 'settings',
      fields: [
        field('warranty', 'Warranty', 'TEXT', { placeholder: 'e.g. 1 year', sortOrder: 1, isRequired: true }),
        field('certifications', 'Certifications', 'MULTI_SELECT', { options: ['CE', 'RoHS', 'FCC', 'UL', 'ISO 9001', 'BIS', 'ISI'], sortOrder: 2 }),
        field('power-requirements', 'Power Requirements', 'TEXT', { placeholder: 'e.g. 100-240V AC, 50/60Hz', sortOrder: 3 }),
        field('dimensions', 'Dimensions', 'TEXT', { placeholder: 'e.g. 45x30x15 cm', sortOrder: 4 }),
        field('weight', 'Weight', 'TEXT', { placeholder: 'e.g. 5.2 kg', sortOrder: 5 }),
        field('color', 'Color', 'SELECT', { options: ['Black', 'White', 'Silver', 'Gray', 'Blue', 'Red'], sortOrder: 6 }),
        field('material', 'Material', 'TEXT', { sortOrder: 7 }),
        field('spec-sheet', 'Detailed Spec Sheet', 'JSON', { helpText: 'JSON object with additional technical specifications', sortOrder: 8 }),
      ],
    },
    {
      key: 'pricing', title: 'Pricing', sortOrder: 3, icon: 'dollar-sign',
      fields: [
        field('unit', 'Unit', 'SELECT', { options: ['Piece', 'Set', 'Box', 'Carton', 'Pair'], sortOrder: 1, isRequired: true }),
        field('price-per-unit', 'Price per Unit', 'PRICE', { sortOrder: 2, isRequired: true }),
        field('currency', 'Currency', 'SELECT', { options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], sortOrder: 3, isRequired: true }),
        field('moq', 'Minimum Order Quantity', 'NUMBER', { placeholder: '1', sortOrder: 4 }),
        field('bulk-pricing', 'Bulk Pricing Tiers', 'JSON', { sortOrder: 5 }),
      ],
    },
    {
      key: 'variants', title: 'Variants', sortOrder: 4, icon: 'layers',
      fields: [
        field('variant-type', 'Variant Type', 'SELECT', { options: ['Size', 'Color', 'Storage', 'Model', 'Capacity', 'Power'], sortOrder: 1 }),
        field('variants', 'Variants Configuration', 'JSON', { helpText: 'Array of variant combinations', sortOrder: 2 }),
      ],
    },
    {
      key: 'media', title: 'Images & Videos', sortOrder: 5, icon: 'image',
      fields: [
        field('product-images', 'Product Images', 'IMAGE', { sortOrder: 1, isRequired: true }),
        field('product-videos', 'Product Videos', 'VIDEO', { sortOrder: 2 }),
        field('catalog', 'Product Catalog', 'PDF', { sortOrder: 3 }),
        field('brochure', 'Brochure', 'PDF', { sortOrder: 4 }),
      ],
    },
    {
      key: 'packaging', title: 'Packaging & Shipping', sortOrder: 6, icon: 'package',
      fields: [
        field('packaging-type', 'Packaging Type', 'SELECT', { options: ['Retail Box', 'Export Carton', 'Poly Bag', 'Blister Pack'], sortOrder: 1 }),
        field('units-per-carton', 'Units per Carton', 'NUMBER', { sortOrder: 2 }),
        field('carton-dimensions', 'Carton Dimensions', 'TEXT', { sortOrder: 3 }),
        field('carton-weight', 'Carton Weight', 'TEXT', { sortOrder: 4 }),
        field('lead-time', 'Lead Time', 'TEXT', { sortOrder: 5 }),
      ],
    },
    {
      key: 'documents', title: 'Documents & Certifications', sortOrder: 7, icon: 'file-text',
      fields: [
        field('gst-certificate', 'GST Certificate', 'FILE', { sortOrder: 1 }),
        field('bis-certificate', 'BIS Certificate', 'FILE', { sortOrder: 2 }),
        field('iso-certificate', 'ISO Certificate', 'FILE', { sortOrder: 3 }),
        field('lab-reports', 'Lab Reports', 'FILE', { sortOrder: 4 }),
        field('msds', 'MSDS', 'PDF', { sortOrder: 5 }),
      ],
    },
    {
      key: 'near-me', title: 'Near Me', sortOrder: 8, icon: 'map-pin',
      fields: [
        field('latitude', 'Latitude', 'LOCATION', { sortOrder: 1 }),
        field('longitude', 'Longitude', 'LOCATION', { sortOrder: 2 }),
        field('visibility-radius', 'Visibility Radius', 'SELECT', { options: ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'], sortOrder: 3 }),
      ],
    },
    {
      key: 'seo', title: 'SEO', sortOrder: 9, icon: 'search',
      fields: [
        field('seo-title', 'SEO Title', 'TEXT', { sortOrder: 1 }),
        field('seo-description', 'SEO Description', 'TEXTAREA', { sortOrder: 2 }),
        field('seo-keywords', 'SEO Keywords', 'TAGS', { sortOrder: 3 }),
      ],
    },
  ],
};

const CHEMICALS_TEMPLATE: TemplateDef = {
  name: 'Chemicals Template',
  categorySlug: 'chemicals',
  sections: [
    {
      key: 'basic-information', title: 'Basic Information', sortOrder: 1, icon: 'info',
      fields: [
        field('product-name', 'Product Name', 'TEXT', { isRequired: true, sortOrder: 1 }),
        field('cas-number', 'CAS Number', 'TEXT', { helpText: 'Chemical Abstracts Service registry number', sortOrder: 2, isRequired: true }),
        field('molecular-formula', 'Molecular Formula', 'TEXT', { placeholder: 'e.g. H2SO4', sortOrder: 3 }),
        field('molecular-weight', 'Molecular Weight', 'TEXT', { placeholder: 'e.g. 98.08 g/mol', sortOrder: 4 }),
        field('short-description', 'Short Description', 'TEXTAREA', { sortOrder: 5 }),
        field('full-description', 'Full Description', 'RICH_TEXT', { sortOrder: 6 }),
        field('hs-code', 'HS Code', 'TEXT', { sortOrder: 7 }),
      ],
    },
    {
      key: 'specifications', title: 'Chemical Specifications', sortOrder: 2, icon: 'settings',
      fields: [
        field('purity', 'Purity (%)', 'TEXT', { placeholder: 'e.g. 99.9%', sortOrder: 1, isRequired: true }),
        field('grade', 'Grade', 'SELECT', { options: ['Industrial Grade', 'Lab Grade', 'Pharma Grade', 'Food Grade', 'Technical Grade', 'Reagent Grade', 'ACS Grade'], sortOrder: 2, isRequired: true }),
        field('physical-state', 'Physical State', 'SELECT', { options: ['Liquid', 'Solid', 'Powder', 'Gas', 'Crystal', 'Pellet', 'Flake'], sortOrder: 3 }),
        field('color', 'Color', 'TEXT', { sortOrder: 4 }),
        field('odor', 'Odor', 'TEXT', { sortOrder: 5 }),
        field('ph-value', 'pH Value', 'TEXT', { sortOrder: 6 }),
        field('boiling-point', 'Boiling Point', 'TEXT', { placeholder: 'e.g. 337°C', sortOrder: 7 }),
        field('melting-point', 'Melting Point', 'TEXT', { sortOrder: 8 }),
        field('flash-point', 'Flash Point', 'TEXT', { sortOrder: 9 }),
        field('density', 'Density', 'TEXT', { sortOrder: 10 }),
        field('solubility', 'Solubility', 'TEXT', { sortOrder: 11 }),
        field('spec-sheet', 'Detailed Spec Sheet', 'JSON', { sortOrder: 12 }),
      ],
    },
    {
      key: 'pricing', title: 'Pricing', sortOrder: 3, icon: 'dollar-sign',
      fields: [
        field('unit', 'Unit', 'SELECT', { options: ['Kg', 'g', 'L', 'ml', 'Ton', 'Drum', 'Barrel', 'Bag', 'Canister'], sortOrder: 1, isRequired: true }),
        field('price-per-unit', 'Price per Unit', 'PRICE', { sortOrder: 2, isRequired: true }),
        field('currency', 'Currency', 'SELECT', { options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], sortOrder: 3, isRequired: true }),
        field('moq', 'Minimum Order Quantity', 'NUMBER', { sortOrder: 4 }),
        field('bulk-pricing', 'Bulk Pricing Tiers', 'JSON', { sortOrder: 5 }),
      ],
    },
    {
      key: 'packaging', title: 'Packaging & Shipping', sortOrder: 4, icon: 'package',
      fields: [
        field('packaging-type', 'Packaging Type', 'SELECT', { options: ['Drum', 'Barrel', 'Bag', 'Canister', 'Carboy', 'IBC Tote', 'Tank', 'Bottle'], sortOrder: 1, isRequired: true }),
        field('pack-size', 'Pack Size', 'TEXT', { placeholder: 'e.g. 25kg, 200L', sortOrder: 2 }),
        field('hazard-class', 'Hazard Class', 'TEXT', { helpText: 'UN hazard class if applicable', sortOrder: 3 }),
        field('un-number', 'UN Number', 'TEXT', { helpText: 'UN identification number for hazardous materials', sortOrder: 4 }),
        field('lead-time', 'Lead Time', 'TEXT', { sortOrder: 5 }),
        field('shipping-info', 'Shipping Information', 'TEXTAREA', { sortOrder: 6 }),
      ],
    },
    {
      key: 'media', title: 'Images & Videos', sortOrder: 5, icon: 'image',
      fields: [
        field('product-images', 'Product Images', 'IMAGE', { sortOrder: 1 }),
        field('product-videos', 'Product Videos', 'VIDEO', { sortOrder: 2 }),
        field('safety-data-sheet', 'Safety Data Sheet', 'PDF', { sortOrder: 3, isRequired: true }),
        field('technical-data-sheet', 'Technical Data Sheet', 'PDF', { sortOrder: 4 }),
      ],
    },
    {
      key: 'documents', title: 'Documents & Certifications', sortOrder: 6, icon: 'file-text',
      fields: [
        field('gst-certificate', 'GST Certificate', 'FILE', { sortOrder: 1 }),
        field('iso-certificate', 'ISO Certificate', 'FILE', { sortOrder: 2 }),
        field('msds', 'MSDS (Material Safety Data Sheet)', 'PDF', { sortOrder: 3, isRequired: true }),
        field('lab-reports', 'Lab Test Reports', 'FILE', { sortOrder: 4 }),
        field('manufacturing-license', 'Manufacturing License', 'FILE', { sortOrder: 5 }),
      ],
    },
    {
      key: 'near-me', title: 'Near Me', sortOrder: 7, icon: 'map-pin',
      fields: [
        field('latitude', 'Latitude', 'LOCATION', { sortOrder: 1 }),
        field('longitude', 'Longitude', 'LOCATION', { sortOrder: 2 }),
        field('visibility-radius', 'Visibility Radius', 'SELECT', { options: ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'], sortOrder: 3 }),
      ],
    },
    {
      key: 'seo', title: 'SEO', sortOrder: 8, icon: 'search',
      fields: [
        field('seo-title', 'SEO Title', 'TEXT', { sortOrder: 1 }),
        field('seo-description', 'SEO Description', 'TEXTAREA', { sortOrder: 2 }),
        field('seo-keywords', 'SEO Keywords', 'TAGS', { sortOrder: 3 }),
      ],
    },
  ],
};

const MACHINERY_TEMPLATE: TemplateDef = {
  name: 'Machinery Template',
  categorySlug: 'machinery',
  sections: [
    {
      key: 'basic-information', title: 'Basic Information', sortOrder: 1, icon: 'info',
      fields: [
        field('product-name', 'Product Name', 'TEXT', { isRequired: true, sortOrder: 1 }),
        field('brand', 'Brand', 'TEXT', { sortOrder: 2, isRequired: true }),
        field('model', 'Model Number', 'TEXT', { sortOrder: 3, isRequired: true }),
        field('year-of-manufacture', 'Year of Manufacture', 'NUMBER', { sortOrder: 4 }),
        field('condition', 'Condition', 'SELECT', { options: ['New', 'Used', 'Refurbished', 'Rental'], sortOrder: 5, isRequired: true }),
        field('short-description', 'Short Description', 'TEXTAREA', { sortOrder: 6 }),
        field('full-description', 'Full Description', 'RICH_TEXT', { sortOrder: 7 }),
        field('hs-code', 'HS Code', 'TEXT', { sortOrder: 8 }),
      ],
    },
    {
      key: 'specifications', title: 'Technical Specifications', sortOrder: 2, icon: 'settings',
      fields: [
        field('power-rating', 'Power Rating', 'TEXT', { placeholder: 'e.g. 50 HP, 37 kW', sortOrder: 1, isRequired: true }),
        field('voltage', 'Voltage', 'SELECT', { options: ['220V', '380V', '415V', '440V', '11kV', 'Custom'], sortOrder: 2 }),
        field('phase', 'Phase', 'SELECT', { options: ['Single Phase', 'Three Phase'], sortOrder: 3 }),
        field('capacity', 'Capacity / Output', 'TEXT', { placeholder: 'e.g. 500 kg/hr', sortOrder: 4, isRequired: true }),
        field('dimensions', 'Dimensions (LxWxH)', 'TEXT', { placeholder: 'e.g. 200x150x180 cm', sortOrder: 5 }),
        field('weight', 'Weight', 'TEXT', { placeholder: 'e.g. 2500 kg', sortOrder: 6 }),
        field('material', 'Material', 'TEXT', { placeholder: 'e.g. Mild Steel, Stainless Steel', sortOrder: 7 }),
        field('automation-grade', 'Automation Grade', 'SELECT', { options: ['Manual', 'Semi-Automatic', 'Automatic', 'Fully Automatic', 'CNC', 'PLC Controlled'], sortOrder: 8 }),
        field('warranty', 'Warranty', 'TEXT', { placeholder: 'e.g. 2 years', sortOrder: 9, isRequired: true }),
        field('spec-sheet', 'Detailed Specifications', 'JSON', { sortOrder: 10 }),
      ],
    },
    {
      key: 'pricing', title: 'Pricing', sortOrder: 3, icon: 'dollar-sign',
      fields: [
        field('unit', 'Unit', 'SELECT', { options: ['Unit', 'Set', 'Piece', 'Line', 'System'], sortOrder: 1, isRequired: true }),
        field('price-per-unit', 'Price per Unit', 'PRICE', { sortOrder: 2, isRequired: true }),
        field('currency', 'Currency', 'SELECT', { options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], sortOrder: 3, isRequired: true }),
        field('moq', 'Minimum Order Quantity', 'NUMBER', { sortOrder: 4 }),
        field('installation-cost', 'Installation Cost', 'PRICE', { sortOrder: 5 }),
        field('annual-maintenance', 'Annual Maintenance Cost', 'PRICE', { sortOrder: 6 }),
      ],
    },
    {
      key: 'media', title: 'Images & Videos', sortOrder: 4, icon: 'image',
      fields: [
        field('product-images', 'Product Images', 'IMAGE', { sortOrder: 1, isRequired: true }),
        field('product-videos', 'Product Videos', 'VIDEO', { sortOrder: 2 }),
        field('catalog', 'Product Catalog', 'PDF', { sortOrder: 3 }),
        field('brochure', 'Brochure', 'PDF', { sortOrder: 4 }),
      ],
    },
    {
      key: 'packaging', title: 'Packaging & Shipping', sortOrder: 5, icon: 'package',
      fields: [
        field('packaging-type', 'Packaging Type', 'SELECT', { options: ['Wooden Crate', 'Plywood Box', 'Steel Frame', 'Export Packing', 'Container'], sortOrder: 1 }),
        field('gross-weight', 'Gross Weight', 'TEXT', { sortOrder: 2 }),
        field('shipping-dimensions', 'Shipping Dimensions', 'TEXT', { sortOrder: 3 }),
        field('lead-time', 'Lead Time', 'TEXT', { placeholder: 'e.g. 30-45 days', sortOrder: 4, isRequired: true }),
        field('delivery-eta', 'Delivery ETA', 'TEXT', { sortOrder: 5 }),
        field('shipping-info', 'Shipping Information', 'TEXTAREA', { sortOrder: 6 }),
      ],
    },
    {
      key: 'documents', title: 'Documents & Certifications', sortOrder: 6, icon: 'file-text',
      fields: [
        field('gst-certificate', 'GST Certificate', 'FILE', { sortOrder: 1 }),
        field('iso-certificate', 'ISO Certificate', 'FILE', { sortOrder: 2 }),
        field('ce-certificate', 'CE Certificate', 'FILE', { sortOrder: 3 }),
        field('msds', 'MSDS', 'PDF', { sortOrder: 4 }),
        field('installation-manual', 'Installation Manual', 'PDF', { sortOrder: 5 }),
        field('operation-manual', 'Operation Manual', 'PDF', { sortOrder: 6 }),
      ],
    },
    {
      key: 'near-me', title: 'Near Me', sortOrder: 7, icon: 'map-pin',
      fields: [
        field('latitude', 'Latitude', 'LOCATION', { sortOrder: 1 }),
        field('longitude', 'Longitude', 'LOCATION', { sortOrder: 2 }),
        field('visibility-radius', 'Visibility Radius', 'SELECT', { options: ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'], sortOrder: 3 }),
      ],
    },
    {
      key: 'seo', title: 'SEO', sortOrder: 8, icon: 'search',
      fields: [
        field('seo-title', 'SEO Title', 'TEXT', { sortOrder: 1 }),
        field('seo-description', 'SEO Description', 'TEXTAREA', { sortOrder: 2 }),
        field('seo-keywords', 'SEO Keywords', 'TAGS', { sortOrder: 3 }),
      ],
    },
  ],
};

const CONSTRUCTION_TEMPLATE: TemplateDef = {
  name: 'Construction Materials Template',
  categorySlug: 'construction',
  sections: [
    {
      key: 'basic-information', title: 'Basic Information', sortOrder: 1, icon: 'info',
      fields: [
        field('product-name', 'Product Name', 'TEXT', { isRequired: true, sortOrder: 1 }),
        field('brand', 'Brand', 'TEXT', { sortOrder: 2 }),
        field('short-description', 'Short Description', 'TEXTAREA', { sortOrder: 3 }),
        field('full-description', 'Full Description', 'RICH_TEXT', { sortOrder: 4 }),
        field('hs-code', 'HS Code', 'TEXT', { sortOrder: 5 }),
      ],
    },
    {
      key: 'specifications', title: 'Specifications', sortOrder: 2, icon: 'settings',
      fields: [
        field('material-type', 'Material Type', 'SELECT', { options: ['Cement', 'Steel', 'Brick', 'Tile', 'Stone', 'Wood', 'Glass', 'Insulation', 'Roofing', 'Flooring', 'Plumbing', 'Electrical', 'Paint', 'Fixture', 'Hardware'], sortOrder: 1, isRequired: true }),
        field('grade', 'Grade', 'TEXT', { placeholder: 'e.g. Grade 500, OPC 53', sortOrder: 2 }),
        field('size', 'Size', 'TEXT', { placeholder: 'e.g. 20x20x40 cm', sortOrder: 3 }),
        field('color', 'Color', 'TEXT', { sortOrder: 4 }),
        field('finish', 'Finish', 'TEXT', { sortOrder: 5 }),
        field('strength', 'Strength', 'TEXT', { placeholder: 'e.g. M25, 5000 PSI', sortOrder: 6 }),
        field('weight-density', 'Weight/Density', 'TEXT', { sortOrder: 7 }),
        field('water-resistance', 'Water Resistance', 'TEXT', { sortOrder: 8 }),
        field('fire-rating', 'Fire Rating', 'TEXT', { sortOrder: 9 }),
        field('certifications', 'Certifications', 'MULTI_SELECT', { options: ['ISO 9001', 'BIS', 'ISI', 'CE', 'ASTM', 'BS'], sortOrder: 10 }),
        field('spec-sheet', 'Detailed Spec Sheet', 'JSON', { sortOrder: 11 }),
      ],
    },
    {
      key: 'pricing', title: 'Pricing', sortOrder: 3, icon: 'dollar-sign',
      fields: [
        field('unit', 'Unit', 'SELECT', { options: ['Kg', 'Ton', 'Bag', 'Piece', 'Sq Ft', 'Sq M', 'Box', 'Roll', 'Sheet', 'Bundle', 'Meter'], sortOrder: 1, isRequired: true }),
        field('price-per-unit', 'Price per Unit', 'PRICE', { sortOrder: 2, isRequired: true }),
        field('currency', 'Currency', 'SELECT', { options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], sortOrder: 3, isRequired: true }),
        field('moq', 'Minimum Order Quantity', 'NUMBER', { sortOrder: 4 }),
        field('bulk-pricing', 'Bulk Pricing Tiers', 'JSON', { sortOrder: 5 }),
      ],
    },
    {
      key: 'media', title: 'Images & Videos', sortOrder: 4, icon: 'image',
      fields: [
        field('product-images', 'Product Images', 'IMAGE', { sortOrder: 1, isRequired: true }),
        field('product-videos', 'Product Videos', 'VIDEO', { sortOrder: 2 }),
        field('catalog', 'Product Catalog', 'PDF', { sortOrder: 3 }),
        field('brochure', 'Brochure', 'PDF', { sortOrder: 4 }),
      ],
    },
    {
      key: 'packaging', title: 'Packaging & Shipping', sortOrder: 5, icon: 'package',
      fields: [
        field('packaging-type', 'Packaging Type', 'SELECT', { options: ['Bag', 'Pallet', 'Bundle', 'Roll', 'Box', 'Crate', 'Loose', 'Container'], sortOrder: 1 }),
        field('pack-size', 'Pack Size', 'TEXT', { sortOrder: 2 }),
        field('lead-time', 'Lead Time', 'TEXT', { placeholder: 'e.g. 5-7 days', sortOrder: 3, isRequired: true }),
        field('delivery-eta', 'Delivery ETA', 'TEXT', { sortOrder: 4 }),
        field('shipping-info', 'Shipping Information', 'TEXTAREA', { sortOrder: 5 }),
      ],
    },
    {
      key: 'documents', title: 'Documents & Certifications', sortOrder: 6, icon: 'file-text',
      fields: [
        field('gst-certificate', 'GST Certificate', 'FILE', { sortOrder: 1 }),
        field('iso-certificate', 'ISO Certificate', 'FILE', { sortOrder: 2 }),
        field('bis-certificate', 'BIS/ISI Certificate', 'FILE', { sortOrder: 3 }),
        field('lab-reports', 'Lab Test Reports', 'FILE', { sortOrder: 4 }),
        field('msds', 'MSDS', 'PDF', { sortOrder: 5 }),
      ],
    },
    {
      key: 'near-me', title: 'Near Me', sortOrder: 7, icon: 'map-pin',
      fields: [
        field('latitude', 'Latitude', 'LOCATION', { sortOrder: 1 }),
        field('longitude', 'Longitude', 'LOCATION', { sortOrder: 2 }),
        field('visibility-radius', 'Visibility Radius', 'SELECT', { options: ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'], sortOrder: 3 }),
      ],
    },
    {
      key: 'seo', title: 'SEO', sortOrder: 8, icon: 'search',
      fields: [
        field('seo-title', 'SEO Title', 'TEXT', { sortOrder: 1 }),
        field('seo-description', 'SEO Description', 'TEXTAREA', { sortOrder: 2 }),
        field('seo-keywords', 'SEO Keywords', 'TAGS', { sortOrder: 3 }),
      ],
    },
  ],
};

const TEMPLATES: { slug: string; def: TemplateDef }[] = [
  { slug: 'food-beverage', def: FOOD_TEMPLATE },
  { slug: 'electronics', def: ELECTRONICS_TEMPLATE },
  { slug: 'chemicals', def: CHEMICALS_TEMPLATE },
  { slug: 'machinery', def: MACHINERY_TEMPLATE },
  { slug: 'construction', def: CONSTRUCTION_TEMPLATE },
];

async function createTemplate(adminUserId: string, categorySlug: string, def: TemplateDef) {
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    console.log(`  ⚠ Category with slug "${categorySlug}" not found. Creating category...`);
    const created = await prisma.category.create({
      data: { name: def.name.replace(' Template', ''), slug: categorySlug, sortOrder: 0 },
    });
    console.log(`  ✓ Created category "${created.name}" (${created.id})`);
    const template = await prisma.categoryTemplate.create({
      data: { categoryId: created.id, name: def.name, version: 1, status: 'ACTIVE', createdBy: adminUserId },
    });
    await createSectionsAndFields(template.id, def.sections);
    console.log(`  ✓ Created template "${def.name}" for category "${created.name}"`);
    return;
  }

  const existing = await prisma.categoryTemplate.findFirst({
    where: { categoryId: category.id, status: 'ACTIVE' },
  });
  if (existing) {
    console.log(`  ℹ Template already exists for "${category.name}" (${existing.name} v${existing.version})`);
    return;
  }

  const template = await prisma.categoryTemplate.create({
    data: { categoryId: category.id, name: def.name, version: 1, status: 'ACTIVE', createdBy: adminUserId },
  });
  await createSectionsAndFields(template.id, def.sections);
  console.log(`  ✓ Created template "${def.name}" for category "${category.name}"`);
}

async function createSectionsAndFields(templateId: string, sections: SectionDef[]) {
  for (const section of sections) {
    const created = await prisma.templateSection.create({
      data: {
        templateId,
        key: section.key,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        icon: section.icon,
      },
    });
    for (const field of section.fields) {
      await prisma.templateField.create({
        data: {
          sectionId: created.id,
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder,
          helpText: field.helpText,
          options: field.options ? JSON.parse(JSON.stringify(field.options)) : undefined,
          validation: field.validation ? JSON.parse(JSON.stringify(field.validation)) : undefined,
          sortOrder: field.sortOrder ?? 0,
          isRequired: field.isRequired ?? false,
        },
      });
    }
  }
}

async function main() {
  console.log('\n🌱 Seeding Category Templates...\n');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    const anyUser = await prisma.user.findFirst();
    if (!anyUser) {
      console.log('  ⚠ No users found. Skipping template seed (run main seeder first).');
      return;
    }
    console.log(`  ⚠ No SUPER_ADMIN found. Using user "${anyUser.email}" as fallback.`);
    for (const { slug, def } of TEMPLATES) {
      await createTemplate(anyUser.id, slug, def);
    }
  } else {
    for (const { slug, def } of TEMPLATES) {
      await createTemplate(admin.id, slug, def);
    }
  }

  console.log('\n✅ Template seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
