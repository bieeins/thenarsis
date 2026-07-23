
import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/sonner.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import InvoiceViewPage from '@/pages/InvoiceViewPage.jsx';

import OwnerDashboard from '@/pages/OwnerDashboard.jsx';
import ProductManagementPage from '@/pages/ProductManagementPage.jsx';
import OrderManagementPage from '@/pages/OrderManagementPage.jsx';
import OrderDetailPage from '@/pages/OrderDetailPage.jsx';
import PaymentTrackingPage from '@/pages/PaymentTrackingPage.jsx';
import ExpenseInputPage from '@/pages/ExpenseInputPage.jsx';
import TeamManagementPage from '@/pages/TeamManagementPage.jsx';
import OwnerCalendarEventsPage from '@/pages/OwnerCalendarEventsPage.jsx';

import DesignerDashboard from '@/pages/DesignerDashboard.jsx';
import DesignWorkList from '@/pages/DesignWorkList.jsx';
import DesignWorkDetail from '@/pages/DesignWorkDetail.jsx';
import DesignerCalendarPage from '@/pages/DesignerCalendarPage.jsx';

import CrewDashboard from '@/pages/CrewDashboard.jsx';
import CrewMyEventsPage from '@/pages/CrewMyEventsPage.jsx';
import CrewEventsDirectory from '@/pages/CrewEventsDirectory.jsx';
import CrewEventDetailPage from '@/pages/CrewEventDetailPage.jsx';
import CrewCalendarPage from '@/pages/CrewCalendarPage.jsx';

import DesignReviewerDashboard from '@/pages/DesignReviewerDashboard.jsx';
import DesignReviewerCalendarPage from '@/pages/DesignReviewerCalendarPage.jsx';
import DesignWorkListPage from '@/pages/DesignWorkListPage.jsx';
import DesignWorkDetailPage from '@/pages/DesignWorkDetailPage.jsx';

import Notifications from '@/pages/Notifications.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import FinancialDashboard from '@/pages/FinancialDashboard.jsx';
import IncomeReportPage from '@/pages/IncomeReportPage.jsx';
import ExpenseReportPage from '@/pages/ExpenseReportPage.jsx';
import ProfitLossPage from '@/pages/ProfitLossPage.jsx';
import CashFlowPage from '@/pages/CashFlowPage.jsx';
import FinancialAnalyticsPage from '@/pages/FinancialAnalyticsPage.jsx';
import FinancialSettingsPage from '@/pages/FinancialSettingsPage.jsx';

const RouteLogger = () => {
  const location = useLocation();
  useEffect(() => {
    console.log(`[Router] View changed: ${location.pathname}`);
  }, [location]);
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteLogger />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/invoice/:invoiceNumber" element={<InvoiceViewPage />} />
              
              {/* Common Protected Routes */}
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Owner Routes */}
              <Route path="/owner-dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
              <Route path="/owner/calendar-events" element={<ProtectedRoute allowedRoles={['owner']}><OwnerCalendarEventsPage /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute allowedRoles={['owner']}><ProductManagementPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['owner']}><OrderManagementPage /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute allowedRoles={['owner']}><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/payment-tracking" element={<ProtectedRoute allowedRoles={['owner']}><PaymentTrackingPage /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute allowedRoles={['owner']}><ExpenseInputPage /></ProtectedRoute>} />
              <Route path="/team-management" element={<ProtectedRoute allowedRoles={['owner']}><TeamManagementPage /></ProtectedRoute>} />
              
              {/* Financial Routes */}
              <Route path="/financial" element={<ProtectedRoute allowedRoles={['owner']}><FinancialDashboard /></ProtectedRoute>} />
              <Route path="/financial/income" element={<ProtectedRoute allowedRoles={['owner']}><IncomeReportPage /></ProtectedRoute>} />
              <Route path="/financial/expenses" element={<ProtectedRoute allowedRoles={['owner']}><ExpenseReportPage /></ProtectedRoute>} />
              <Route path="/financial/pl" element={<ProtectedRoute allowedRoles={['owner']}><ProfitLossPage /></ProtectedRoute>} />
              <Route path="/financial/cashflow" element={<ProtectedRoute allowedRoles={['owner']}><CashFlowPage /></ProtectedRoute>} />
              <Route path="/financial/analytics" element={<ProtectedRoute allowedRoles={['owner']}><FinancialAnalyticsPage /></ProtectedRoute>} />
              <Route path="/financial/settings" element={<ProtectedRoute allowedRoles={['owner']}><FinancialSettingsPage /></ProtectedRoute>} />

              {/* Designer Routes */}
              <Route path="/designer-dashboard" element={<ProtectedRoute allowedRoles={['designer']}><DesignerDashboard /></ProtectedRoute>} />
              <Route path="/designer/my-projects" element={<ProtectedRoute allowedRoles={['designer']}><DesignWorkList /></ProtectedRoute>} />
              <Route path="/designer/project/:id" element={<ProtectedRoute allowedRoles={['designer']}><DesignWorkDetail /></ProtectedRoute>} />
              <Route path="/design-work" element={<ProtectedRoute allowedRoles={['designer']}><DesignWorkList /></ProtectedRoute>} />
              <Route path="/design-work/:id" element={<ProtectedRoute allowedRoles={['designer']}><DesignWorkDetail /></ProtectedRoute>} />
              <Route path="/designer-calendar" element={<ProtectedRoute allowedRoles={['designer']}><DesignerCalendarPage /></ProtectedRoute>} />

              {/* Crew Routes */}
              <Route path="/crew-dashboard" element={<ProtectedRoute allowedRoles={['crew']}><CrewDashboard /></ProtectedRoute>} />
              <Route path="/crew-calendar" element={<ProtectedRoute allowedRoles={['crew']}><CrewCalendarPage /></ProtectedRoute>} />
              <Route path="/crew/my-events" element={<ProtectedRoute allowedRoles={['crew']}><CrewMyEventsPage /></ProtectedRoute>} />
              <Route path="/crew/settings" element={<ProtectedRoute allowedRoles={['crew']}><ProfilePage /></ProtectedRoute>} />
              <Route path="/crew/events-directory" element={<ProtectedRoute allowedRoles={['crew']}><CrewEventsDirectory /></ProtectedRoute>} />
              <Route path="/crew/events/:eventId" element={<ProtectedRoute allowedRoles={['crew']}><CrewEventDetailPage /></ProtectedRoute>} />
              <Route path="/crew/event/:id" element={<ProtectedRoute allowedRoles={['crew']}><CrewEventDetailPage /></ProtectedRoute>} />

              {/* Design Reviewer Routes */}
              <Route path="/design-reviewer-dashboard" element={<ProtectedRoute allowedRoles={['design_reviewer']}><DesignReviewerDashboard /></ProtectedRoute>} />
              <Route path="/design-reviewer-calendar" element={<ProtectedRoute allowedRoles={['design_reviewer']}><DesignReviewerCalendarPage /></ProtectedRoute>} />
              <Route path="/design-work-list" element={<ProtectedRoute allowedRoles={['design_reviewer']}><DesignWorkListPage /></ProtectedRoute>} />
              <Route path="/reviewer/design-work/:id" element={<ProtectedRoute allowedRoles={['design_reviewer']}><DesignWorkDetailPage /></ProtectedRoute>} />
              
              {/* Fallback route */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background text-foreground p-4">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist or has been moved.</p>
                  <a href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
                    Return to Home
                  </a>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
