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
import SettlementDetail from './pages/settlements/SettlementDetail';
import PayoutList from './pages/payouts/PayoutList';
import PayoutDetail from './pages/payouts/PayoutDetail';
import InquiryList from './pages/inquiries/InquiryList';
import NotificationList from './pages/notifications/NotificationList';
import { ActionLogs } from './pages/admin/ActionLogs';
import { SupportCenter } from './pages/support/SupportCenter';
import DepositHoldList from './pages/deposit-holds/DepositHoldList';
import DepositHoldDetailPage from './pages/deposit-holds/DepositHoldDetail';
import CancelRequestList from './pages/contracts/CancelRequestList';
import RentalOptionPage from './pages/rental-orders/RentalOptionPage';
import ServiceTaskList from './pages/service-tasks/ServiceTaskList';
import ReceiptList from './pages/receipts/ReceiptList';
import AlimtalkManagement from './pages/alimtalk/AlimtalkManagement';
import NotificationQueuePage from './pages/alimtalk/NotificationQueuePage';
import PromotionList from './pages/promotions/PromotionList';
import PromotionDetail from './pages/promotions/PromotionDetail';
import BrokerList from './pages/brokers/BrokerList';
import BrokerDetail from './pages/brokers/BrokerDetail';
import IncentiveMonthlyList from './pages/broker-incentives/IncentiveMonthlyList';
import IncentiveMonthlyDetail from './pages/broker-incentives/IncentiveMonthlyDetail';
import MoveInServicePage from './pages/move-in-cases/MoveInServicePage';
import MoveInCaseDetail from './pages/move-in-cases/MoveInCaseDetail';

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
              <Route path="contracts/deposits" element={<DepositHoldList />} />
              <Route path="contracts/deposits/:contractId" element={<DepositHoldDetailPage />} />
              <Route path="contracts/cancel-requests" element={<CancelRequestList />} />

              {/* 결제 관리 */}
              <Route path="payments" element={<PaymentList />} />
              <Route path="payments/:orderId" element={<PaymentDetail />} />

              {/* 정산 관리 */}
              <Route path="settlements" element={<SettlementList />} />
              <Route path="settlements/:settlementId" element={<SettlementDetail />} />

              {/* 지급 관리 */}
              <Route path="payouts" element={<PayoutList />} />
              <Route path="payouts/:payoutId" element={<PayoutDetail />} />

              {/* 옵션상품 관리 (내부 계약 / 입주 준비 도메인 통합) */}
              <Route path="rental-orders" element={<RentalOptionPage />} />
              <Route
                path="rental-refund-requests"
                element={<Navigate to="/rental-orders?tab=refunds" replace />}
              />
              <Route
                path="rental-items"
                element={<Navigate to="/rental-orders?tab=items" replace />}
              />

              {/* 예약 관리 */}
              <Route path="service-tasks" element={<ServiceTaskList />} />

              {/* 입주 준비 서비스 */}
              <Route path="move-in-cases" element={<MoveInServicePage />} />
              <Route path="move-in-cases/:caseId" element={<MoveInCaseDetail />} />

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
              <Route path="alimtalk/queue" element={<NotificationQueuePage />} />

              {/* 프로모션 관리 */}
              <Route path="promotions" element={<PromotionList />} />
              <Route path="promotions/:id" element={<PromotionDetail />} />

              {/* 중개인 관리 */}
              <Route path="brokers" element={<BrokerList />} />
              <Route path="brokers/:id" element={<BrokerDetail />} />

              {/* 중개인 인센티브 */}
              <Route path="broker-incentives" element={<IncentiveMonthlyList />} />
              <Route path="broker-incentives/:payoutId" element={<IncentiveMonthlyDetail />} />

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
