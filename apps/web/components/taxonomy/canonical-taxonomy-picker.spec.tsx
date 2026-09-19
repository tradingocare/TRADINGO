import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  CanonicalTaxonomyPicker,
  EMPTY_CANONICAL_SELECTION,
  resetCanonicalTreeCacheForTesting,
  type CanonicalTripleSelection,
} from './canonical-taxonomy-picker';
import { marketplaceCatalogBridgeApi } from '@/lib/api/marketplace-catalog-bridge';

jest.mock('@/lib/api/marketplace-catalog-bridge', () => ({
  marketplaceCatalogBridgeApi: {
    getEnrichedTree: jest.fn(),
    listSubcategoryItems: jest.fn(),
  },
}));

const mockedApi = marketplaceCatalogBridgeApi as unknown as {
  getEnrichedTree: jest.Mock;
  listSubcategoryItems: jest.Mock;
};

const TREE = {
  roots: [],
  catalogTree: [
    {
      id: 'cc-steel',
      name: 'Steel & Metals',
      slug: 'steel-metals',
      description: null,
      isActive: true,
      sortOrder: 1,
      subcategories: [
        { id: 'cs-pipes', categoryId: 'cc-steel', name: 'Steel Pipes', slug: 'steel-pipes', itemCount: 2 },
        { id: 'cs-coils', categoryId: 'cc-steel', name: 'Coils', slug: 'coils', itemCount: 1 },
      ],
    },
    {
      id: 'cc-paper',
      name: 'Paper',
      slug: 'paper',
      description: null,
      isActive: true,
      sortOrder: 2,
      subcategories: [
        { id: 'cs-paper-coils', categoryId: 'cc-paper', name: 'Coils', slug: 'paper-coils', itemCount: 0 },
      ],
    },
  ],
};

const ITEMS = {
  data: [
    { id: 'ci-1', name: 'MS Pipes', slug: 'ms-pipes', type: 'Product' },
    { id: 'ci-2', name: 'GI Pipes', slug: 'gi-pipes', type: 'Product' },
  ],
  meta: { total: 2, page: 1, limit: 50, subcategoryId: 'cs-pipes', categoryId: 'cc-steel' },
};

function renderPicker(
  { onChange = jest.fn(), initial = { ...EMPTY_CANONICAL_SELECTION } }: { onChange?: jest.Mock; initial?: CanonicalTripleSelection } = {},
) {
  function Harness() {
    const [value, setValue] = useState<CanonicalTripleSelection>(initial);
    return (
      <CanonicalTaxonomyPicker
        value={value}
        onChange={(sel) => {
          setValue(sel);
          onChange(sel);
        }}
        idPrefix="t"
      />
    );
  }
  const utils = render(<Harness />);
  return { ...utils, onChange };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetCanonicalTreeCacheForTesting();
  mockedApi.getEnrichedTree.mockResolvedValue(TREE);
  mockedApi.listSubcategoryItems.mockResolvedValue(ITEMS);
});

describe('CanonicalTaxonomyPicker (F-07)', () => {
  it('loads categories and enables the cascade step by step', async () => {
    const { onChange } = renderPicker();

    expect(screen.getByLabelText('Loading categories')).toBeInTheDocument();
    const category = await screen.findByLabelText('Category');
    expect(category).toBeEnabled();
    expect(screen.getByLabelText('Subcategory')).toBeDisabled();
    expect(screen.getByLabelText('Catalog item')).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selecting a category enables subcategories and reports the pick', async () => {
    const { onChange } = renderPicker();
    const category = await screen.findByLabelText('Category');

    fireEvent.change(category, { target: { value: 'cc-steel' } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'cc-steel',
      categoryName: 'Steel & Metals',
      subcategoryId: null,
      catalogItemId: null,
    })));
    expect(screen.getByLabelText('Subcategory')).toBeEnabled();
  });

  it('selecting a subcategory loads items and reports the full triple', async () => {
    const { onChange } = renderPicker();
    fireEvent.change(await screen.findByLabelText('Category'), { target: { value: 'cc-steel' } });
    fireEvent.change(await screen.findByLabelText('Subcategory'), { target: { value: 'cs-pipes' } });

    await waitFor(() => expect(mockedApi.listSubcategoryItems).toHaveBeenCalledWith('cs-pipes', 1, 50));
    fireEvent.change(await screen.findByLabelText('Catalog item'), { target: { value: 'ci-1' } });

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      categoryId: 'cc-steel',
      subcategoryId: 'cs-pipes',
      catalogItemId: 'ci-1',
      catalogItemName: 'MS Pipes',
    })));
  });

  it('changing the category clears incompatible descendants (no stale IDs)', async () => {
    const { onChange } = renderPicker();
    fireEvent.change(await screen.findByLabelText('Category'), { target: { value: 'cc-steel' } });
    fireEvent.change(await screen.findByLabelText('Subcategory'), { target: { value: 'cs-pipes' } });
    fireEvent.change(await screen.findByLabelText('Catalog item'), { target: { value: 'ci-1' } });

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'cc-paper' } });

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      categoryId: 'cc-paper',
      subcategoryId: null,
      catalogItemId: null,
    })));
    expect(mockedApi.listSubcategoryItems).toHaveBeenCalledTimes(1);
  });

  it('filters categories by search text', async () => {
    renderPicker();
    const category = await screen.findByLabelText('Category');

    fireEvent.change(screen.getByLabelText('Search categories'), { target: { value: 'paper' } });

    expect(category.querySelectorAll('option')).toHaveLength(2); // placeholder + Paper
    expect(screen.queryByText('Steel & Metals')).not.toBeInTheDocument();
  });

  it('disambiguates duplicate subcategory names with parent context', async () => {
    renderPicker();
    fireEvent.change(await screen.findByLabelText('Category'), { target: { value: 'cc-steel' } });

    // "Coils" exists under both Steel & Metals and Paper — the Steel one must
    // carry its parent path so the two are never confused.
    await waitFor(() => expect(screen.getByText('Steel & Metals / Coils')).toBeInTheDocument());
  });

  it('shows an error with retry when the tree fails to load', async () => {
    mockedApi.getEnrichedTree.mockRejectedValueOnce(new Error('down'));
    renderPicker();

    expect(await screen.findByText('Categories unavailable')).toBeInTheDocument();
    mockedApi.getEnrichedTree.mockResolvedValueOnce(TREE);
    fireEvent.click(screen.getByText('Retry'));

    expect(await screen.findByLabelText('Category')).toBeEnabled();
  });

  it('Clear resets the whole selection', async () => {
    const { onChange } = renderPicker({
      initial: {
        ...EMPTY_CANONICAL_SELECTION,
        categoryId: 'cc-steel',
        categoryName: 'Steel & Metals',
      },
    });

    fireEvent.click(await screen.findByText('Clear'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(EMPTY_CANONICAL_SELECTION));
  });

  it('hydrates display names for preset IDs (draft restore)', async () => {
    const { onChange } = renderPicker({
      initial: {
        categoryId: 'cc-steel',
        categoryName: '',
        subcategoryId: 'cs-pipes',
        subcategoryName: '',
        catalogItemId: 'ci-2',
        catalogItemName: '',
      },
    });

    await waitFor(() => expect(mockedApi.listSubcategoryItems).toHaveBeenCalledWith('cs-pipes', 1, 50));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      categoryName: 'Steel & Metals',
      subcategoryName: 'Steel Pipes',
      catalogItemName: 'GI Pipes',
    })));
  });
});
