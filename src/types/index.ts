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
  hostRoomsCount: number;
  guestReservationsCount: number;
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
  orderId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
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
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  platformFee: number;
  finalTotalAmount: number;
  paidAt: string | null;
  guest: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  host: {
    id: number;
    name: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
    photos?: Array<{ id: number; url: string; order: number }>;
  };
  createdAt: string;
}

// 정산(Settlement) 관련 타입
export type SettlementStatus = 'pending' | 'completed' | 'on_hold';

export interface Settlement {
  contractId: number;
  contractNumber: string;
  host: {
    id: number;
    name: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
  };
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  rentalDays: number;
  settlementAmount: number;
  settlementDate: string;
  status: SettlementStatus;
  statusLabel: string;
  settlementCompletedAt: string | null;
  settlementNote: string | null;
  hasRefund: boolean;
  refundAmount: number;
}

export interface SettlementSummary {
  pendingCount: number;
  completedCount: number;
  onHoldCount: number;
}

// 결제(Payment) 관련 타입
export type PaymentMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER' | 'MOBILE' | 'EASY_PAY';
export type PaymentStatus = 'READY' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';

export interface Payment {
  id: number;
  contractId: number;
  contractOrderId: string;
  paymentKey: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  totalAmount: number;
  balanceAmount: number;
  requestedAt: string;
  approvedAt: string | null;
  createdAt: string;
  guest: {
    id: number;
    name: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
  };
  contractStatus: string;
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

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
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

export type RentalOrderStatus = 'PENDING' | 'PAID' | 'PARTIAL_REFUND' | 'FULL_REFUND' | 'CANCELLED';
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
  rentalOrderId: string;
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
  refundId?: number;
  totalRefundAmount?: number;
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
  refundId?: number;
  totalRefundAmount?: number;
  hostBurdenAmount?: number;
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
// 보증금 보류 관련 타입
// ========================================

export type DepositHoldStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RELEASED';

export interface DepositHold {
  id: number;
  contractId: number;
  holdAmount: number;
  reason: string;
  status: DepositHoldStatus;
  contract?: {
    id: number;
    orderId: string;
    checkInDate: string;
    checkOutDate: string;
    guest: { id: number; name: string; email: string; phoneNumber?: string };
    host: { id: number; name: string; email: string };
    room: { id: number; roomName: string; address?: string };
  };
  adminNotes?: string;
  rejectionReason?: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepositHoldDetail extends DepositHold {}

export interface CreateDepositHoldRequest {
  contractId: number;
  holdAmount: number;
  reason: string;
}

// ========================================
// 영수증 관련 타입
// ========================================

export interface Receipt {
  id: number;
  contractId: number;
  orderId: string;
  receiptType: string;
  status: string;
  totalAmount: number;
  issuedAt: string;
  receiptUrl?: string;
  guest?: { id: number; name: string; email: string };
  room?: { id: number; roomName: string };
  createdAt: string;
}

export interface ReceiptDetail extends Receipt {
  contract?: {
    id: number;
    orderId: string;
    checkInDate: string;
    checkOutDate: string;
    finalTotalAmount: number;
    rentalFee: number;
    maintenanceFee: number;
    cleaningFee: number;
    platformFee: number;
  };
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

export interface AlimtalkTemplate {
  eventName: string | null;
  tplCode: string | null;
  eventLabel: string | null;
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
