import { useState, useCallback } from 'react';

export function useSaveToast() {
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return { saved, handleSave };
}
