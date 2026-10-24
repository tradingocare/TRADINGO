/**
 * Company-profile structured data (pure builders — unit-tested).
 *
 * Rules honoured:
 *  - ONLY real company fields are emitted; every optional field is omitted when
 *    the API does not provide it (no placeholders, no invented facts).
 *  - No personal or tax data is published in structured data (no GSTIN, no
 *    owner/representative names, no contact numbers) — those stay in the UI only.
 *  - Street address is emitted only from real CompanyLocation rows.
 */

const BASE_URL = 'https://tradingo.in';

interface CompanyLocationLike {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
}

export interface CompanyLike {
  name?: string | null;
  logo?: string | null;
  description?: string | null;
  tagline?: string | null;
  website?: string | null;
  establishedYear?: number | string | null;
  city?: string | null;
  state?: string | null;
  locations?: CompanyLocationLike[] | null;
}

/** Real postal address, or undefined when the API provides no address fields. */
export function buildPostalAddress(company: CompanyLike): Record<string, unknown> | undefined {
  const location = (company.locations ?? []).find(Boolean);
  const streetAddress = [location?.addressLine1, location?.addressLine2].filter(Boolean).join(', ');
  const address: Record<string, unknown> = { '@type': 'PostalAddress' };
  if (streetAddress) address.streetAddress = streetAddress;
  const locality = location?.city ?? company.city;
  const region = location?.state ?? company.state;
  if (locality) address.addressLocality = locality;
  if (region) address.addressRegion = region;
  if (location?.pincode) address.postalCode = location.pincode;
  if (location?.country) address.addressCountry = location.country;
  return Object.keys(address).length > 1 ? address : undefined;
}

export function buildCompanyJsonLd(company: CompanyLike, slug: string): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: `${BASE_URL}/companies/${slug}`,
  };

  if (company.logo) jsonLd.logo = company.logo;
  const description = company.tagline?.trim() ? company.tagline : company.description;
  if (description) jsonLd.description = description;
  if (company.website) jsonLd.sameAs = company.website;
  if (company.establishedYear) jsonLd.foundingDate = String(company.establishedYear);

  const address = buildPostalAddress(company);
  if (address) jsonLd.address = address;

  return jsonLd;
}

/** Mirrors the visible breadcrumb (Home → Tradors → company). */
export function buildCompanyBreadcrumbJsonLd(companyName: string, slug: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tradors', item: `${BASE_URL}/companies` },
      { '@type': 'ListItem', position: 3, name: companyName, item: `${BASE_URL}/companies/${slug}` },
    ],
  };
}

/** `</script>`-safe serialization for inline JSON-LD script tags. */
export function serializeJsonLd(jsonLd: Record<string, unknown>): string {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
