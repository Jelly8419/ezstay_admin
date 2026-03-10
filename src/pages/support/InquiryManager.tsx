import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RichTextEditor } from '../../components/support/RichTextEditor';
import { AlertCircle, MessageSquare, User, Calendar } from 'lucide-react';
import { inquiryApi } from '../../services/supportApi';
import type { InquiryDetail, InquiryCategoryType } from '../../types';

const getStatusBadgeVariant = (
  status: string
): 'warning' | 'success' | 'default' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'answered':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '확인중';
    case 'answered':
      return '답변완료';
    case 'closed':
      return '종료';
    default:
      return status;
  }
};

const getCategoryLabel = (category?: InquiryCategoryType): string => {
  if (!category) return '-';
  switch (category) {
    case 'general':
      return '일반';
    case 'reservation':
      return '예약';
    case 'payment':
      return '결제';
    case 'room':
      return '방';
    case 'account':
      return '계정';
    case 'other':
      return '기타';
    default:
      return category;
  }
};

const getCategoryBadgeVariant = (
  category?: InquiryCategoryType
): 'default' | 'success' | 'warning' | 'danger' => {
  if (!category) return 'default';
  switch (category) {
    case 'reservation':
      return 'success';
    case 'payment':
      return 'warning';
    case 'room':
      return 'default';
    default:
      return 'default';
  }
};

export const InquiryManager: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 상세/답변 모달
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDetail | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    answered: 0,
    closed: 0,
  });

  useEffect(() => {
    loadInquiries();
  }, [currentPage, statusFilter, categoryFilter]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inquiryApi.getInquiries({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        categoryType: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchKeyword || undefined,
      });
      setInquiries(response?.items || []);
      setTotalPages(response?.pagination?.totalPages || 1);

      // 통계 계산 (실제로는 백엔드에서 제공하는 것이 이상적)
      const allResponse = await inquiryApi.getInquiries({ limit: 1000 });
      const items = allResponse?.items || [];
      setStats({
        total: allResponse?.pagination?.total || 0,
        pending: items.filter((i) => i.status === 'pending').length,
        answered: items.filter((i) => i.status === 'answered').length,
        closed: items.filter((i) => i.status === 'closed').length,
      });
    } catch (err: any) {
      console.error('문의 목록 조회 실패:', err);
      setError(err.message || '문의 목록을 불러오는데 실패했습니다.');
      setInquiries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadInquiries();
  };

  const handleOpenDetailModal = async (inquiry: InquiryDetail) => {
    try {
      const detail = await inquiryApi.getInquiryById(inquiry.id);
      setSelectedInquiry(detail);
      setAnswerText(detail.answer || '');
      setIsEditingAnswer(false);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      console.error('문의 상세 조회 실패:', err);
      alert(err.message || '문의 상세 조회에 실패했습니다.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedInquiry) return;

    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditingAnswer) {
        await inquiryApi.updateAnswer(selectedInquiry.id, answerText);
      } else {
        await inquiryApi.answerInquiry(selectedInquiry.id, answerText);
      }
      alert(isEditingAnswer ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.');
      setIsEditingAnswer(false);
      setIsDetailModalOpen(false);
      loadInquiries();
    } catch (err: any) {
      console.error('답변 등록 실패:', err);
      alert(err.message || '답변 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedInquiry) return;

    try {
      setIsSubmitting(true);
      await inquiryApi.updateInquiryStatus(selectedInquiry.id, status);
      alert('상태가 변경되었습니다.');
      setIsDetailModalOpen(false);
      loadInquiries();
    } catch (err: any) {
      console.error('상태 변경 실패:', err);
      alert(err.message || '상태 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">문의를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">문의 로드 실패</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadInquiries}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">전체</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">확인중</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
            <div className="text-sm text-gray-600">답변완료</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-sm text-gray-600">종료</div>
          </div>
        </Card>
      </div>

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
                setStatusFilter('pending');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              확인중
            </button>
            <button
              onClick={() => {
                setStatusFilter('answered');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'answered'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              답변완료
            </button>
            <button
              onClick={() => {
                setStatusFilter('closed');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              종료
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">모든 카테고리</option>
              <option value="general">일반</option>
              <option value="reservation">예약</option>
              <option value="payment">결제</option>
              <option value="room">방</option>
              <option value="account">계정</option>
              <option value="other">기타</option>
            </select>
            <input
              type="text"
              placeholder="제목 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </div>
      </Card>

      {/* 문의 목록 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
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
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    문의가 없습니다.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getCategoryBadgeVariant(inquiry.categoryType)}
                        size="sm"
                      >
                        {getCategoryLabel(inquiry.categoryType)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {inquiry.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.user?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                        {getStatusLabel(inquiry.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDetailModal(inquiry)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        상세
                      </Button>
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

      {/* 문의 상세/답변 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`문의 상세 #${selectedInquiry?.id}`}
        size="xl"
        footer={
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              {selectedInquiry?.status === 'pending' && (
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={isSubmitting}
                >
                  종료
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDetailModalOpen(false)}
                disabled={isSubmitting}
              >
                닫기
              </Button>
              {selectedInquiry?.status === 'pending' && (
                <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
                  {isSubmitting ? '답변 등록 중...' : '답변 등록'}
                </Button>
              )}
              {selectedInquiry?.status === 'answered' && !isEditingAnswer && (
                <Button variant="secondary" onClick={() => setIsEditingAnswer(true)}>
                  답변 수정
                </Button>
              )}
              {selectedInquiry?.status === 'answered' && isEditingAnswer && (
                <>
                  <Button variant="secondary" onClick={() => { setIsEditingAnswer(false); setAnswerText(selectedInquiry?.answer || ''); }}>
                    취소
                  </Button>
                  <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
                    {isSubmitting ? '수정 중...' : '수정 완료'}
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedInquiry && (
          <div className="space-y-6">
            {/* 작성자 정보 */}
            <Card>
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedInquiry.user?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedInquiry.user?.email}
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <Badge variant={getCategoryBadgeVariant(selectedInquiry.categoryType)}>
                    {getCategoryLabel(selectedInquiry.categoryType)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(selectedInquiry.status)}>
                    {getStatusLabel(selectedInquiry.status)}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* 문의 내용 */}
            <div>
              <h3 className="text-lg font-bold mb-2">{selectedInquiry.title}</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedInquiry.content}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(selectedInquiry.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>

            {/* 답변 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                답변 {selectedInquiry.status === 'answered' && '(답변 완료)'}
              </label>
              {selectedInquiry.status === 'answered' && selectedInquiry.answer && !isEditingAnswer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedInquiry.answer}
                  </p>
                  {selectedInquiry.answeredAt && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-700">
                      <Calendar className="w-4 h-4" />
                      <span>
                        답변일: {new Date(selectedInquiry.answeredAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <RichTextEditor
                  value={answerText}
                  onChange={setAnswerText}
                  rows={8}
                  disabled={selectedInquiry.status === 'closed'}
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
