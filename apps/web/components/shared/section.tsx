import type { ReactNode } from 'react';

/**
 * Standard marketing section shell (server-safe) — full-bleed top border,
 * edge padding, centered narrow content column. Replaces the per-page
 * duplicated `border-t border-border px-4 py-20 sm:py-24` + `mx-auto
 * max-w-6xl` wrappers that previously lived in TradeServ / TradeTalk.
 *
 * `innerClassName` REPLACES the default entirely (no merge) — pass complete
 * classes such as `container-narrow`, `mx-auto max-w-4xl`, etc. Default
 * `container-narrow` (1152px, no padding) is geometry-identical to the
 * legacy `mx-auto max-w-6xl` usage.
 */
export function Section({
  id,
  children,
  className,
  innerClassName = 'container-narrow',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section id={id} className={`border-t border-border px-4 py-20 sm:py-24 ${className ?? ''}`.trim()}>
      <div className={innerClassName}>{children}</div>
    </section>
  );
}