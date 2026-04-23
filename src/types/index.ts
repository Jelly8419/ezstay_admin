// 사용자 관련 타입
export type UserType = 'local' | 'social';
export type AccountType = 'email' | 'kakao' | 'naver' | 'google';
export type UserRole = 'host' | 'guest';

export interface AccountTypeDetail {
  type: AccountType;
  // email 타입일 때
  emailVerified?: boolean;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  // social 타입일 때
  providers?: Array<{
    provider: string;
    providerEmail: string;
    connectedAt: string;
  }>;
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  nickname: string | null;
  phoneNumber: string | null;
  userType: UserType;
  isActive: boolean;
  role: UserRole;
  createdAt: string;
}

export interface RefundAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isVerified: boolean;
  verifiedAt: string | null;
}

// 회원 상세 정보 (관리자용)
export interface UserDetail extends User {
  accountTypeDetail: AccountTypeDetail;
  hasVerifiedBankAccount: boolean;
  bankAccounts: BankAccount[];
  refundAccount: RefundAccount | null;
  hasRefundAccount: boolean;
  hostActiveRoomsCount: number;
  hostContractsCount: number;
  guestContractsCount: number;
}

// 매물(Room) 관련 타입
export type RoomStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'hidden_by_admin';

export interface Room {
  id: number;
  roomName: string;
  address: string;
  status: RoomStatus;
  dailyRent: number;
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  photos: Array<{
    id: number;
    url: string;
    order?: number;
  }>;
  createdAt: string;
}

// 계약(예약) 관련 타입
export type ReservationStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_COMPLETED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_GUEST'
  | 'CANCELLED_BY_HOST'
  | 'CANCELLED_BY_ADMIN_WITH_REFUND'
  | 'CANCELLED_BY_ADMIN_NO_REFUND'
  | 'REFUNDED'
  | 'APPROVAL_EXPIRED'
  | 'PAYMENT_EXPIRED'
  | 'CANCEL_REQUESTED';

export type CancellationType = 'BEFORE_PAYMENT' | 'AFTER_PAYMENT' | 'DURING_STAY';
export type CancellationFaultType = 'GUEST' | 'HOST' | 'ADMIN';

export interface Reservation {
  id: number;
  contractNumber: string;
  orderId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  finalTotalAmount: number | null;
  userType: 'guest' | 'host';
  guest: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
    address: string;
  };
  createdAt: string;
}

export interface ReservationDetail {
  id: number;
  orderId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
  totalWeeks: number;
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  rentalItems: string | null;
  rentalItemsFee: number;
  platformFee: number;
  hostPlatformFee: number;
  discountAmount: number;
  subtotal: number;
  totalUsageFee: number;
  deposit: number;
  finalTotalAmount: number;
  paidAt: string | null;
  guest?: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  host?: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  room?: {
    id: number;
    roomName: string;
    address: string;
    detailAddress: string;
    photos?: Array<{ id: number; url: string; order: number }>;
    ezService?: {
      cleaningService: boolean;
      [key: string]: any;
    };
  };
  createdAt: string;
  timeline?: PaymentTimelineEvent[];
  checkoutTimeline?: CheckoutTimeline | null;
  paymentSummary?: PaymentSummary | null;
}

export interface PaymentSummary {
  totalPaidAmount: number;
  totalRefundedAmount: number;
  currentBalance: number;
  contractPaidAmount: number;
  contractRefundTotal: number;
  rentalPaidTotal: number;
  rentalRefundTotal: number;
}

export type CheckoutStatus =
  | 'NOT_STARTED'
  | 'GUEST_COMPLETED'
  | 'HOLD_REQUESTED'
  | 'HOST_PENDING'
  | 'HOST_CONFIRMED';

export type DepositStatus =
  | 'HOLDING'
  | 'RETURN_PENDING'
  | 'RETURN_HOLD'
  | 'RETURN_CONFIRMED'
  | 'DEDUCTION_CONFIRMED'
  | 'RETURNED'
  | 'REFUND_FAILED';

export type CheckoutStepType =
  | 'CHECKOUT_REQUESTED'
  | 'CHECKOUT_CONFIRMED'
  | 'HOLD_REQUESTED'
  | 'HOLD_APPROVED'
  | 'AGREEMENT_SUBMITTED'
  | 'AGREEMENT_ACCEPTED'
  | 'AUTO_RETURNED';

export interface CheckoutStep {
  step: CheckoutStepType;
  label: string;
  actor: 'guest' | 'host' | 'admin' | 'system';
  occurredAt: string;
  isAuto?: boolean;
  holdReason?: string;
  agreementDeadline?: string;
  deductAmount?: number;
  agreementText?: string;
}

export interface CheckoutTimeline {
  currentCheckoutStatus: CheckoutStatus;
  currentDepositStatus: DepositStatus;
  deposit: number;
  refundableDeposit: number | null;
  steps: CheckoutStep[];
}

// 정산(Settlement) 관련 타입
export type SettlementStatus = 'PENDING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'ON_HOLD' | 'FAILED';

export interface Settlement {
  id: number;
  contractId: number;
  hostId: number;
  hostName: string;
  hostEmail: string;
  status: SettlementStatus;
  statusLabel: string;
  netAmount: number;
  expectedDate: string;
  payoutAvailableDate: string | null;
  checkInDate: string;
  checkOutDate: string;
  payout: {
    id: number;
    status: string;
    amount: number;
    payableAfter: string;
    processedAt: string | null;
  } | null;
  createdAt: string;
}

export interface SettlementDetail {
  settlementBreakdown: {
    rentalFee: number;
    maintenanceFee: number;
    cleaningFee: number;
    hostPlatformFee: number;
    refundDeduction: number;
    grossAmount: number;
    netAmount: number;
  };
  contractPaymentDetail: {
    rentalFee: number;
    maintenanceFee: number;
    cleaningFee: number;
    rentalItemsFee: number;
    deposit: number;
    platformFee: number;
    finalTotalAmount: number;
  };
  rentalOrders: {
    id: number;
    orderId: string;
    orderType: string;
    orderTypeLabel: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
    paymentMethod: string | null;
    paidAt: string | null;
    items: {
      id: number;
      name: string;
      imageUrl: string | null;
      quantity: number;
      pricePerItem: number;
      totalPrice: number;
      status: string;
    }[];
  }[];
  rentalOrdersTotalPaid: number;
}

export interface SettlementSummary {
  pendingCount: number;
  readyCount: number;
  completedCount: number;
  onHoldCount: number;
}

// 결제(Payment) 관련 타입
export type PaymentMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER' | 'MOBILE' | 'EASY_PAY' | 'CREDIT_CARD';
export type PaymentStatus = 'READY' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
export type PaymentProductType = 'contract' | 'rental' | 'contract_rental' | 'penalty' | 'deposit_refund';
export type PaymentTransactionType = 'PAYMENT_COMPLETED' | 'PARTIAL_CANCEL' | 'FULL_CANCEL';

// 결제 유형
export type PaymentType = 'CONTRACT' | 'HOST_BURDEN';

// 결제 행 유형 (계약 결제 or 렌탈 추가결제)
export type PaymentRowType = 'CONTRACT' | 'RENTAL';

// 탭1: 주문별 결제 현황 (/admin/payments/summary)
export interface PaymentSummaryItem {
  rowType: PaymentRowType;
  orderId: string;
  pgOrderNo: string | null;
  contractId: number;
  rentalOrderId: string | null;
  paidAt: string | null;
  productType: string;
  paymentType?: PaymentType;
  roomName: string;
  userName: string;
  userType: string;
  paidAmount: number;
  refundedAmount: number;
  currentBalance: number;
  paymentMethod: string;
  easyPayProvider: string | null;
  paymentStatus: string;
  contractStatus: string;
  contractStatusLabel: string;
  guest: {
    id: number;
    name: string;
    nickname: string;
  };
  host: {
    id: number;
    name: string;
    nickname: string;
  };
}

// 하위호환용 alias
export type Payment = PaymentSummaryItem;

// 결제 상세 - 타임라인 이벤트
export interface PaymentTimelineEvent {
  occurredAt: string;
  type: string;
  amount: number;
  description: string;
  actor: string;
  pgStatus: string | null;
  pgOrderNo?: string | null;
  orderId?: string | null;
  method?: string;
  easyPayProvider?: string | null;
}

// 결제 상세 - 계약 정보
export interface PaymentContractInfo {
  id: number;
  orderId: string;
  status: string;
  paymentMethod: string;
  finalTotalAmount: number;
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  platformFee: number;
  hostPlatformFee: number;
  deposit: number;
  checkInDate: string;
  checkOutDate: string;
  paidAt: string | null;
}

// 결제 상세 - 결제 요약
export interface PaymentDetailSummary {
  contractPaidAmount?: number;
  hostBurdenPaidAmount?: number;
  totalPaidAmount: number;
  totalRefundedAmount: number;
  currentBalance: number;
}

// 결제 상세 - 렌탈 주문
export interface PaymentRentalOrderItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRentalOrder {
  id: number;
  orderId: string;
  status: string;
  totalAmount: number;
  paidAt: string | null;
  items: PaymentRentalOrderItem[];
}

// GET /admin/payments/:contractId 응답
export interface PaymentOrderDetail {
  contract: PaymentContractInfo;
  guest: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  room: {
    id: number;
    roomName: string;
    address: string;
  };
  summary: PaymentDetailSummary;
  timeline: PaymentTimelineEvent[];
  rentalOrders: PaymentRentalOrder[];
}

// 탭2: 결제/취소 내역 (/admin/payments/logs)
export interface PaymentLog {
  id?: number;
  orderId: string;
  pgOrderNo?: string | null;
  occurredAt: string;
  transactionType: string;
  paymentMethod: string;
  easyPayProvider?: string | null;
  productType: string;
  paymentType?: PaymentType;
  amount: number;
  userName: string;
  userType: string;
  roomName: string;
  contractId?: number;
  paymentKey?: string;
  rentalOrderId?: string;
  refundId?: number;
  actor?: string;
}

// 고객 문의(Inquiry) 관련 타입
export type InquiryStatus = 'pending' | 'answered' | 'closed';
export type InquiryCategoryType =
  | 'general'
  | 'reservation'
  | 'payment'
  | 'room'
  | 'account'
  | 'other';

export interface Inquiry {
  id: number;
  categoryType: InquiryCategoryType;
  userType: 'host' | 'guest';
  title: string;
  content: string;
  status: InquiryStatus;
  answer: string | null;
  answeredAt: string | null;
  answeredBy: number | null;
  user: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  admin: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
}

export interface InquiryDetail extends Inquiry {}

// 알림(Notification) 관련 타입
export type NotificationType = 'email' | 'sms';
export type NotificationStatus = 'success' | 'failed';

export interface Notification {
  id: number;
  type: NotificationType;
  recipient: string;
  template: string;
  status: NotificationStatus;
  sentAt: string;
}

// 관리자 액션 로그 관련 타입
export type ActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'SUSPEND'
  | 'EXPORT';

export type ResourceType =
  | 'USER'
  | 'PROPERTY'
  | 'RESERVATION'
  | 'PAYMENT'
  | 'SETTLEMENT'
  | 'INQUIRY'
  | 'NOTIFICATION'
  | 'ADMIN'
  | 'SYSTEM';

export interface AdminActionLog {
  id: number;
  adminId: number;
  adminEmail: string;
  adminName: string;
  actionType: ActionType;
  resourceType: ResourceType;
  resourceId: string | null;
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  endpoint: string;
  requestBody: Record<string, any> | null;
  responseStatus: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  createdAt: string;
  admin: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

export interface AdminActionLogFilter {
  adminId?: number;
  actionType?: ActionType;
  resourceType?: ResourceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminActionLogStats {
  totalLogs: number;
  actionTypeStats: Array<{ actionType: string; count: number }>;
  resourceTypeStats: Array<{ resourceType: string; count: number }>;
  adminActivityStats: Array<{
    adminId: number;
    adminName: string;
    adminEmail: string;
    count: number;
  }>;
}

// ========================================
// 고객센터 (Support Center) 관련 타입
// ========================================

// 공지사항 타입
export type NoticeStatus = 'draft' | 'published' | 'archived';
export type NoticeUserType = 'all' | 'host' | 'guest';

export interface Notice {
  id: number;
  title: string;
  content: string;
  status: NoticeStatus;
  userType: NoticeUserType;
  isImportant: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  author: {
    id: number;
    username: string;
    name: string;
  } | null;
  editor: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeFormData {
  title: string;
  content: string;
  isImportant?: boolean;
  userType?: NoticeUserType;
  publishedAt?: string | null;
  expiresAt?: string | null;
  status?: NoticeStatus;
}

// FAQ 타입
export type FAQUserType = 'all' | 'host' | 'guest';

export interface FAQCategory {
  id: number;
  name: string;
  userType: FAQUserType;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface FAQ {
  id: number;
  categoryId: number;
  question: string;
  answer: string;
  displayOrder: number;
  viewCount: number;
  isActive: boolean;
  category?: {
    id: number;
    name: string;
    userType: FAQUserType;
  };
  author?: {
    id: number;
    username: string;
    name: string;
  };
  editor?: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FAQFormData {
  categoryId: number;
  question: string;
  answer: string;
  displayOrder?: number;
  isActive?: boolean;
}

// ========================================
// 환불 관련 타입
// ========================================

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'REFUND_FAILED';
export type RefundMethod = 'ORIGINAL' | 'BANK_TRANSFER';

export interface Refund {
  id: number;
  refundStatus: RefundStatus;
  contract: {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    room: { id: number; roomName: string; address: string };
    guest: { id: number; name: string; phoneNumber: string; email: string };
  };
  policyTypeUsed: string;
  daysBeforeCheckin: number;
  isSameDayCancellation: boolean;
  totalRefundAmount: number;
  finalRefundAmount: number;
  refundMethod: RefundMethod;
  cancellationReason: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
}

export interface RefundDetail {
  refund: {
    id: number;
    refundStatus: RefundStatus;
    contract: {
      id: number;
      checkInDate: string;
      checkOutDate: string;
      totalDays: number;
      room: { id: number; roomName: string; address: string; refundPolicy: string };
      host: { id: number; name: string; nickname: string; phoneNumber: string; email: string };
      guest: { id: number; name: string; nickname: string; phoneNumber: string; email: string };
    };
    policyTypeUsed: string;
    cancellationDate: string;
    checkInDate: string;
    daysBeforeCheckin: number;
    isSameDayCancellation: boolean;
    originalRentalFee: number;
    originalCleaningFee: number;
    originalMaintenanceFee: number;
    originalTotalAmount: number;
    rentalFeeRefundRate: number;
    rentalFeeRefundAmount: number;
    cleaningFeeRefundAmount: number;
    maintenanceFeeRefundAmount: number;
    totalRefundAmount: number;
    platformFeeDeducted: number;
    penaltyAmount: number;
    finalRefundAmount: number;
    refundMethod: RefundMethod;
    refundAccountInfo: any | null;
    cancellationReason: string;
    rejectionReason: string | null;
    adminNotes: string | null;
    requestedAt: string;
    approvedAt: string | null;
    rejectedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// ========================================
// 렌탈 주문 관련 타입
// ========================================

export type RentalOrderStatus = 'PENDING' | 'PAID' | 'PARTIAL_REFUND' | 'FULLY_REFUNDED' | 'CANCELLED';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
export type RentalItemStatus = 'ACTIVE' | 'CANCELLED';

export interface RentalOrderItem {
  id: number;
  rentalItemId?: number;
  name: string;
  category?: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  status: RentalItemStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundAmount: number | null;
}

export interface RentalOrder {
  id: number;
  orderId: string;
  orderType: string;
  status: RentalOrderStatus;
  deliveryStatus: DeliveryStatus;
  deliveryStatusLabel: string;
  deliveredAt: string | null;
  totalAmount: number;
  refundedAmount: number;
  modifiableUntil: string | null;
  paidAt: string | null;
  createdAt: string;
  contract: {
    id: number;
    orderId: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    guest: { id: number; name: string; nickname: string; email: string };
    room: { id: number; roomName: string };
  };
  items: RentalOrderItem[];
}

export interface RentalOrderDetail {
  order: RentalOrder & {
    paymentKey?: string;
    updatedAt: string;
    contract: {
      id: number;
      orderId: string;
      status: string;
      checkInDate: string;
      checkOutDate: string;
      guest: { id: number; name: string; nickname: string; email: string; phoneNumber: string };
      host: { id: number; name: string; nickname: string; email: string; phoneNumber: string };
      room: { id: number; roomName: string; address: string };
    };
  };
  logs: Array<{
    id: number;
    action: string;
    actionLabel: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
}

export interface RentalHistory {
  contract: {
    id: number;
    orderId: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    guest: { id: number; name: string; nickname: string };
    room: { id: number; roomName: string };
  };
  summary: {
    totalOrders: number;
    totalPaid: number;
    totalRefunded: number;
    activeItems: number;
    cancelledItems: number;
  };
  orders: Array<{
    id: number;
    rentalOrderId: string;
    orderType: string;
    status: RentalOrderStatus;
    totalAmount: number;
    refundedAmount: number;
    paidAt: string | null;
    createdAt: string;
    items: Array<{
      id: number;
      name: string;
      quantity: number;
      totalPrice: number;
      status: RentalItemStatus;
      cancelledAt: string | null;
    }>;
  }>;
  timeline: Array<{
    id: number;
    rentalOrderId: number;
    action: string;
    actionLabel: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
}

export interface RentalOrderCancelResponse {
  rentalOrderId: string;
  cancelledItems: Array<{
    id: number;
    name: string;
    quantity: number;
    status: string;
  }>;
  orderStatus: string;
  totalRefunded: number;
  pgFailure?: boolean;
  pgFailureMessage?: string;
}

// ========================================
// 예약 취소 관련 타입
// ========================================

export interface ForceCancelRequest {
  reason: string;
  withRefund: boolean;
}

export interface ForceCancelResponse {
  contractId: number;
  previousStatus: string;
  newStatus: string;
  withRefund: boolean;
  cancellationType: CancellationType;
  reason: string;
}

export interface ApproveCancelRequest {
  withRefund: boolean;
  adminNote?: string;
}

export interface ApproveCancelResponse {
  contractId: number;
  previousStatus: string;
  newStatus: string;
  withRefund: boolean;
  adminNote?: string;
}

export interface RejectCancelRequest {
  adminNote?: string;
}

export interface RejectCancelResponse {
  contractId: number;
  status: string;
  adminNote?: string;
}

// ========================================
// 취소 요청 목록 관련 타입
// ========================================

export type RequesterRole = 'HOST' | 'GUEST';
export type CancelRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CancelRequestContract {
  cancelRequestId: number;
  contractId: number;
  contractStatus: string;
  status: CancelRequestStatus;
  requesterRole: RequesterRole;
  cancelReason: string;
  requestedAt: string;
  processedAt: string | null;
  adminNote: string | null;
  processedBy: {
    id: number;
    name: string;
  } | null;
  checkInDate: string;
  checkOutDate: string;
  finalTotalAmount: number;
  guest: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
    address: string;
  };
}

export interface CancelRequestListParams {
  page?: number;
  limit?: number;
  status?: CancelRequestStatus;
  requesterRole?: RequesterRole;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CancelRequestListResponse {
  cancelRequests: CancelRequestContract[];
  pagination: Pagination;
}

// ========================================
// 관리자 직접 환불 관련 타입
// ========================================

export type AdminRefundType = 'FULL' | 'PARTIAL_ITEMS';

export interface AdminRefundRentalItem {
  rentalOrderItemId: number;
  refundAmount: number;
}

export interface AdminRefundItems {
  rentalFee?: number;
  maintenanceFee?: number;
  cleaningFee?: number;
  platformFee?: number;
  deposit?: number;
  rentalItems?: AdminRefundRentalItem[];
}

export interface AdminRefundRequest {
  refundType: AdminRefundType;
  refundReason: string;
  refundAmount?: number;
  items?: AdminRefundItems;
}

export interface AdminRefundResponse {
  adminRefundId: number;
  refundType: AdminRefundType;
  totalRefundAmount: number;
  paymentStatus: string;
  pgReceiptUrl?: string;
  contractItems?: {
    rentalFee: number;
    maintenanceFee: number;
    cleaningFee: number;
    platformFee: number;
    deposit: number;
  };
  cancelledRentalItems?: Array<{ id: number; name: string; refundAmount: number }>;
  warning?: string;
}

// ========================================
// 렌탈 추가결제 환불 (ADDITIONAL 렌탈 주문 전용)
// ========================================

export interface RentalRefundRequest {
  refundType: AdminRefundType;
  refundReason: string;
  refundAmount?: number;
  items?: AdminRefundRentalItem[];
}

export interface RentalRefundResponse {
  rentalOrderId: string;
  refundType: AdminRefundType;
  refundAmount: number;
  orderStatus: string;
  paymentStatus: string;
  cancelledItems?: Array<{ id: number; name: string; refundAmount: number }>;
}

// ========================================
// 옵션상품 환불 요청 관리 (rental-refund-requests)
// ========================================

export type RetrievalStatus = 'RETRIEVAL_PENDING' | 'IN_RETRIEVAL' | 'RETRIEVED';
export type RentalRefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RentalRefundRequestItem {
  id: number;
  name: string;
  quantity: number;
  totalPrice: number;
  status: string;
}

export interface RentalRefundRequestBase {
  id: number;
  status: RentalRefundRequestStatus;
  statusLabel: string;
  deliveryStatusSnapshot: string;
  itemTotalAmount: number;
  shippingDeduction: number;
  finalRefundAmount: number;
  retrievalStatus: RetrievalStatus | null;
  retrievalStatusLabel: string | null;
  cancelReason: string;
  rejectReason: string | null;
  processedAt: string | null;
  createdAt: string;
  rentalOrder: {
    id: number;
    orderId: string;
    status: string;
    deliveryStatus: string;
    items: RentalRefundRequestItem[];
  };
  contract: {
    id: number;
    orderId: string;
    status: string;
    guest: {
      id: number;
      name: string;
      nickname: string;
      phoneNumber: string;
    };
  };
}

export interface RentalRefundRequestDetail extends RentalRefundRequestBase {
  shippingDeductionWaivable: boolean;
  retrievalStartedAt: string | null;
  retrievalCompletedAt: string | null;
  adminId: number | null;
  rentalOrder: RentalRefundRequestBase['rentalOrder'] & {
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
    payment: { balanceAmount: number; status: string };
  };
  contract: RentalRefundRequestBase['contract'] & {
    checkInDate: string;
    checkOutDate: string;
    guest: RentalRefundRequestBase['contract']['guest'] & { email: string };
  };
}

export interface RentalRefundRequestListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: RentalRefundRequestBase[];
}

export interface RentalRefundApproveResponse {
  requestId: number;
  rentalOrderId: number;
  orderId: string;
  itemTotalAmount: number;
  shippingDeduction: number;
  finalRefundAmount: number;
  retrievalStatus: RetrievalStatus | null;
  retrievalStatusLabel: string | null;
}

export interface RentalRefundRejectResponse {
  requestId: number;
  status: 'REJECTED';
  rejectReason: string;
  restoredItemCount: number;
}

export interface RetrievalStatusUpdateResponse {
  requestId: number;
  retrievalStatus: RetrievalStatus;
  retrievalStatusLabel: string;
  retrievalStartedAt: string | null;
  retrievalCompletedAt: string | null;
}

// ========================================
// 보증금 보류 관련 타입
// ========================================

export type DepositHoldStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'HOST_SUBMITTED'
  | 'AGREED'
  | 'AUTO_REFUNDED'
  | 'REFUND_FAILED';

// GET /api/admin/deposits 목록 아이템
export interface DepositHold {
  contractId: number;
  room: { id: number; roomName: string };
  guest: { id: number; name: string };
  host: { id: number; name: string };
  deposit: number;
  deductRequestAmount: number | null;
  holdReason: string;
  holdRequestedAt: string;
  holdApprovedAt: string | null;
  holdStatus: DepositHoldStatus;
  rejectedReason: string | null;
  rejectedAt: string | null;
}

// GET /api/admin/deposits/:contractId 상세
export type DepositAgreementStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'AUTO_RETURNED';

export interface DepositAgreement {
  id: number;
  status: DepositAgreementStatus;
  statusLabel: string;
  holdReason: string;
  requestedAt: string;
  rejectedAt: string | null;
  rejectedReason: string | null;
  adminApprovedAt: string | null;
  deductAmount: number | null;
  agreementText: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export interface DepositHoldLog {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface DepositHoldDetail {
  contractId: number;
  checkInDate: string;
  checkOutDate: string;
  guest: { id: number; name: string; email: string; phoneNumber: string };
  host: { id: number; name: string; email: string; phoneNumber: string };
  room: { id: number; roomName: string; address: string };
  deposit: number;
  holdStatus: DepositHoldStatus;
  holdReason: string;
  holdRequestedAt: string;
  holdApprovedAt: string | null;
  depositAgreements: DepositAgreement[];
  refundableDeposit: number;
  depositStatus: string;
  logs: DepositHoldLog[];
}

// ========================================
// 영수증 관련 타입
// ========================================

export type ReceiptType = 'personal' | 'business' | 'tax_invoice';
export type ReceiptStatus = 'PENDING' | 'ISSUED';
export type ReceiptUserType = 'HOST' | 'GUEST';
export type ReceiptTargetType = 'CONTRACT_FEE' | 'HOST_CANCEL_FEE' | 'GUEST_CANCEL_FEE' | 'OPTION_SALE';

export interface Receipt {
  id: number;
  userType: ReceiptUserType;
  userId: number;
  userName: string;
  orderId: string;
  receiptType: ReceiptType;
  targetType: ReceiptTargetType;
  amount: number;
  date: string;
  status: ReceiptStatus;
  issuedAt: string | null;
  createdAt: string;
  issuedByAdmin?: { id: number; name: string } | null;
}

export interface ReceiptDetail extends Receipt {
  userPhone: string;
  userEmail: string;
  contractId: number | null;
  settlementId: number | null;
  issuedByAdmin: { id: number; name: string } | null;
  issueNote: string | null;
  receiptNumber: string | null;
  businessName: string | null;
  repName: string | null;
  email: string | null;
  settlement: {
    id: number;
    status: string;
    netAmount: number;
    expectedDate: string;
    completedAt: string | null;
  } | null;
  updatedAt: string;
}

// ========================================
// 알림톡 (Alimtalk) 관련 타입
// ========================================

export type AlimtalkInspStatus = 'APR' | 'REJ' | 'REG';
export type AlimtalkLogStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRIED' | 'FALLBACK_SENT' | 'FALLBACK_FAILED';

export interface AlimtalkTemplateButton {
  name: string;
  linkType: string;
  linkMo: string;
  linkPc?: string;
}

export type AlimtalkTargetRole = 'host' | 'guest' | 'both';

export interface AlimtalkTemplate {
  eventName: string | null;
  tplCode: string | null;
  eventLabel: string | null;
  targetRole: AlimtalkTargetRole | null;
  varMap: Record<string, string> | null;
  isActive: boolean;
  isLinked: boolean;
  inspStatus: AlimtalkInspStatus | null;
  templtName: string | null;
  templtContent: string | null;
  buttons: AlimtalkTemplateButton[] | null;
  lastFetched: string | null;
}

export interface AlimtalkTemplateListResponse {
  totalTemplates: number;
  activeTemplates: number;
  unmappedCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  templates: AlimtalkTemplate[];
}

export interface AlimtalkTemplateSyncResponse {
  templateCount: number;
  lastSyncTime: string;
}

export interface AlimtalkLog {
  id: number;
  eventName: string;
  contractId: number | null;
  chatRoomId: number | null;
  receiverId: number;
  receiverPhone: string;
  tplCode: string;
  status: AlimtalkLogStatus;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export interface AlimtalkLogListParams {
  page?: number;
  limit?: number;
  status?: AlimtalkLogStatus;
  eventName?: string;
  receiverId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AlimtalkStatsSummary {
  total: number;
  sent: number;
  retried: number;
  fallbackSent: number;
  failed: number;
  successRate: string;
}

export interface AlimtalkStatsByStatus {
  status: string;
  count: number;
}

export interface AlimtalkStatsByEvent {
  eventName: string;
  total: number;
  sent: number;
  failed: number;
  fallback: number;
}

export interface AlimtalkStatsResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: AlimtalkStatsSummary;
  byStatus: AlimtalkStatsByStatus[];
  byEvent: AlimtalkStatsByEvent[];
}

// API 응답 타입
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// =====================
// Payout (지급 관리)
// =====================

export type PayoutStatus = 'PENDING' | 'PAYABLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type PayoutType =
  | 'CONTRACT_SETTLEMENT'
  | 'GUEST_PENALTY'
  | 'DEPOSIT_DEDUCTION'
  | 'HOST_CANCELLATION_COMPENSATION';

export type RecipientType = 'HOST' | 'GUEST';

export interface PayoutListItem {
  id: number;
  contractId: number;
  payoutType: PayoutType;
  payoutTypeLabel: string;
  recipientType: RecipientType;
  recipientId: number;
  recipientName: string | null;
  amount: number;
  status: PayoutStatus;
  statusLabel: string;
  payableAfter: string;
  processedAt: string | null;
  createdAt: string;
}

export interface PayoutDetail {
  id: number;
  contractId: number;
  settlementId: number | null;
  refundId: number | null;
  payoutType: PayoutType;
  payoutTypeLabel: string;
  recipientType: RecipientType;
  recipient: {
    id: number;
    name: string;
    nickname: string;
    phoneNumber: string;
  };
  amount: number;
  status: PayoutStatus;
  statusLabel: string;
  payableAfter: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  adminId: number | null;
  processedByAdmin: { id: number; name: string } | null;
  processedAt: string | null;
  failureReason: string | null;
  note: string | null;
  contract: {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    rentalFee: number;
    maintenanceFee: number;
    cleaningFee: number;
    finalTotalAmount: number;
  } | null;
  settlement: {
    id: number;
    status: string;
    netAmount: number;
    expectedDate: string;
    payoutAvailableDate: string;
  } | null;
  refund: object | null;
  payoutTypeDescription: string | null;
  statusHistory: {
    id: number;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    adminName: string | null;
    note: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PayoutListParams {
  page?: number;
  limit?: number;
  status?: PayoutStatus;
  payoutType?: PayoutType;
  recipientType?: RecipientType;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ===== 옵션 상품 재고 관리 =====

export type RentalItemType = 'hair_dryer' | 'bedding_set' | 'amenity_kit' | 'towel_set' | 'other';
export type SalesType = 'SALE' | 'RENTAL';

export interface RentalItem {
  id: number;
  itemType: RentalItemType;
  itemTypeLabel: string;
  salesType: SalesType;
  salesTypeLabel: string;
  name: string;
  description: string | null;
  price: string;
  totalStock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalItemStat {
  itemType: RentalItemType;
  itemTypeLabel: string;
  salesType: SalesType;
  salesTypeLabel: string;
  itemCount: number;
  totalStock: number;
}

export interface RentalCalendarEntry {
  reservedQuantity: number;
  availableQuantity: number;
}

export interface RentalCalendarData {
  rentalItemId: number;
  name: string;
  totalStock: number;
  year: number;
  month: number;
  calendar: Record<string, RentalCalendarEntry>;
}

export interface RentalCalendarItem {
  rentalItemId: number;
  name: string;
  itemType: RentalItemType;
  itemTypeLabel: string;
  totalStock: number;
  calendar: Record<string, RentalCalendarEntry>;
}

export interface RentalCalendarBulkData {
  year: number;
  month: number;
  items: RentalCalendarItem[];
}

export interface RentalItemCreateRequest {
  itemType: RentalItemType;
  salesType: SalesType;
  name: string;
  price: number;
  totalStock: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface RentalItemUpdateRequest {
  salesType?: SalesType;
  name?: string;
  description?: string;
  price?: number;
  totalStock?: number;
  imageUrl?: string;
  isActive?: boolean;
}

// ========================================
// 청소·침구류 예약 관리 (Service Tasks)
// ========================================

export type ServiceTaskType = 'CLEANING' | 'BEDDING_DELIVERY' | 'BEDDING_RETRIEVAL';
export type ServiceTaskStatus = 'PENDING' | 'RESERVED' | 'COMPLETED' | 'ISSUE';

export interface ServiceTask {
  id: number;
  contractId: number;
  roomName: string;
  taskType: ServiceTaskType;
  referenceDate: string;       // YYYY-MM-DD
  dDay: number;                // 양수=D-n, 0=D-day, 음수=초과
  quantity: number | null;     // CLEANING은 null
  status: ServiceTaskStatus;
  vendorName: string | null;
  vendorContact: string | null;
  vendorRefNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTaskListParams {
  tab?: 'pending' | 'all';
  task_type?: ServiceTaskType;
  status?: ServiceTaskStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ServiceTaskListResponse {
  total: number;
  page: number;
  limit: number;
  items: ServiceTask[];
}

export interface ServiceTaskUpdateRequest {
  status: ServiceTaskStatus;
  vendorName?: string;
  vendorContact?: string;
  vendorRefNo?: string;
  reservedAmount?: number;
  actualAmount?: number;
  note?: string;
  issueNote?: string;
}

export interface ServiceTaskLog {
  id: number;
  fromStatus: ServiceTaskStatus | null;
  toStatus: ServiceTaskStatus;
  changedBy: string;
  adminId: number | null;
  adminName: string | null;
  clearedVendorName: string | null;
  clearedVendorContact: string | null;
  clearedVendorRefNo: string | null;
  clearedReservedAmount: number | null;
  clearedActualAmount: number | null;
  issueNote: string | null;
  note: string | null;
  createdAt: string;
}

export interface ServiceTaskDetail extends ServiceTask {
  checkInDate: string;
  checkOutDate: string;
  reservedAmount: number | null;
  actualAmount: number | null;
  issueNote: string | null;
  logs: ServiceTaskLog[];
}

// ========================================
// 알림 큐 (Notification Queue) 관련 타입
// ========================================

export type NotificationQueueJobType =
  | 'checkin-today'
  | 'option-deadline'
  | 'checkout-reminder'
  | 'checkout-eve'
  | 'checkout-today'
  | 'payment-pending';

export type NotificationQueueJobState =
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'failed'
  | 'completed';

export interface NotificationQueueJob {
  jobId: string;
  type: NotificationQueueJobType;
  contractId: number;
  scheduledAt: string;
  fireAt: string;
  remainingMs: number;
}

export interface NotificationQueueStats {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
}

export interface NotificationQueueStatsResponse {
  stats: NotificationQueueStats;
  jobs: NotificationQueueJob[];
  byType: Record<NotificationQueueJobType, NotificationQueueJob[]>;
}

export interface NotificationQueueContractJob {
  type: NotificationQueueJobType;
  jobId: string;
  delay: number;
  scheduledAt: string;
  state: NotificationQueueJobState;
}

export interface NotificationQueueContractResponse {
  contractId: number;
  scheduled: NotificationQueueContractJob[];
}

export type NotificationMissingType =
  | 'checkin-today'
  | 'option-deadline'
  | 'checkout-reminder'
  | 'checkout-eve'
  | 'checkout-today';

export interface NotificationMissingItem {
  contractId: number;
  status: string;
  missingType: NotificationMissingType;
  checkInDate: string;
  checkOutDate: string;
  fireAt: string;
}

export interface NotificationMissingResponse {
  missingCount: number;
  missing: NotificationMissingItem[];
}

export interface NotificationRecoverRequest {
  contractId: number;
  type: NotificationMissingType;
}

export interface NotificationRecoverResponse {
  contractId: number;
  type: NotificationMissingType;
  fireAt: string;
}

// ============ 프로모션 이벤트 관리 ============
export type PromotionTargetRole = 'HOST' | 'GUEST';
export type PromotionBenefitType = 'HOST_FEE_WAIVER' | 'GUEST_DISCOUNT';
export type PromotionApplyTrigger = 'CONTRACT' | 'SETTLEMENT';
export type PromotionBenefitStatus = 'ACTIVE' | 'VOIDED';

export type PromotionVoidedReason =
  | 'REJECTED'
  | 'CANCELLED_BY_GUEST'
  | 'CANCELLED_BY_HOST'
  | 'CANCELLED_BY_ADMIN_WITH_REFUND'
  | 'CANCELLED_BY_ADMIN_NO_REFUND'
  | 'APPROVAL_EXPIRED'
  | 'PAYMENT_EXPIRED'
  | 'SETTLEMENT_ON_HOLD';

export interface PromotionStats {
  participantCount: number;
  consumedCount: number;
  activeBenefitCount: number;
}

export interface PromotionEvent {
  id: number;
  code: string;
  name: string;
  description: string | null;
  targetRole: PromotionTargetRole;
  benefitType: PromotionBenefitType;
  discountAmount: number;
  participantLimit: number | null;
  applyTrigger: PromotionApplyTrigger;
  applyOnce: boolean;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  stats?: PromotionStats;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionListResponse {
  events: PromotionEvent[];
}

export interface PromotionCreateRequest {
  code: string;
  name: string;
  description?: string | null;
  targetRole: PromotionTargetRole;
  benefitType: PromotionBenefitType;
  discountAmount: number;
  participantLimit?: number | null;
  applyTrigger: PromotionApplyTrigger;
  applyOnce?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
}

export interface PromotionUpdateRequest {
  name?: string;
  description?: string | null;
  discountAmount?: number;
  participantLimit?: number | null;
  applyOnce?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
}

export interface PromotionParticipant {
  id: number;
  userId: number;
  userEmail: string;
  userName: string | null;
  appliedAt: string;
  notifiedAt: string | null;
  consumed: boolean;
  consumedAt: string | null;
  consumedContract: {
    id: number;
    orderId: string;
    status: string;
  } | null;
}

export interface PromotionParticipantListResponse {
  participants: PromotionParticipant[];
}

export interface PromotionContractBenefit {
  id: number;
  contractId: number;
  orderId: string;
  contractStatus: string;
  guestId: number;
  hostId: number;
  benefitType: PromotionBenefitType;
  discountAmount: number;
  status: PromotionBenefitStatus;
  appliedAt: string;
  voidedAt: string | null;
  voidedReason: PromotionVoidedReason | null;
}

export interface PromotionBenefitListResponse {
  benefits: PromotionContractBenefit[];
}

// ============ 중개인 관리 ============
export type BrokerType = 'individual' | 'business';
export type BrokerStatus = 'active' | 'inactive';

export interface Broker {
  id: number;
  name: string;
  phone: string;
  brokerType: BrokerType;
  taxId: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  startDate: string;
  endDate: string;
  status: BrokerStatus;
  currentRate: number | null;
  hostCount: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerRate {
  id: number;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface BrokerHostMapping {
  id: number;
  hostId: number;
  hostName: string | null;
  hostNickname: string | null;
  hostPhone: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface BrokerListResponse {
  brokers: Broker[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BrokerDetailResponse {
  broker: Broker;
  rates: BrokerRate[];
  hostMappings: BrokerHostMapping[];
}

export interface BrokerListParams {
  page?: number;
  limit?: number;
  status?: BrokerStatus;
  search?: string;
}

export interface BrokerCreateRequest {
  name: string;
  phone: string;
  brokerType: BrokerType;
  taxId?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  startDate: string;
  endDate: string;
  status?: BrokerStatus;
  memo?: string | null;
  initialRate?: number | null;
}

export interface BrokerUpdateRequest {
  name?: string;
  phone?: string;
  brokerType?: BrokerType;
  taxId?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  startDate?: string;
  endDate?: string;
  status?: BrokerStatus;
  memo?: string | null;
}

export interface BrokerRateAddRequest {
  rate: number;
  effectiveFrom?: string | null;
}

export interface BrokerHostAddRequest {
  hostId: number;
  startDate?: string | null;
}

// ============ 중개인 인센티브 ============
export type BrokerIncentiveStatus =
  | 'PENDING'
  | 'AGGREGATED'
  | 'PAID'
  | 'ON_HOLD'
  | 'CANCELLED';

export type BrokerPayoutStatus = 'PENDING' | 'PAID';

export interface BrokerIncentivePayout {
  payoutId: number;
  brokerId: number;
  brokerName: string;
  brokerPhone: string | null;
  brokerType: BrokerType;
  settlementMonth: string;
  contractCount: number;
  totalGross: number;
  totalWithholding: number;
  totalSupply: number;
  totalVat: number;
  totalNet: number;
  status: BrokerPayoutStatus;
  paidAt: string | null;
  paidByAdminId: number | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerIncentiveItem {
  id: number;
  contractId: number;
  orderId: string;
  hostId: number;
  hostName: string | null;
  hostNickname: string | null;
  checkInDate: string;
  paidAt: string;
  settlementExpectedDate: string;
  settlementStatus: string;
  baseFee: number;
  appliedRate: number;
  brokerType: BrokerType;
  grossAmount: number;
  withholdingAmount: number;
  supplyAmount: number;
  vatAmount: number;
  netAmount: number;
  status: BrokerIncentiveStatus;
}

export interface BrokerIncentiveMonthlySummary {
  totalBrokers: number;
  totalContracts: number;
  totalGross: number;
  totalNet: number;
  pendingCount: number;
  paidCount: number;
}

export interface BrokerIncentiveMonthlyListResponse {
  month: string;
  payouts: BrokerIncentivePayout[];
  summary: BrokerIncentiveMonthlySummary;
}

export interface BrokerIncentiveMonthlyDetailResponse {
  payout: BrokerIncentivePayout;
  incentives: BrokerIncentiveItem[];
}

export interface BrokerIncentiveMonthlyParams {
  month: string;
  status?: BrokerPayoutStatus;
}
