import { useContext, useEffect } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

export default function ThemeWrapper({ children }) {
  const { theme } = useContext(ThemeContext)

  const isDark = theme === 'dark'

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }, [isDark])

  return <>{children}</>
}
