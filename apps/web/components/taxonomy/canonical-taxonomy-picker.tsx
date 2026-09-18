'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  marketplaceCatalogBridgeApi,
  type SubcategoryItem,
} from '@/lib/api/marketplace-catalog-bridge';

export interface CanonicalTripleSelection {
  categoryId: string | null;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string;
  catalogItemId: string | null;
  catalogItemName: string;
}

export const EMPTY_CANONICAL_SELECTION: CanonicalTripleSelection = {
  categoryId: null,
  categoryName: '',
  subcategoryId: null,
  subcategoryName: '',
  catalogItemId: null,
  catalogItemName: '',
};

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; categoryId: string; name: string; slug: string; itemCount: number }[];
}

interface CanonicalTaxonomyPickerProps {
  value: CanonicalTripleSelection;
  onChange: (sel: CanonicalTripleSelection) => void;
  idPrefix?: string;
  disabled?: boolean;
}

let treeCache: Promise<CategoryNode[]> | null = null;

/** Test-only hook: specs reset the session tree cache between cases. */
export function resetCanonicalTreeCacheForTesting() {
  treeCache = null;
}

function loadCanonicalCategories(): Promise<CategoryNode[]> {
  if (!treeCache) {
    treeCache = marketplaceCatalogBridgeApi
      .getEnrichedTree()
      .then((res) => (res?.catalogTree || []) as CategoryNode[])
      .catch(() => {
        treeCache = null;
        throw new Error('Failed to load categories');
      });
  }
  return treeCache;
}

function pathLabel(sel: CanonicalTripleSelection): string {
  return [sel.categoryName, sel.subcategoryName, sel.catalogItemName].filter(Boolean).join(' / ');
}

/**
 * F-07 shared canonical cascade picker (Category → Subcategory → Catalog Item).
 * Controlled: identity is always canonical IDs, never display names.
 * Changing a parent clears incompatible descendants and reports the cleared
 * triple via onChange (stale IDs can never linger). Partial selection is
 * allowed — the parent decides whether to require completion.
 */
export function CanonicalTaxonomyPicker({ value, onChange, idPrefix = 'ctp', disabled }: CanonicalTaxonomyPickerProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [items, setItems] = useState<SubcategoryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsPage, setItemsPage] = useState(1);
  const requestRef = useRef(0);
  const loadedItemsForRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadCanonicalCategories()
      .then((list) => {
        if (cancelled) return;
        setCategories(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Could not load categories. Please retry.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subcategories = useMemo(
    () => categories.find((c) => c.id === value.categoryId)?.subcategories || [],
    [categories, value.categoryId],
  );

  // Duplicate display names are detected GLOBALLY (across all parents), not
  // just within the current level — otherwise "Coils" under Steel vs Paper
  // would render identically and recreate the F-06 ambiguity in the UI.
  const subcategoryNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of categories) {
      for (const s of c.subcategories || []) {
        const key = s.name.trim().toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return counts;
  }, [categories]);

  // Hydrate display names when the parent supplies IDs without labels
  // (draft restore, AI-Confirm writes). Runs only while a label is empty
  // and matching data is loaded, so it can never loop.
  useEffect(() => {
    if (value.categoryId && !value.categoryName) {
      const node = categories.find((c) => c.id === value.categoryId);
      if (node) {
        onChange({ ...value, categoryName: node.name });
        return;
      }
    }
    if (value.subcategoryId && !value.subcategoryName) {
      const node = subcategories.find((s) => s.id === value.subcategoryId);
      if (node) {
        onChange({ ...value, subcategoryName: node.name });
        return;
      }
    }
    if (value.catalogItemId && !value.catalogItemName) {
      const item = items.find((i) => i.id === value.catalogItemId);
      if (item) onChange({ ...value, catalogItemName: item.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, subcategories, items, value.categoryId, value.subcategoryId, value.catalogItemId, value.categoryName, value.subcategoryName, value.catalogItemName]);

  // Load items for a preset subcategory (draft restore) that this picker
  // instance has not fetched yet. User-driven loads go through handleSubcategory.
  useEffect(() => {
    if (value.subcategoryId && loadedItemsForRef.current !== value.subcategoryId && !itemsLoading) {
      loadItems(value.subcategoryId, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.subcategoryId]);

  // Duplicate display names across different parents get a parent-context
  // suffix so two identical labels are never ambiguous in the dropdown.
  const categoryLabel = (node: CategoryNode, all: CategoryNode[]) =>
    all.some((o) => o.id !== node.id && o.name.trim().toLowerCase() === node.name.trim().toLowerCase())
      ? `${node.name} (${node.slug})`
      : node.name;
  const subcategoryLabel = (node: { id: string; name: string }, parentName: string) =>
    (subcategoryNameCounts.get(node.name.trim().toLowerCase()) || 0) > 1
      ? `${parentName} / ${node.name}`
      : node.name;

  const itemLabel = (item: SubcategoryItem, siblings: SubcategoryItem[]) =>
    siblings.some((o) => o.id !== item.id && o.name.trim().toLowerCase() === item.name.trim().toLowerCase())
      ? `${item.name} (${item.slug})`
      : item.name;

  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, catSearch]);

  const filteredSubcategories = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    if (!q) return subcategories;
    return subcategories.filter((s) => s.name.toLowerCase().includes(q));
  }, [subcategories, subSearch]);

  const loadItems = (subcategoryId: string, page: number, append: boolean) => {
    const requestId = ++requestRef.current;
    setItemsLoading(true);
    setItemsError(null);
    marketplaceCatalogBridgeApi
      .listSubcategoryItems(subcategoryId, page, 50)
      .then((res) => {
        if (requestRef.current !== requestId) return;
        loadedItemsForRef.current = subcategoryId;
        setItems((prev) => (append ? [...prev, ...(res?.data || [])] : res?.data || []));
        setItemsTotal(res?.meta?.total || 0);
        setItemsPage(res?.meta?.page || page);
        setItemsLoading(false);
      })
      .catch(() => {
        if (requestRef.current !== requestId) return;
        setItemsError('Could not load items. Please retry.');
        setItemsLoading(false);
      });
  };

  const handleCategory = (categoryId: string) => {
    const node = categories.find((c) => c.id === categoryId) || null;
    setSubSearch('');
    setItemSearch('');
    setItems([]);
    setItemsTotal(0);
    setItemsPage(1);
    setItemsError(null);
    loadedItemsForRef.current = null;
    onChange({
      ...EMPTY_CANONICAL_SELECTION,
      categoryId: node?.id || null,
      categoryName: node?.name || '',
    });
  };

  const handleSubcategory = (subcategoryId: string) => {
    const node = subcategories.find((s) => s.id === subcategoryId) || null;
    setItemSearch('');
    onChange({
      categoryId: value.categoryId,
      categoryName: value.categoryName,
      subcategoryId: node?.id || null,
      subcategoryName: node?.name || '',
      catalogItemId: null,
      catalogItemName: '',
    });
    if (node?.id) loadItems(node.id, 1, false);
    else {
      setItems([]);
      setItemsTotal(0);
    }
  };

  const handleItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId) || null;
    onChange({ ...value, catalogItemId: item?.id || null, catalogItemName: item?.name || '' });
  };

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  const retryTree = () => {
    treeCache = null;
    setLoading(true);
    setLoadError(null);
    loadCanonicalCategories()
      .then((list) => {
        setCategories(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Could not load categories. Please retry.');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading categories">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        variant="error"
        title="Categories unavailable"
        description={loadError}
        action={
          <button
            type="button"
            className="rounded-lg bg-accent-500 px-4 py-2 text-xs font-semibold text-black hover:bg-accent-500/80"
            onClick={retryTree}
          >
            Retry
          </button>
        }
      />
    );
  }

  const selectedPath = pathLabel(value);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Input
          value={catSearch}
          onChange={(e) => setCatSearch(e.target.value)}
          placeholder="Search categories..."
          disabled={disabled}
          aria-label="Search categories"
        />
        <div className="mt-2">
          <Select
            id={`${idPrefix}-category`}
            value={value.categoryId || ''}
            onChange={(e) => handleCategory(e.target.value)}
            disabled={disabled}
            aria-label="Category"
          >
            <option value="">Select category</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c, categories)}
              </option>
            ))}
          </Select>
        </div>
        {filteredCategories.length === 0 && (
          <p className="mt-1 text-xs text-text-tertiary">No matching categories. Try a different search.</p>
        )}
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-subcategory`}>Subcategory</Label>
        <Input
          value={subSearch}
          onChange={(e) => setSubSearch(e.target.value)}
          placeholder={value.categoryId ? 'Search subcategories...' : 'Select a category first'}
          disabled={disabled || !value.categoryId}
          aria-label="Search subcategories"
        />
        <div className="mt-2">
          <Select
            id={`${idPrefix}-subcategory`}
            value={value.subcategoryId || ''}
            onChange={(e) => handleSubcategory(e.target.value)}
            disabled={disabled || !value.categoryId}
            aria-label="Subcategory"
          >
            <option value="">Select subcategory</option>
            {filteredSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {subcategoryLabel(s, value.categoryName)}
              </option>
            ))}
          </Select>
        </div>
        {value.categoryId && filteredSubcategories.length === 0 && (
          <p className="mt-1 text-xs text-text-tertiary">No matching subcategories. Try a different search.</p>
        )}
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-item`}>Catalog Item</Label>
        <Input
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder={value.subcategoryId ? 'Search items...' : 'Select a subcategory first'}
          disabled={disabled || !value.subcategoryId}
          aria-label="Search catalog items"
        />
        <div className="mt-2">
          <Select
            id={`${idPrefix}-item`}
            value={value.catalogItemId || ''}
            onChange={(e) => handleItem(e.target.value)}
            disabled={disabled || !value.subcategoryId || itemsLoading}
            aria-label="Catalog item"
          >
            <option value="">Select item</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>
                {itemLabel(i, filteredItems)}
              </option>
            ))}
          </Select>
        </div>
        {itemsLoading && <p className="mt-1 text-xs text-text-tertiary">Loading items…</p>}
        {itemsError && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-red-500">{itemsError}</p>
            <button
              type="button"
              className="text-xs font-medium text-accent-500 hover:underline"
              onClick={() => value.subcategoryId && loadItems(value.subcategoryId, 1, false)}
            >
              Retry
            </button>
          </div>
        )}
        {!itemsLoading && !itemsError && value.subcategoryId && filteredItems.length === 0 && (
          <p className="mt-1 text-xs text-text-tertiary">No matching items. You can continue without an item.</p>
        )}
        {!itemsLoading && !itemsError && items.length < itemsTotal && (
          <button
            type="button"
            className="mt-1 text-xs font-medium text-accent-500 hover:underline"
            onClick={() => value.subcategoryId && loadItems(value.subcategoryId, itemsPage + 1, true)}
          >
            Load more items ({items.length} of {itemsTotal})
          </button>
        )}
      </div>

      {selectedPath && (
        <div className="flex flex-wrap items-center gap-2" aria-live="polite" aria-label="Selected taxonomy">
          {[
            value.categoryName,
            value.subcategoryName,
            value.catalogItemName,
          ]
            .filter(Boolean)
            .map((part) => (
              <span
                key={part}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-text-primary"
                style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                {part}
              </span>
            ))}
          <button
            type="button"
            className="text-xs font-medium text-text-tertiary hover:text-text-secondary"
            onClick={() => {
              setCatSearch('');
              setSubSearch('');
              setItemSearch('');
              setItems([]);
              setItemsTotal(0);
              loadedItemsForRef.current = null;
              onChange({ ...EMPTY_CANONICAL_SELECTION });
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
