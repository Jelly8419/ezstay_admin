import { useState } from 'react';
import { History } from 'lucide-react';
import type { RoomStatus, StatusHistory } from '../../types/roomManagement';
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
  const [showHistory, setShowHistory] = useState(false);
  const [histories, setHistories] = useState<StatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await roomManagementService.updateRoomStatus(roomId, status, reason);
      alert('방 상태가 변경되었습니다.');
      setReason('');
      onStatusChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatusHistory = async () => {
    try {
      setHistoryLoading(true);
      setShowHistory(true);
      const response = await roomManagementService.getStatusHistory(roomId);
      setHistories(response.histories);
    } catch (error: any) {
      alert('이력 조회에 실패했습니다.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (statusValue: string) => {
    return statusValue === 'published' ? '게시 중' : '비게시';
  };

  return (
    <>
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

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '저장'}
          </button>

          <button
            onClick={loadStatusHistory}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <History size={16} />
            이력 조회
          </button>
        </div>
      </div>
    </div>

    {/* 상태 변경 이력 모달 */}
    {showHistory && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">상태 변경 이력</h3>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {historyLoading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : histories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                변경 이력이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        변경 전
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        변경 후
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        사유
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        변경자
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        변경 일시
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {histories.map((history) => (
                      <tr key={history.id}>
                        <td className="px-4 py-3 text-sm">
                          {getStatusLabel(history.previousStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusLabel(history.newStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {history.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {history.changedBy}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(history.changedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
