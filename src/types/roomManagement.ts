// 방 정보 관리 관련 타입 정의

export interface RoomInfo {
  id: number;
  roomName: string;
  status: 'published' | 'hidden_by_admin';
  entrancePassword: string;
  address: string;
  detailAddress: string;
  dailyRent: number;
  createdAt: string;
  updatedAt: string;
}

export interface HostInfo {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface Contract {
  id: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
}

export interface Memo {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordHistory {
  id: number;
  previousPassword: string;
  newPassword: string;
  reason?: string;
  changedBy: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface StatusHistory {
  id: number;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RoomManagementData {
  roomInfo: RoomInfo;
  hostInfo: HostInfo;
  contracts: Contract[];
  memos: Memo[];
}

export interface PasswordHistoryResponse {
  histories: PasswordHistory[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface StatusHistoryResponse {
  total: number;
  histories: StatusHistory[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type RoomStatus = 'published' | 'hidden_by_admin';
export type ContractStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
