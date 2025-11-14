import { api } from './api';
import type {
  RoomManagementData,
  Memo,
  PasswordHistoryResponse,
  RoomStatus,
} from '../types/roomManagement';

class RoomManagementService {
  /**
   * 방 상세 정보 조회 (관리자 전용)
   */
  async getRoomManagement(roomId: number): Promise<RoomManagementData> {
    const data = await api.get<RoomManagementData>(`/admin/properties/${roomId}/management`);
    return data;
  }

  /**
   * 방 상태 변경
   * @param roomId 방 ID
   * @param status 변경할 상태 (published | hidden_by_admin)
   * @param reason 비게시 사유 (hidden_by_admin 시 선택사항)
   */
  async updateRoomStatus(
    roomId: number,
    status: RoomStatus,
    reason?: string
  ): Promise<void> {
    await api.patch(`/admin/properties/${roomId}/status`, { status, reason });
  }

  /**
   * 방 비밀번호 변경
   * @param roomId 방 ID
   * @param newPassword 새 비밀번호 (4~8자리 숫자)
   */
  async updatePassword(roomId: number, newPassword: string): Promise<void> {
    // 클라이언트 측 검증
    if (!/^\d{4,8}$/.test(newPassword)) {
      throw new Error('비밀번호는 4~8자리 숫자만 가능합니다');
    }
    await api.patch(`/admin/properties/${roomId}/password`, { newPassword });
  }

  /**
   * 비밀번호 변경 이력 조회
   * @param roomId 방 ID
   * @param limit 페이지당 항목 수
   * @param offset 건너뛸 항목 수
   */
  async getPasswordHistory(
    roomId: number,
    limit = 20,
    offset = 0
  ): Promise<PasswordHistoryResponse> {
    const data = await api.get<PasswordHistoryResponse>(
      `/admin/properties/${roomId}/password-history`,
      {
        params: { limit, offset },
      }
    );
    return data;
  }

  /**
   * 메모 생성
   * @param roomId 방 ID
   * @param content 메모 내용
   */
  async createMemo(roomId: number, content: string): Promise<Memo> {
    if (!content.trim()) {
      throw new Error('메모 내용을 입력해주세요');
    }
    const data = await api.post<Memo>(`/admin/properties/${roomId}/memos`, {
      content,
    });
    return data;
  }

  /**
   * 메모 수정
   * @param roomId 방 ID
   * @param memoId 메모 ID
   * @param content 수정할 메모 내용
   */
  async updateMemo(
    roomId: number,
    memoId: number,
    content: string
  ): Promise<Memo> {
    if (!content.trim()) {
      throw new Error('메모 내용을 입력해주세요');
    }
    const data = await api.patch<Memo>(
      `/admin/properties/${roomId}/memos/${memoId}`,
      { content }
    );
    return data;
  }

  /**
   * 메모 삭제
   * @param roomId 방 ID
   * @param memoId 메모 ID
   */
  async deleteMemo(roomId: number, memoId: number): Promise<void> {
    await api.delete(`/admin/properties/${roomId}/memos/${memoId}`);
  }
}

export default new RoomManagementService();
