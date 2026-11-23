import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { DoctorShell } from '@/doctor/shell'
import { errorText } from '@/reception/api'
import '@/reception/reception.css'
import { Toaster, toast } from 'sonner'

// Окно врача на заглушке сервера (mock/): вход не нужен, врач выдуманный.
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.silent) toast.error(errorText(error))
    },
  }),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DoctorShell me={{ id: 'demo', full_name: 'Пробная Вера Сергеевна' }} />
      <Toaster position='top-center' />
    </QueryClientProvider>
  </StrictMode>
)
