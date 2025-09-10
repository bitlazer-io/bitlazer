import { I18nextProvider } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import '@locales/index'
import i18n from '@locales/index'
import 'react-toastify/dist/ReactToastify.css'
import { PriceProvider } from './providers/PriceProvider'

// Web3
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './web3/config'

// 0. Setup queryClient
const queryClient = new QueryClient()

// End of Web3

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <PriceProvider>
            <RouterProvider router={router} />

            <ToastContainer
              autoClose={false}
              position={'top-right'}
              theme="dark"
              hideProgressBar={true}
              newestOnTop={false}
              closeOnClick={false}
              closeButton={true}
              style={{
                zIndex: 9999,
                top: '1rem',
                right: '1rem',
                width: 'auto',
                maxWidth: 'calc(100vw - 2rem)',
              }}
            />
          </PriceProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </I18nextProvider>
  )
}

export default App
