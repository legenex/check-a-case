import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import TaboolaPixel from '@/components/tracking/TaboolaPixel';

// Public pages
import Home from '@/pages/Home';
import Survey from '@/pages/Survey';
import Submitted from '@/pages/Submitted';
import Thanks from '@/pages/Thanks';
import Sorry from '@/pages/Sorry';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import PartnerList from '@/pages/PartnerList';
import AdvertisingDisclosure from '@/pages/AdvertisingDisclosure';

// Admin layout + pages
import AdminLayout from '@/components/admin/AdminLayout';
import Overview from '@/pages/admin/Overview';
import Leads from '@/pages/admin/Leads';
import AdminPlaceholder from '@/pages/admin/AdminPlaceholder';
import Sponsors from '@/pages/admin/Sponsors';
import Advertorials from '@/pages/admin/Advertorials';
import ExperimentsAdmin from '@/pages/admin/Experiments';
import Blog from '@/pages/admin/Blog';
import AdvertorialPage from '@/pages/AdvertorialPage';

// Tools
import ClaimEstimator from '@/pages/tools/ClaimEstimator';
import AdjusterSimulator from '@/pages/tools/AdjusterSimulator';
import CrashClock from '@/pages/tools/CrashClock';
import LifestyleCost from '@/pages/tools/LifestyleCost';
import DemandLetter from '@/pages/tools/DemandLetter';

// Landing pages
import WhatsYourClaimWorth from '@/pages/lp/WhatsYourClaimWorth';
import BeforeItsTooLate from '@/pages/lp/BeforeItsTooLate';
import TheLowballTrap from '@/pages/lp/TheLowballTrap';
import FreeDemandLetter from '@/pages/lp/FreeDemandLetter';
import TheRealCostOfYourInjury from '@/pages/lp/TheRealCostOfYourInjury';

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
    <Routes>
      {/* Public routes */}
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

      {/* Tool routes */}
      <Route path="/tools/claim-estimator" element={<ClaimEstimator />} />
      <Route path="/tools/adjuster-simulator" element={<AdjusterSimulator />} />
      <Route path="/tools/crash-clock" element={<CrashClock />} />
      <Route path="/tools/lifestyle-cost" element={<LifestyleCost />} />
      <Route path="/tools/demand-letter" element={<DemandLetter />} />

      {/* Landing pages */}
      <Route path="/lp/whats-your-claim-worth" element={<WhatsYourClaimWorth />} />
      <Route path="/lp/before-its-too-late" element={<BeforeItsTooLate />} />
      <Route path="/lp/the-lowball-trap" element={<TheLowballTrap />} />
      <Route path="/lp/free-demand-letter" element={<FreeDemandLetter />} />
      <Route path="/lp/the-real-cost-of-your-injury" element={<TheRealCostOfYourInjury />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
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
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App