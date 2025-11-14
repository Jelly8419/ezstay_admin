import { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import type { Memo } from '../../types/roomManagement';
import roomManagementService from '../../services/roomManagementService';

interface MemoSectionProps {
  roomId: number;
  memos: Memo[];
  onMemoChange: () => void;
}

export default function MemoSection({
  roomId,
  memos,
  onMemoChange,
}: MemoSectionProps) {
  const [newMemo, setNewMemo] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateMemo = async () => {
    if (!newMemo.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await roomManagementService.createMemo(roomId, newMemo);
      setNewMemo('');
      onMemoChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '메모 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setEditContent(memo.content);
  };

  const cancelEdit = () => {
    setEditingMemoId(null);
    setEditContent('');
  };

  const handleUpdateMemo = async (memoId: number) => {
    if (!editContent.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await roomManagementService.updateMemo(roomId, memoId, editContent);
      setEditingMemoId(null);
      setEditContent('');
      onMemoChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '메모 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await roomManagementService.deleteMemo(roomId, memoId);
      onMemoChange();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '메모 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">메모 작성</h3>

      {/* 새 메모 추가 폼 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          새 메모 추가
        </label>
        <textarea
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          placeholder="관리자 전용 메모를 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateMemo}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '추가 중...' : '메모 추가'}
        </button>
      </div>

      {/* 메모 목록 */}
      <div className="space-y-4">
        {memos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            작성된 메모가 없습니다.
          </div>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.id}
              className="border border-gray-200 rounded-md p-4 hover:shadow-sm transition-shadow"
            >
              {editingMemoId === memo.id ? (
                // 수정 모드
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateMemo(memo.id)}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      <Save size={14} />
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      <X size={14} />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 읽기 모드
                <>
                  <p className="text-gray-800 mb-3 whitespace-pre-wrap">
                    {memo.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {memo.createdBy} · {formatDate(memo.createdAt)}
                      {memo.updatedAt !== memo.createdAt && ' (수정됨)'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(memo)}
                        className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
