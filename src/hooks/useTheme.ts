import { useState, useEffect } from 'react'

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet'

export const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'indigo', name: '靛蓝', color: '#6366f1' },
  { id: 'rose', name: '玫瑰', color: '#f43f5e' },
  { id: 'emerald', name: '翠绿', color: '#10b981' },
  { id: 'amber', name: '琥珀', color: '#f59e0b' },
  { id: 'violet', name: '紫罗兰', color: '#8b5cf6' },
]

export function useTheme() {
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme_color') as ThemeColor) || 'indigo'
    }
    return 'indigo'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_color', themeColor)
      document.documentElement.setAttribute('data-theme', themeColor)
    }
  }, [themeColor])

  return { themeColor, setThemeColor }
}
