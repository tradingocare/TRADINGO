'use client'
import { useEffect, useRef } from 'react'

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  theme?: 'light' | 'dark'
}

export function TurnstileWidget({ onToken, theme = 'dark' }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!(window as any).turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
      script.onload = () => renderWidget()
    } else {
      renderWidget()
    }
    return () => {
      if (widgetId.current && (window as any).turnstile) {
        ;(window as any).turnstile.remove(widgetId.current)
      }
    }
  }, [])

  function renderWidget() {
    if (!containerRef.current || !(window as any).turnstile) return
    widgetId.current = (window as any).turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
      callback: (token: string) => onToken(token),
      theme,
    })
  }

  return <div ref={containerRef} />
}
