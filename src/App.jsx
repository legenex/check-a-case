import React, { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Loader2 } from 'lucide-react';

import TaboolaPixel from '@/components/tracking/TaboolaPixel';
import AdminAuthGate from '@/components/admin/AdminAuthGate';

// ── Eagerly loaded public pages (above-the-fold traffic) ──────────────────────
import Home from '@/pages/Home';
import Survey from '@/pages/Survey';
import Submitted from '@/pages/Submitted';
import Thanks from '@/pages/Thanks';
import Sorry from '@/pages/Sorry';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import PartnerList from '@/pages/PartnerList';
import AdvertisingDisclosure from '@/pages/AdvertisingDisclosure';
import AdvertorialPage from '@/pages/AdvertorialPage';

// ── Lazily loaded: admin (separate chunk) ─────────────────────────────────────
const AdminLayout     = lazy(() => import('@/components/admin/AdminLayout'));
const Overview        = lazy(() => import('@/pages/admin/Overview'));
const Leads           = lazy(() => import('@/pages/admin/Leads'));
const AdminPlaceholder = lazy(() => import('@/pages/admin/AdminPlaceholder'));
const Sponsors        = lazy(() => import('@/pages/admin/Sponsors'));
const Advertorials    = lazy(() => import('@/pages/admin/Advertorials'));
const ExperimentsAdmin = lazy(() => import('@/pages/admin/Experiments'));
const Blog            = lazy(() => import('@/pages/admin/Blog'));

// ── Lazily loaded: tools ──────────────────────────────────────────────────────
const ClaimEstimator    = lazy(() => import('@/pages/tools/ClaimEstimator'));
const AdjusterSimulator = lazy(() => import('@/pages/tools/AdjusterSimulator'));
const CrashClock        = lazy(() => import('@/pages/tools/CrashClock'));
const LifestyleCost     = lazy(() => import('@/pages/tools/LifestyleCost'));
const DemandLetter      = lazy(() => import('@/pages/tools/DemandLetter'));

// ── Lazily loaded: landing pages ──────────────────────────────────────────────
const WhatsYourClaimWorth    = lazy(() => import('@/pages/lp/WhatsYourClaimWorth'));
const BeforeItsTooLate       = lazy(() => import('@/pages/lp/BeforeItsTooLate'));
const TheLowballTrap         = lazy(() => import('@/pages/lp/TheLowballTrap'));
const FreeDemandLetter       = lazy(() => import('@/pages/lp/FreeDemandLetter'));
const TheRealCostOfYourInjury = lazy(() => import('@/pages/lp/TheRealCostOfYourInjury'));

// Shared suspense fallback
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public routes — eagerly loaded */}
        <Route path="/" element={<Home />} />
        <Route path="/Survey" element={<Survey />} />
        <Route path="/Submitted" element={<Submitted />} />
        <Route path="/Thanks" element={<Thanks />} />
        <Route path="/Sorry" element={<Sorry />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/TermsOfService" element={<TermsOfService />} />
        <Route path="/PartnerList" element={<PartnerList />} />
        <Route path="/AdvertisingDisclosure" element={<AdvertisingDisclosure />} />
        <Route path="/a/:slug" element={<AdvertorialPage />} />

        {/* Tool routes — lazy */}
        <Route path="/tools/claim-estimator" element={<ClaimEstimator />} />
        <Route path="/tools/adjuster-simulator" element={<AdjusterSimulator />} />
        <Route path="/tools/crash-clock" element={<CrashClock />} />
        <Route path="/tools/lifestyle-cost" element={<LifestyleCost />} />
        <Route path="/tools/demand-letter" element={<DemandLetter />} />

        {/* Landing pages — lazy */}
        <Route path="/lp/whats-your-claim-worth" element={<WhatsYourClaimWorth />} />
        <Route path="/lp/before-its-too-late" element={<BeforeItsTooLate />} />
        <Route path="/lp/the-lowball-trap" element={<TheLowballTrap />} />
        <Route path="/lp/free-demand-letter" element={<FreeDemandLetter />} />
        <Route path="/lp/the-real-cost-of-your-injury" element={<TheRealCostOfYourInjury />} />

        {/* Admin routes — lazy + gated ONCE here */}
        <Route
          path="/admin"
          element={
            <AdminAuthGate>
              <AdminLayout />
            </AdminAuthGate>
          }
        >
          <Route index element={<Overview />} />
          <Route path="leads" element={<Leads />} />
          <Route path="analytics" element={<AdminPlaceholder />} />
          <Route path="numbers" element={<AdminPlaceholder />} />
          <Route path="quizzes" element={<AdminPlaceholder />} />
          <Route path="landing-pages" element={<AdminPlaceholder />} />
          <Route path="pages" element={<AdminPlaceholder />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="services" element={<AdminPlaceholder />} />
          <Route path="blog" element={<Blog />} />
          <Route path="seo" element={<AdminPlaceholder />} />
          <Route path="advertorials" element={<Advertorials />} />
          <Route path="experiments" element={<ExperimentsAdmin />} />
          <Route path="chatbot" element={<AdminPlaceholder />} />
          <Route path="integrations" element={<AdminPlaceholder />} />
          <Route path="tracking" element={<AdminPlaceholder />} />
          <Route path="users" element={<AdminPlaceholder />} />
          <Route path="settings" element={<AdminPlaceholder />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function PublicPixels() {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return <TaboolaPixel />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <PublicPixels />
          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App