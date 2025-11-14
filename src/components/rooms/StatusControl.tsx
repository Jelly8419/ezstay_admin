import { useState } from 'react';
import type { RoomStatus } from '../../types/roomManagement';
import roomManagementService from '../../services/roomManagementService';

interface StatusControlProps {
  roomId: number;
  currentStatus: RoomStatus;
  onStatusChange: () => void;
}

export default function StatusControl({
  roomId,
  currentStatus,
  onStatusChange,
}: StatusControlProps) {
  const [status, setStatus] = useState<RoomStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await roomManagementService.updateRoomStatus(roomId, status, reason);
      alert('방 상태가 변경되었습니다.');
      onStatusChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">게시 상태</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            게시 상태 변경
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RoomStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="published">게시 중</option>
            <option value="hidden_by_admin">비게시</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            현재 상태:{' '}
            <span className="font-medium">
              {currentStatus === 'published' ? '게시 중' : '비게시'}
            </span>
          </p>
        </div>

        {status === 'hidden_by_admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비게시 사유 (선택사항)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="비게시 사유를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
