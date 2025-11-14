import { useState } from 'react';
import { History } from 'lucide-react';
import type { PasswordHistory } from '../../types/roomManagement';
import roomManagementService from '../../services/roomManagementService';

interface PasswordManagementProps {
  roomId: number;
  currentPassword: string;
  onPasswordChange: () => void;
}

export default function PasswordManagement({
  roomId,
  currentPassword,
  onPasswordChange,
}: PasswordManagementProps) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [histories, setHistories] = useState<PasswordHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (!/^\d{4,8}$/.test(newPassword)) {
      alert('비밀번호는 4~8자리 숫자만 가능합니다.');
      return;
    }

    try {
      setLoading(true);
      await roomManagementService.updatePassword(roomId, newPassword);
      alert('비밀번호가 변경되었습니다.');
      setNewPassword('');
      onPasswordChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPasswordHistory = async () => {
    try {
      setHistoryLoading(true);
      setShowHistory(true);
      const response = await roomManagementService.getPasswordHistory(roomId);
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

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                새 비밀번호
              </label>
              <span className="text-sm text-gray-500">
                현재 비밀번호: <span className="font-mono font-medium">{currentPassword}</span>
              </span>
            </div>

            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새로운 비밀번호를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              4~8자리 숫자만 입력 가능합니다
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '비밀번호 변경 및 알림 발송'}
            </button>

            <button
              onClick={loadPasswordHistory}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <History size={16} />
              이력 조회
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 이력 모달 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">비밀번호 변경 이력</h3>
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
                          <td className="px-4 py-3 text-sm font-mono">
                            {history.previousPassword}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {history.newPassword}
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
