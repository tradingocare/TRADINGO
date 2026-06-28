/* ═══════════════════════════════════════════════════════════════
   RECOVERY: components/shared/tradingo-logo.tsx
   Source: Copy from working tree (already has light prop)
   Confidence: HIGH — preserved from corruption
   Action: Keep as-is (one new prop added: light)
   ═══════════════════════════════════════════════════════════════

   Changes from HEAD commit 2053d85:
   1. Added `light?: boolean` to TradingoLogoProps interface
   2. Added `light = false` to function signature destructuring
   3. Conditional text color: light ? 'text-white' : 'text-text-primary dark:text-dark-text-primary'
*/

/*
=== FULL FILE CONTENT (current working tree) ===

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TradingoLogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
  priority?: boolean;
  light?: boolean;
}

const LOGO_SRC = '/logo/trdn.png';

function LogoImage({ height, priority, className }: { height: number; priority?: boolean; className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="TRADINGO"
      width={height * 1.45}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
      style={{ width: 'auto', height: `${height}px` }}
    />
  );
}

export function TradingoLogo({ className, height = 40, showText = true, priority = false, light = false }: TradingoLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoImage height={height} priority={priority} />
      {showText && (
        <span className={cn(
          'text-xl font-bold tracking-tight',
          light
            ? 'text-white'
            : 'text-text-primary dark:text-dark-text-primary'
        )}>
          TRADINGO
        </span>
      )}
    </span>
  );
}
*/
