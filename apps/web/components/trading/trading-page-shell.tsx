'use client'

import { useEffect, useRef, useState } from 'react'

export default function TradingPageShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [padTop, setPadTop] = useState<number | null>(null)

  useEffect(() => {
    const nav = document.querySelector('.glass-nav')
    const shell = shellRef.current
    if (!shell) return
    const measure = () => {
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0
      const shellTop = shell.getBoundingClientRect().top + window.scrollY
      if (navBottom > 0) setPadTop(Math.max(0, Math.round(navBottom + 20 - shellTop)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (nav) ro.observe(nav)
    ro.observe(shell)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div ref={shellRef} className="pt-16" style={padTop != null ? { paddingTop: padTop } : undefined}>
      {children}
    </div>
  )
}