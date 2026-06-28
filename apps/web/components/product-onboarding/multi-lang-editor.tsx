'use client';

import { useState } from 'react';
import { Plus, X, Languages, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductDraftMultiLangDesc } from '@/lib/product-onboarding/types';
import { INDIAN_LANGUAGES } from '@/data/master-data';

interface MultiLangEditorProps {
  entries: ProductDraftMultiLangDesc[];
  onChange: (entries: ProductDraftMultiLangDesc[]) => void;
  primaryName: string;
}

export function MultiLangEditor({ entries, onChange, primaryName }: MultiLangEditorProps) {
  const [showSelector, setShowSelector] = useState(false);

  const selectedLocales = entries.map((e) => e.locale);
  const available = INDIAN_LANGUAGES.filter((l) => !selectedLocales.includes(l.locale));

  const addLanguage = (locale: string) => {
    setShowSelector(false);
    const isPrimary = entries.length === 0;
    const newEntry: ProductDraftMultiLangDesc = {
      id: '',
      draftId: '',
      locale,
      name: '',
      shortDescription: '',
      description: '',
      isPrimary,
    };
    onChange([...entries, newEntry]);
  };

  const removeLanguage = (locale: string) => {
    onChange(entries.filter((e) => e.locale !== locale));
  };

  const updateEntry = (locale: string, field: keyof ProductDraftMultiLangDesc, value: any) => {
    onChange(
      entries.map((e) => (e.locale === locale ? { ...e, [field]: value } : e)),
    );
  };

  const setPrimary = (locale: string) => {
    onChange(
      entries.map((e) => ({ ...e, isPrimary: e.locale === locale })),
    );
  };

  const getLanguageName = (locale: string) =>
    INDIAN_LANGUAGES.find((l) => l.locale === locale)?.name || locale;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Multi-Language Descriptions</Label>
          <p className="text-xs text-text-tertiary">
            Add product descriptions in Indian regional languages.
          </p>
        </div>
        {available.length > 0 && (
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSelector(!showSelector)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Language
            </Button>
            {showSelector && (
              <div className="absolute right-0 top-full z-10 mt-1 max-h-60 w-44 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                {available.map((lang) => (
                  <button
                    key={lang.locale}
                    type="button"
                    onClick={() => addLanguage(lang.locale)}
                    className="w-full rounded-md px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-10 text-center dark:border-dark-border dark:bg-dark-surface-secondary">
          <Languages className="mb-2 h-8 w-8 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">
            No languages added yet. Add regional language descriptions to reach more buyers.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => {
          const langName = getLanguageName(entry.locale);
          return (
            <div
              key={entry.locale}
              className={cn(
                'rounded-xl border p-5 transition-all',
                entry.isPrimary
                  ? 'border-primary-300 bg-primary-500/5 dark:border-primary-700 dark:bg-primary-500/10'
                  : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface',
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                    {langName}
                  </span>
                  {entry.isPrimary && (
                    <Badge variant="default" className="text-[10px]">
                      <Star className="mr-0.5 h-3 w-3" />
                      Primary
                    </Badge>
                  )}
                  {!entry.isPrimary && entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimary(entry.locale)}
                      className="rounded px-1.5 py-0.5 text-[10px] text-text-tertiary hover:bg-surface-secondary hover:text-text-primary dark:hover:bg-dark-surface-secondary"
                    >
                      Set as primary
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(entry.locale)}
                  className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${entry.locale}`}>
                    Product Name ({langName})
                  </Label>
                  <Input
                    id={`name-${entry.locale}`}
                    value={entry.name || ''}
                    onChange={(e) => updateEntry(entry.locale, 'name', e.target.value)}
                    placeholder={entry.isPrimary ? primaryName || 'Product name' : `Enter name in ${langName}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`short-${entry.locale}`}>
                    Short Description ({langName})
                  </Label>
                  <Textarea
                    id={`short-${entry.locale}`}
                    value={entry.shortDescription || ''}
                    onChange={(e) => updateEntry(entry.locale, 'shortDescription', e.target.value)}
                    placeholder="A brief description (1-2 lines)"
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`desc-${entry.locale}`}>
                    Full Description ({langName})
                  </Label>
                  <Textarea
                    id={`desc-${entry.locale}`}
                    value={entry.description || ''}
                    onChange={(e) => updateEntry(entry.locale, 'description', e.target.value)}
                    placeholder="Detailed product description"
                    rows={5}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
