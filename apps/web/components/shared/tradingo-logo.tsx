import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TradingoLogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
  priority?: boolean;
}

const LOGO_SRC = '/logo/trdn.png';
const ASPECT_RATIO = 792 / 547;

function LogoImage({ height, priority, className }: { height: number; priority?: boolean; className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="TRADINGO"
      height={height}
      width={Math.round(height * ASPECT_RATIO)}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}

export function TradingoLogo({ className, height = 40, showText = true, priority = false }: TradingoLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoImage height={height} priority={priority} />
      {showText && (
        <span className="text-xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
          TRADINGO
        </span>
      )}
    </span>
  );
}

export function TradingoLogoIcon({ className, height = 40, priority }: { className?: string; height?: number; priority?: boolean }) {
  return <LogoImage height={height} priority={priority} className={className} />;
}
