import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RichTextEditor } from '../../components/support/RichTextEditor';
import { Plus, Edit, Trash2, Eye, AlertCircle, Star } from 'lucide-react';
import { noticeApi } from '../../services/supportApi';
import type { Notice, NoticeStatus, NoticeFormData } from '../../types';

const getStatusBadgeVariant = (
  status: NoticeStatus
): 'warning' | 'success' | 'default' => {
  switch (status) {
    case 'draft':
      return 'warning';
    case 'published':
      return 'success';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: NoticeStatus): string => {
  switch (status) {
    case 'draft':
      return '임시저장';
    case 'published':
      return '게시중';
    case 'archived':
      return '보관';
    default:
      return status;
  }
};

export const NoticeManager: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 모달
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    isImportant: false,
    publishedAt: null,
    expiresAt: null,
    status: 'draft',
  });

  useEffect(() => {
    loadNotices();
  }, [currentPage, statusFilter]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await noticeApi.getNotices({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        searchKeyword: searchKeyword || undefined,
      });
      setNotices(response?.items || []);
      setTotalPages(response?.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('공지사항 목록 조회 실패:', err);
      setError(err.message || '공지사항 목록을 불러오는데 실패했습니다.');
      setNotices([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadNotices();
  };

  const handleOpenFormModal = (notice?: Notice) => {
    if (notice) {
      setSelectedNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        isImportant: notice.isImportant,
        publishedAt: notice.publishedAt,
        expiresAt: notice.expiresAt,
        status: notice.status,
      });
    } else {
      setSelectedNotice(null);
      setFormData({
        title: '',
        content: '',
        isImportant: false,
        publishedAt: new Date().toISOString().slice(0, 16),
        expiresAt: null,
        status: 'draft',
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedNotice) {
        await noticeApi.updateNotice(selectedNotice.id, formData);
        alert('공지사항이 수정되었습니다.');
      } else {
        await noticeApi.createNotice(formData);
        alert('공지사항이 생성되었습니다.');
      }
      setIsFormModalOpen(false);
      loadNotices();
    } catch (err: any) {
      console.error('공지사항 저장 실패:', err);
      alert(err.message || '공지사항 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;

    try {
      setIsSubmitting(true);
      await noticeApi.deleteNotice(selectedNotice.id);
      alert('공지사항이 삭제되었습니다.');
      setIsDeleteModalOpen(false);
      loadNotices();
    } catch (err: any) {
      console.error('공지사항 삭제 실패:', err);
      alert(err.message || '공지사항 삭제에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && notices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && notices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">공지사항 로드 실패</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadNotices}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 및 검색 */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => {
                setStatusFilter('draft');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              임시저장
            </button>
            <button
              onClick={() => {
                setStatusFilter('published');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'published'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              게시중
            </button>
            <button
              onClick={() => {
                setStatusFilter('archived');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'archived'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              보관
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="제목 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button onClick={handleSearch}>검색</Button>
            <Button onClick={() => handleOpenFormModal()}>
              <Plus className="w-4 h-4 mr-2" />
              새 공지
            </Button>
          </div>
        </div>
      </Card>

      {/* 공지사항 목록 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  조회수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    공지사항이 없습니다.
                  </td>
                </tr>
              ) : (
                notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notice.isImportant && (
                        <Star className="w-4 h-4 inline text-yellow-500 mr-1" />
                      )}
                      {notice.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {notice.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(notice.status)}>
                        {getStatusLabel(notice.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Eye className="w-4 h-4 inline mr-1" />
                      {notice.viewCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenFormModal(notice)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(notice)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </Button>
          </div>
        )}
      </Card>

      {/* 공지사항 작성/수정 모달 */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedNotice ? '공지사항 수정' : '공지사항 작성'}
        size="xl"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="공지사항 제목"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 중요 공지 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isImportant"
              checked={formData.isImportant}
              onChange={(e) =>
                setFormData({ ...formData, isImportant: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isImportant" className="text-sm font-medium text-gray-700">
              중요 공지 (상단 고정)
            </label>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              rows={12}
            />
          </div>

          {/* 게시 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                게시 시작일
              </label>
              <input
                type="datetime-local"
                value={formData.publishedAt || ''}
                onChange={(e) =>
                  setFormData({ ...formData, publishedAt: e.target.value || null })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                게시 종료일 (선택)
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt || ''}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value || null })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as NoticeStatus })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">임시저장</option>
              <option value="published">게시중</option>
              <option value="archived">보관</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="공지사항 삭제"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-900">
            <strong>{selectedNotice?.title}</strong> 공지사항을 삭제하시겠습니까?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ 삭제된 공지사항은 복구할 수 없습니다.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
