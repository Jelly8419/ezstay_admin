import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/common/SearchBar';
import { Eye, AlertCircle } from 'lucide-react';
import { propertyService, Property } from '../../services/roomService';
import type { PropertySource } from '../../types';
import {
  getStatusBadgeVariant,
  getStatusLabel,
  isPending,
} from '../../utils/propertyStatus';

const SOURCE_TABS: Array<{ value: PropertySource; label: string }> = [
  { value: 'internal', label: '정식 매물' },
  { value: 'move_in', label: '입주 준비' },
];

const STATUS_OPTIONS: Record<PropertySource, Array<{ value: string; label: string }>> = {
  internal: [
    { value: 'pending_review', label: '심사 대기' },
    { value: 'approved', label: '승인' },
    { value: 'rejected', label: '반려' },
    { value: 'all', label: '전체' },
  ],
  move_in: [
    { value: 'PENDING', label: '심사 대기' },
    { value: 'APPROVED', label: '사용 가능' },
    { value: 'REJECTED', label: '심사 거절' },
    { value: 'all', label: '전체' },
  ],
};

const DEFAULT_STATUS: Record<PropertySource, string> = {
  internal: 'pending_review',
  move_in: 'PENDING',
};

const PENDING_STATUS: Record<PropertySource, string> = {
  internal: 'pending_review',
  move_in: 'PENDING',
};

export const RoomReview: React.FC = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState<PropertySource>('internal');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(DEFAULT_STATUS.internal);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 도메인별 카운트 (탭 라벨에 표시)
  const [counts, setCounts] = useState<Record<PropertySource, number>>({
    internal: 0,
    move_in: 0,
  });

  const statusOptions = useMemo(() => STATUS_OPTIONS[source], [source]);

  useEffect(() => {
    loadProperties();
  }, [statusFilter, source]);

  // source 변경 시 statusFilter 를 해당 도메인의 기본값으로 리셋
  useEffect(() => {
    setStatusFilter(DEFAULT_STATUS[source]);
  }, [source]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const pendingValue = PENDING_STATUS[source];

      if (statusFilter === pendingValue) {
        const response = await propertyService.getPendingReviewProperties(1, 20, source);
        setProperties(response.properties);
      } else {
        const response = await propertyService.getProperties({
          source,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setProperties(response.properties);
      }

      // 탭 카운트 갱신 (각 도메인 전체 개수)
      const [internalAll, moveInAll] = await Promise.all([
        propertyService.getProperties({ source: 'internal', limit: 1 }),
        propertyService.getProperties({ source: 'move_in', limit: 1 }),
      ]);
      setCounts({
        internal: internalAll.pagination?.total ?? internalAll.properties.length,
        move_in: moveInAll.pagination?.total ?? moveInAll.properties.length,
      });
    } catch (err) {
      console.error('방 목록 로드 실패:', err);
      setError('방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property);
    setReviewAction(action);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedProperty) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const rowSource = selectedProperty.source ?? source;

      if (reviewAction === 'approve') {
        await propertyService.approveProperty(selectedProperty.id, rowSource);
        alert('방이 승인되었습니다.');
      } else {
        await propertyService.rejectProperty(
          selectedProperty.id,
          rejectionReason,
          rowSource
        );
        alert('방이 반려되었습니다.');
      }

      setIsReviewModalOpen(false);
      setRejectionReason('');
      loadProperties();
    } catch (err: any) {
      console.error('방 심사 처리 실패:', err);
      const code = err?.response?.data?.code ?? err?.code;
      if (code === 4002) {
        alert('반려 사유는 필수입니다.');
      } else if (code === 4301 || code === 4302) {
        alert('이미 처리된 방입니다. 목록을 새로고침합니다.');
        setIsReviewModalOpen(false);
        loadProperties();
      } else {
        alert(err.message || '방 심사 처리에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const q = searchQuery.trim();
    if (!q) return true;
    return (
      property.roomName?.includes(q) ||
      property.address?.includes(q) ||
      property.host?.name?.includes(q)
    );
  });

  const columns = [
    {
      key: 'photos',
      title: '썸네일',
      width: '100px',
      render: (photos: Property['photos'], record: Property) => (
        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
          {record.source !== 'move_in' && photos && photos.length > 0 ? (
            <img
              src={photos[0].url}
              alt="방 썸네일"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
          )}
        </div>
      ),
    },
    {
      key: 'roomName',
      title: '방 제목',
      render: (value: string, record: Property) => (
        <div>
          <div className="font-medium">{value || '(이름 없음)'}</div>
          <div className="text-xs text-gray-500">ID: {record.id}</div>
        </div>
      ),
    },
    {
      key: 'address',
      title: '위치',
    },
    {
      key: 'host',
      title: '등록자',
      render: (host: Property['host']) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/users/${host.id}`);
          }}
          className="text-primary-600 hover:underline"
        >
          {host.name}
        </button>
      ),
    },
    {
      key: 'area',
      title: '면적',
      render: (value: number | undefined, record: Property) => {
        if (record.source === 'move_in' && record.areaPyeong != null) {
          return `${record.areaPyeong}평`;
        }
        return value != null ? `${value}㎡` : '-';
      },
    },
    {
      key: 'dailyRent',
      title: '일일 임대료',
      render: (value: number | null, record: Property) => {
        if (record.source === 'move_in') {
          return (
            <span className="text-gray-500 italic">
              {record.dailyRentLabel ?? '입주 준비 서비스'}
            </span>
          );
        }
        return value != null ? `₩${value.toLocaleString()}` : '-';
      },
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, record: Property) => (
        <Badge variant={getStatusBadgeVariant(record)}>{getStatusLabel(record)}</Badge>
      ),
    },
    {
      key: 'submittedAt',
      title: '제출일',
      render: (value: string | null) =>
        value ? new Date(value).toLocaleDateString('ko-KR') : '-',
    },
    {
      key: 'actions',
      title: '액션',
      width: '200px',
      render: (_: any, record: Property) => (
        <div className="flex gap-2">
          {isPending(record) && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewClick(record, 'approve');
                }}
              >
                승인
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewClick(record, 'reject');
                }}
              >
                반려
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/rooms/review/${record.id}?source=${record.source ?? source}`
              );
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">방 심사</h1>
        <p className="text-gray-500 mt-2">새로 등록된 방을 심사하고 승인/반려 처리합니다</p>
      </div>

      {/* 도메인 탭 */}
      <Card>
        <div className="flex gap-2">
          {SOURCE_TABS.map((tab) => {
            const isActive = source === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSource(tab.value)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {counts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="제목, 주소, 호스트명으로 검색"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-900 font-semibold mb-1">데이터 로드 실패</p>
              <p className="text-gray-500 mb-3">{error}</p>
              <button
                onClick={loadProperties}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredProperties}
            onRowClick={(record) =>
              navigate(
                `/rooms/review/${record.id}?source=${record.source ?? source}`
              )
            }
          />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setRejectionReason('');
        }}
        title={reviewAction === 'approve' ? '방 승인' : '방 반려'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReviewModalOpen(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'success' : 'danger'}
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '처리 중...'
                : reviewAction === 'approve'
                ? '승인하기'
                : '반려하기'}
            </Button>
          </div>
        }
      >
        {selectedProperty && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedProperty.roomName || '(이름 없음)'}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>위치: {selectedProperty.address}</p>
                <p>호스트: {selectedProperty.host.name}</p>
                <p>
                  제출일:{' '}
                  {selectedProperty.submittedAt
                    ? new Date(selectedProperty.submittedAt).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>
            </div>

            {reviewAction === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ 이 방을 승인하시겠습니까?
                  {selectedProperty.source === 'move_in'
                    ? ' 승인 후 호스트가 입주 준비 케이스를 등록할 수 있습니다.'
                    : ' 승인 후 호스트가 게시할 수 있습니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ⚠️ 이 방을 반려하시겠습니까? 반려 사유를 입력해주세요.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    반려 사유 *
                  </label>
                  <textarea
                    placeholder="상세한 반려 사유를 입력해주세요 (예: 평수 정보가 사실과 다릅니다.)"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
