import { type RefObject, useEffect } from 'react'

/** Всплывающее окно шапки — под кнопкой, по правому краю, как placeHeaderPopover прототипа. */
export function popoverPlace(trigger: HTMLElement) {
  const r = trigger.getBoundingClientRect()
  return {
    top: r.bottom + 6,
    right: Math.max(12, window.innerWidth - r.right),
    maxHeight: Math.max(80, window.innerHeight - r.bottom - 18),
  }
}

/** Закрыть всплывающее по щелчку мимо и по Esc. */
export function useDismiss(
  open: boolean,
  close: () => void,
  ...inside: RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (inside.some((r) => r.current?.contains(e.target as Node))) return
      close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  })
}
