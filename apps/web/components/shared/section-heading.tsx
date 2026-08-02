export function SectionHeading({ kicker, title, id, asH1 }: { kicker: string; title: string; id?: string; asH1?: boolean }) {
  const Heading = asH1 ? 'h1' : 'h2';
  return (
    <div id={id} className="mb-5 scroll-mt-28">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-accent">{kicker}</p>
      <Heading className="mt-1.5 text-2xl font-black leading-tight text-text-primary lg:text-[1.9rem]">
        {title}
      </Heading>
      <div className="mt-3 h-[3px] w-14 rounded-full bg-gradient-to-r from-accent via-accent-amber to-transparent" />
    </div>
  );
}
