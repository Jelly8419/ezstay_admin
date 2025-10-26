import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { UserList } from './pages/users/UserList';
import { UserDetail } from './pages/users/UserDetail';
import PropertyList from './pages/properties/PropertyList';
import { PropertyReview } from './pages/properties/PropertyReview';
import ReservationList from './pages/reservations/ReservationList';
import PaymentList from './pages/payments/PaymentList';
import SettlementList from './pages/settlements/SettlementList';
import InquiryList from './pages/inquiries/InquiryList';
import NotificationList from './pages/notifications/NotificationList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 로그인 페이지 (인증 불필요) */}
          <Route path="/login" element={<Login />} />

          {/* 보호된 관리자 페이지 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />

              {/* 유저 관리 */}
              <Route path="users" element={<UserList />} />
              <Route path="users/:id" element={<UserDetail />} />

              {/* 매물 관리 */}
              <Route path="properties" element={<PropertyList />} />
              <Route path="properties/review" element={<PropertyReview />} />

              {/* 예약 관리 */}
              <Route path="reservations" element={<ReservationList />} />

              {/* 결제 관리 */}
              <Route path="payments" element={<PaymentList />} />

              {/* 정산 관리 */}
              <Route path="settlements" element={<SettlementList />} />

              {/* 고객센터 */}
              <Route path="inquiries" element={<InquiryList />} />

              {/* 알림 서비스 */}
              <Route path="notifications" element={<NotificationList />} />
            </Route>
          </Route>

          {/* 잘못된 경로는 대시보드로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
