// Мелкие помощники оформления, общие для окон сотрудников.

/** Флажок вида «свёрнуто/развёрнуто» в памяти браузера. Память может быть недоступна
 *  (приватное окно) — тогда берём значение по умолчанию. */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value === 'on'
  } catch {
    return fallback
  }
}

export function saveFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? 'on' : 'off')
  } catch {
    // см. readFlag
  }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
