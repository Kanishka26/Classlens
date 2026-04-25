import { useContext, useEffect } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

export default function BackgroundVideo() {
  const { theme } = useContext(ThemeContext)

  useEffect(() => {
    // Remove any existing background
    const existingBg = document.getElementById('classlens-bg-image')
    if (existingBg) existingBg.remove()

    const imageSrc = theme === 'dark' 
      ? '/assets/darkmode.png' 
      : '/assets/lightmode.png'

    // Create image element
    const img = document.createElement('img')
    img.id = 'classlens-bg-image'
    img.src = imageSrc
    
    Object.assign(img.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      objectFit: 'cover',
      zIndex: '-999',
      opacity: '0.85',
      filter: 'blur(2px)',
      pointerEvents: 'none',
    })

    // Add event listeners
    img.addEventListener('load', () => console.log('🖼️ Background image loaded'))
    img.addEventListener('error', (e) => {
      console.error('❌ Image error:', imageSrc, e)
    })

    // Now set the src
    console.log('Setting background image to:', imageSrc)

    // Insert into body
    document.body.insertBefore(img, document.body.firstChild)
    console.log('✅ Background image inserted into DOM')

    return () => {
      const img = document.getElementById('classlens-bg-image')
      if (img) img.remove()
    }
  }, [theme])

  return null
}
