import { useLayoutEffect, useRef } from 'react'

const ACTIVE = '.nav-btn:is(.active, [aria-current="page"])'

/** Подсветка выбранного пункта меню перетекает к новому пункту: передний край идёт первым
 *  и быстрее, задний догоняет (характер движения — из видео владельца, 31.10.2026). Вид — её:
 *  тот же фон и полоска слева, что у выбранного пункта (crm-motion.css), только отдельным
 *  слоем под пунктами. Быстрые переключения не копятся: переход начинается с текущего места. */
export function useNavIndicator() {
  const nav = useRef<HTMLElement>(null) // <nav> меню
  const mark = useRef<HTMLSpanElement>(null) // бегунок — первый, пустой элемент в <nav>
  useLayoutEffect(() => {
    const box = nav.current
    const el = mark.current
    if (!box || !el) return
    let last: { top: number; left: number } | null = null
    const place = () => {
      const active = box.querySelector<HTMLElement>(ACTIVE)
      if (!active || !active.offsetHeight) {
        el.hidden = true
        last = null // меню скрыто (телефон) — при показе встать на место без перехода
        return
      }
      const top = active.offsetTop
      const left = active.offsetLeft
      // первый показ и смена ширины меню — без перехода, иначе бегунок «едет» из угла
      el.dataset.dir =
        last && last.left === left
          ? top > last.top
            ? 'down'
            : top < last.top
              ? 'up'
              : (el.dataset.dir ?? '')
          : ''
      el.hidden = false
      el.style.top = `${top}px`
      el.style.bottom = `${box.clientHeight - top - active.offsetHeight}px`
      el.style.left = `${left}px`
      el.style.width = `${active.offsetWidth}px`
      last = { top, left }
    }
    place()
    box.classList.add('has-indicator')
    const changes = new MutationObserver(place)
    changes.observe(box, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'aria-current'],
    })
    const sizes = new ResizeObserver(place)
    sizes.observe(box)
    return () => {
      changes.disconnect()
      sizes.disconnect()
      box.classList.remove('has-indicator')
    }
  }, [])
  return { nav, mark }
}
