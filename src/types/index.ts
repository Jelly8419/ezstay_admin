// 사용자 관련 타입
export type UserType = 'local' | 'social';

export interface User {
  id: number;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  profileImageUrl: string | null;
  userType: UserType;
  isActive: boolean;
  lastLoginAt: string | null;
  // 약관 동의 정보
  serviceTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  marketingConsent: boolean;
  ageConfirmed: boolean;
  termsAgreedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 매물(Room) 관련 타입
export type RoomStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

export interface Room {
  id: number;
  hostId: number;
  // 기본 정보
  roomName: string;
  address: string;
  detailAddress: string;
  latitude: number | null;
  longitude: number | null;
  area: number;
  floor: string | null;
  buildingType: string;
  parkingAvailable: boolean;
  parkingInfo: string | null;
  elevatorAvailable: boolean;
  roomCount: number;
  bathroomCount: number;
  livingRoomCount: number;
  kitchenCount: number;
  isDuplex: boolean;
  entrancePassword: string | null;
  // 요금 정보 (1일 기준)
  dailyRent: number | null;
  dailyMaintenanceFee: number | null;
  maintenanceDetail: string | null;
  longTermWeeks: number | null;
  longTermDiscount: number | null;
  quickMoveIn: string | null;
  quickMoveInDiscount: number | null;
  includeElectricity: boolean;
  includeWater: boolean;
  includeGas: boolean;
  includeInternet: boolean;
  cleaningFee: number | null;
  minContractWeeks: number | null;
  refundPolicy: string | null;
  // 방 소개
  description: string | null;
  transportation: string | null;
  houseRules: string | null;
  // 상태 관리
  status: RoomStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 계약(Contract) 관련 타입
export type ContractStatus =
  | 'PENDING_APPROVAL'    // 승인 대기
  | 'APPROVED'            // 승인됨 (결제 대기)
  | 'REJECTED'            // 거절됨
  | 'PAYMENT_COMPLETED'   // 결제 완료
  | 'IN_PROGRESS'         // 계약 진행중 (체크인 완료)
  | 'COMPLETED'           // 계약 완료 (체크아웃 완료)
  | 'CANCELLED_BY_GUEST'  // 게스트 취소
  | 'CANCELLED_BY_HOST'   // 호스트 취소
  | 'REFUNDED'            // 환불 완료
  | 'APPROVAL_EXPIRED'    // 미승인 만료
  | 'PAYMENT_EXPIRED';    // 미결제 만료

export type DiscountType =
  | 'NONE'
  | 'LONG_TERM_DISCOUNT'
  | 'QUICK_MOVE_IN'
  | 'COUPON'
  | 'PROMOTIONAL';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'SIMPLE_PAY';

export interface Contract {
  id: number;
  roomId: number;
  hostId: number;
  guestId: number;
  // 체크인/체크아웃 정보
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
  totalWeeks: number | null;
  // 금액 정보
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  rentalItemsFee: number;
  platformFee: number;
  discountAmount: number;
  discountType: DiscountType | null;
  discountCode: string | null;
  // 계산된 금액
  subtotal: number;
  totalUsageFee: number;
  deposit: number;
  finalTotalAmount: number;
  // 렌탈 아이템 정보
  rentalItems: any; // JSON 저장
  // 결제 정보
  paymentMethod: PaymentMethod | null;
  installmentMonths: number;
  // 메시지 및 요청사항
  guestMessage: string | null;
  hostMessage: string | null;
  cancellationReason: string | null;
  // 특별 요청사항
  specialRequests: any; // JSON 저장
  // 약관 동의 정보
  termsAgreed: any; // JSON 저장
  // 가격 스냅샷
  pricingSnapshot: any; // JSON 저장
  // 계약 상태
  status: ContractStatus;
  // 계약 진행 시점 기록
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 렌탈 아이템 관련 타입
export type RentalItemType =
  | 'hair_dryer'
  | 'bedding_set'
  | 'amenity_kit'
  | 'towel_set'
  | 'other';

export interface RentalItem {
  id: number;
  itemType: RentalItemType;
  name: string;
  description: string | null;
  price: number;
  totalStock: number;
  availableStock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 렌탈 아이템 예약 관련 타입
export type RentalItemReservationStatus =
  | 'RESERVED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RentalItemReservation {
  id: number;
  contractId: number;
  rentalItemId: number;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  reservedFrom: string;
  reservedUntil: string;
  status: RentalItemReservationStatus;
  createdAt: string;
  updatedAt: string;
}
