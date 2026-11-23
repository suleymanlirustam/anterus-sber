import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'

// Общие для окон сотрудников типы и помощники — только то, что нужно окну врача.

export type Person = { id: string; full_name: string }

/** Текст ошибки сервера сотруднику: сервер сам пишет по-русски, что не так. */
export function errorText(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (!error.response) return 'Нет связи с сервером.'
  }
  return 'Что-то пошло не так, попробуйте ещё раз.'
}

export const isUnauthorized = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 401

/** «Выйти». В этой копии входа нет — просто перезагружает страницу. */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      window.location.reload()
    },
  })
}
