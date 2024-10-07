import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import NotFoundPage from '@pages/NotFoundPage'
import IndexPage from '@pages/IndexPage'
import { MainLayout } from '@layouts/index'
import ConnectWalletPage from '@pages/ConnectWalletPage'
import BridgePage from '@pages/BridgePage'
import RoadmapPage from '@pages/RoadmapPage'
import FeaturesPage from '@pages/FeaturesPage'
import HowItWorksPage from '@pages/HowItWorksPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<MainLayout />}>
        <Route element={<IndexPage />} path="/" />
        <Route element={<ConnectWalletPage />} path="/connect-wallet" />
        <Route element={<BridgePage />} path="/bridge" />
        <Route element={<RoadmapPage />} path="/roadmap" />
        <Route element={<FeaturesPage />} path="/features" />
        <Route element={<HowItWorksPage />} path="/how-it-works" />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)
