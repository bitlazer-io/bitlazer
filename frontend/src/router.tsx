import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom'
import NotFoundPage from '@pages/NotFoundPage'
import IndexPage from '@pages/IndexPage'
import { MainLayout } from '@layouts/index'
import ConnectWalletPage from '@pages/ConnectWalletPage'
import BridgePage from '@pages/BridgePage'
import RoadmapPage from '@pages/RoadmapPage'
import FeaturesPage from '@pages/FeaturesPage'
import HowItWorksPage from '@pages/HowItWorksPage'
import EcosystemPage from '@pages/EcosystemPage'
import StatsPage from '@pages/StatsPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<MainLayout />}>
        <Route element={<IndexPage />} path="/" />
        <Route element={<ConnectWalletPage />} path="/connect-wallet" />
        {/* Bridge routes with nested paths */}
        <Route path="/bridge">
          <Route index element={<Navigate to="/bridge/crosschain" replace />} />
          <Route element={<BridgePage />} path="wrap" />
          <Route element={<BridgePage />} path="crosschain" />
          <Route element={<BridgePage />} path="stake" />
        </Route>
        <Route element={<RoadmapPage />} path="/roadmap" />
        <Route element={<FeaturesPage />} path="/features" />
        <Route element={<StatsPage />} path="/stats" />
        <Route element={<HowItWorksPage />} path="/how-it-works" />
        <Route element={<EcosystemPage />} path="/ecosystem" />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)
