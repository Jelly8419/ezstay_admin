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

// 회원 상세 정보 (관리자용)
export interface UserDetail extends User {
  accountTypeDetail: AccountTypeDetail;
  hasVerifiedBankAccount: boolean;
  bankAccounts: BankAccount[];
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
  | 'PAYMENT_COMPLETED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

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
