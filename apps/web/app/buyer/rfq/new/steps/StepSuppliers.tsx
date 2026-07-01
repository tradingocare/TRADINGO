'use client';

import { useState } from 'react';
import { useRfqWizardStore, type WizardSupplier } from '@/store/rfq-wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Store, UserPlus, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export function StepSuppliers() {
  const { suppliers, addSuppliers, toggleSupplier } = useRfqWizardStore();
  const [search, setSearch] = useState('');
  const [showSuggested, setShowSuggested] = useState(suppliers.length === 0);
  const [loading, setLoading] = useState(false);

  const allSuppliers = suppliers;
  const filtered = allSuppliers.filter((s) =>
    s.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLoadSuggested = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/smart-rfq/suppliers/suggested', { params: { limit: 10 } });
      const suggested: WizardSupplier[] = (res.data?.data || res.data || []).map((s: any) => ({
        companyId: s.companyId || s.id,
        companyName: s.companyName || s.name,
        matchScore: s.matchScore || s.score || 0,
        selected: false,
      }));
      if (suggested.length > 0) {
        addSuppliers(suggested);
      }
    } catch {
      // silently fail — suppliers step can proceed without suggestions
    } finally {
      setLoading(false);
      setShowSuggested(true);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Suppliers</h2>

      {suppliers.length === 0 && !showSuggested ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] p-8 text-center">
          <Store className="h-8 w-8 text-white/30" />
          <p className="mt-2 text-sm text-white/60">Suggested suppliers from Near To Far™ will appear here</p>
          <Button variant="accent" size="sm" className="mt-4" onClick={handleLoadSuggested} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {loading ? 'Loading...' : 'Load Suggested Suppliers'}
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((s) => {
              const selected = suppliers.find((sp) => sp.companyId === s.companyId)?.selected ?? false;
              const matchScore = s.matchScore;
              return (
                <div
                  key={s.companyId}
                  onClick={() => toggleSupplier(s.companyId)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selected ? 'border-orange-500/40 bg-orange-500/10' : 'border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    selected ? 'bg-orange-500 text-white' : 'bg-white/[0.06] text-white/60'
                  }`}>
                    {selected ? '✓' : s.companyName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{s.companyName}</p>
                    <div className="flex gap-2 mt-1">
                      {matchScore && (
                        <Badge variant={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'warning' : 'secondary'}>
                          {matchScore}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  {matchScore && (
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <div className={`h-2 w-12 rounded-full bg-white/[0.06] overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${matchScore >= 80 ? 'bg-green-500' : matchScore >= 60 ? 'bg-amber-500' : 'bg-orange-500'}`}
                          style={{ width: `${matchScore}%` }}
                        />
                      </div>
                      {matchScore}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/40">
            {suppliers.filter((s) => s.selected).length} supplier(s) selected
          </p>
        </>
      )}
    </div>
  );
}
