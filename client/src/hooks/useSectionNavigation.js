import { useCallback, useEffect, useState } from 'react'

function useSectionNavigation({ initialSection, sectionIds, sectionPrefix }) {
  const [activeSection, setActiveSection] = useState(initialSection)

  const navigateToSection = useCallback(
    (sectionId) => {
      setActiveSection(sectionId)
      const section = document.getElementById(`${sectionPrefix}-${sectionId}`)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      section?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    },
    [sectionPrefix],
  )

  useEffect(() => {
    const sections = sectionIds
      .map((sectionId) => ({
        id: sectionId,
        element: document.getElementById(`${sectionPrefix}-${sectionId}`),
      }))
      .filter(({ element }) => element)

    if (!sections.length) return undefined

    const updateActiveSection = () => {
      const activationLine = window.innerWidth <= 1050 ? 150 : 105
      const atPageEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

      if (atPageEnd) {
        setActiveSection(sections.at(-1).id)
        return
      }

      const current = sections.reduce(
        (active, section) =>
          section.element.getBoundingClientRect().top <= activationLine ? section : active,
        sections[0],
      )
      setActiveSection(current.id)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [sectionIds, sectionPrefix])

  return { activeSection, navigateToSection }
}

export default useSectionNavigation
