import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * P0 RFQ funnel contract guards (source-level assertions).
 * Locks the canonical architecture: /buyer/rfq/new -> POST /smart-rfq.
 */
const web = process.cwd().replace(/[\\/]apps[\\/]web$/, '');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

describe('P0 RFQ funnel contract', () => {
  it('buildPayload excludes status and vendorMatches', () => {
    const src = read('apps/web/app/buyer/rfq/new/RfqWizardClient.tsx');
    const fn = src.slice(src.indexOf('const buildPayload'), src.indexOf('const handleSubmit'));
    expect(fn).not.toMatch(/status/);
    expect(fn).not.toMatch(/vendorMatches/);
  });

  it('buildPayload sends canonical identity fields (source/sourceId)', () => {
    const src = read('apps/web/app/buyer/rfq/new/RfqWizardClient.tsx');
    const fn = src.slice(src.indexOf('const buildPayload'), src.indexOf('const handleSubmit'));
    expect(fn).toMatch(/source:\s*s\.source/);
    expect(fn).toMatch(/sourceId:\s*s\.sourceId/);
  });

  it('prefill maps PRODUCT and COMPANY sources with sourceId', () => {
    const src = read('apps/web/app/buyer/rfq/new/RfqWizardClient.tsx');
    expect(src).toMatch(/setSource\(source,\s*sourceId\)/);
    expect(src).toMatch(/'PRODUCT'/);
    expect(src).toMatch(/'COMPANY'/);
    expect(src).toMatch(/addProduct\(/);
  });

  it('product CTAs target canonical route', () => {
    expect(read('apps/web/components/product-detail-view/product-detail-view.tsx'))
      .toContain('/buyer/rfq/new?source=PRODUCT&sourceId=');
    expect(read('apps/web/components/product/product-full-card.tsx'))
      .toContain('/buyer/rfq/new?source=PRODUCT&sourceId=');
    expect(read('apps/web/components/product/use-product-actions.ts'))
      .toContain('/buyer/rfq/new?source=PRODUCT&sourceId=');
  });

  it('company CTAs target canonical route', () => {
    expect(read('apps/web/app/companies/[slug]/CompanyProfileClient.tsx'))
      .toContain('/buyer/rfq/new?source=COMPANY&sourceId=');
    expect(read('apps/web/components/company/company-full-profile-card.tsx'))
      .toContain('/buyer/rfq/new?source=COMPANY&sourceId=');
    expect(read('apps/web/components/discovery/UnifiedCard.tsx'))
      .toContain('/buyer/rfq/new?source=PRODUCT&sourceId=');
  });

  it('legacy pages redirect to canonical flow', () => {
    expect(read('apps/web/app/rfq/new/page.tsx')).toMatch(/redirect\('\/buyer\/rfq\/new'\)/);
    const create = read('apps/web/app/rfq/create/page.tsx');
    expect(create).toMatch(/redirect\(`\/buyer\/rfq\/new/);
    expect(create).toMatch(/COMPANY/);
  });

  it('no /buyer/rfq/create references remain anywhere', () => {
    const targets = [
      'apps/web/components/product-detail-view/product-detail-view.tsx',
      'apps/web/components/product/product-full-card.tsx',
      'apps/web/components/product/use-product-actions.ts',
    ];
    for (const t of targets) expect(read(t)).not.toContain('/buyer/rfq/create');
  });

  it('no /seller/rfq/new live CTA remains in templates use-handler', () => {
    const src = read('apps/web/app/seller/rfqs/templates/page.tsx');
    expect(src).not.toContain("/seller/rfq/new?templateId=");
  });
});
