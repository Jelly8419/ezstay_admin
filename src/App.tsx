import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { UserList } from './pages/users/UserList';
import { UserDetail } from './pages/users/UserDetail';
import RoomList from './pages/rooms/RoomList';
import { RoomReview } from './pages/rooms/RoomReview';
import { RoomReviewDetail } from './pages/rooms/RoomReviewDetail';
import RoomManagement from './pages/rooms/RoomManagement';
import ContractList from './pages/contracts/ContractList';
import ContractDetail from './pages/contracts/ContractDetail';
import PaymentList from './pages/payments/PaymentList';
import PaymentDetail from './pages/payments/PaymentDetail';
import SettlementList from './pages/settlements/SettlementList';
import InquiryList from './pages/inquiries/InquiryList';
import NotificationList from './pages/notifications/NotificationList';
import { ActionLogs } from './pages/admin/ActionLogs';
import { SupportCenter } from './pages/support/SupportCenter';
import DepositHoldList from './pages/deposit-holds/DepositHoldList';
import ReceiptList from './pages/receipts/ReceiptList';
import AlimtalkManagement from './pages/alimtalk/AlimtalkManagement';

function App() {
  // 환경변수로 basename 제어 (개발: /, 테스트/프로덕션: /admin)
  const basename = import.meta.env.VITE_BASE_PATH || '/';

  return (
    <AuthProvider>
      <BrowserRouter
        basename={basename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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

              {/* 방 관리 */}
              <Route path="rooms" element={<RoomList />} />
              <Route path="rooms/review" element={<RoomReview />} />
              <Route path="rooms/review/:id" element={<RoomReviewDetail />} />
              <Route path="rooms/:roomId/management" element={<RoomManagement />} />
              <Route path="rooms/:id" element={<RoomReviewDetail />} />

              {/* 계약 관리 */}
              <Route path="contracts" element={<ContractList />} />
              <Route path="contracts/:id" element={<ContractDetail />} />

              {/* 결제 관리 */}
              <Route path="payments" element={<PaymentList />} />
              <Route path="payments/:contractId" element={<PaymentDetail />} />

              {/* 정산 관리 */}
              <Route path="settlements" element={<SettlementList />} />

              {/* 보증금 보류 관리 */}
              <Route path="deposit-holds" element={<DepositHoldList />} />

              {/* 영수증 관리 */}
              <Route path="receipts" element={<ReceiptList />} />

              {/* 고객센터 (통합) */}
              <Route path="support" element={<SupportCenter />} />

              {/* 고객센터 (기존 문의 페이지 - 호환성 유지) */}
              <Route path="inquiries" element={<InquiryList />} />

              {/* 알림 서비스 */}
              <Route path="notifications" element={<NotificationList />} />

              {/* 알림톡 관리 */}
              <Route path="alimtalk" element={<AlimtalkManagement />} />

              {/* 관리자 액션 로그 */}
              <Route path="admin/action-logs" element={<ActionLogs />} />
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
