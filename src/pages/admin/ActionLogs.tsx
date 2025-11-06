import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { AlertCircle } from 'lucide-react';
import { AdminActionLog, ActionType, ResourceType } from '../../types';
import { api } from '../../services/api';

export const ActionLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<ActionType | 'all'>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadLogs();
  }, [currentPage, debouncedSearchQuery, actionTypeFilter, resourceTypeFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{
        logs: AdminActionLog[];
        pagination: { total: number; totalPages: number };
      }>('/admin/action-logs', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchQuery || undefined,
          actionType: actionTypeFilter !== 'all' ? actionTypeFilter : undefined,
          resourceType: resourceTypeFilter !== 'all' ? resourceTypeFilter : undefined,
        },
      });

      setLogs(response.logs);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('액션 로그 로드 실패:', err);
      setError('액션 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getActionTypeBadge = (actionType: ActionType) => {
    const badges: Record<
      ActionType,
      { variant: 'success' | 'info' | 'danger' | 'warning'; label: string }
    > = {
      CREATE: { variant: 'success', label: '생성' },
      UPDATE: { variant: 'info', label: '수정' },
      DELETE: { variant: 'danger', label: '삭제' },
      APPROVE: { variant: 'success', label: '승인' },
      REJECT: { variant: 'danger', label: '반려' },
      ACTIVATE: { variant: 'success', label: '활성화' },
      DEACTIVATE: { variant: 'warning', label: '비활성화' },
      SUSPEND: { variant: 'danger', label: '정지' },
      UNLOCK: { variant: 'success', label: '잠금해제' },
      EXPORT: { variant: 'info', label: '내보내기' },
      BULK_UPDATE: { variant: 'warning', label: '대량수정' },
    };

    const config = badges[actionType];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResourceTypeBadge = (resourceType: ResourceType) => {
    const labels: Record<ResourceType, string> = {
      USER: '사용자',
      PROPERTY: '매물',
      RESERVATION: '예약',
      PAYMENT: '결제',
      SETTLEMENT: '정산',
      INQUIRY: '문의',
      NOTIFICATION: '알림',
      ADMIN: '관리자',
      SYSTEM: '시스템',
    };

    return <Badge variant="secondary">{labels[resourceType]}</Badge>;
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '60px',
    },
    {
      key: 'adminName',
      title: '관리자',
      render: (value: string | null, record: AdminActionLog) => (
        <div>
          <div className="font-medium">{value || '알 수 없음'}</div>
          <div className="text-xs text-gray-500">{record.adminEmail}</div>
        </div>
      ),
    },
    {
      key: 'actionType',
      title: '액션',
      render: (value: ActionType) => getActionTypeBadge(value),
    },
    {
      key: 'resourceType',
      title: '리소스',
      render: (value: ResourceType) => getResourceTypeBadge(value),
    },
    {
      key: 'resourceId',
      title: '리소스 ID',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'description',
      title: '설명',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'createdAt',
      title: '일시',
      render: (value: string) =>
        new Date(value).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 액션 로그</h1>
        <p className="text-gray-500 mt-2">
          관리자의 모든 액션 내역을 조회하고 추적합니다
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="관리자 이름, 이메일로 검색"
            value={searchQuery}
            onChange={handleSearch}
          />
          <select
            value={actionTypeFilter}
            onChange={(e) => {
              setActionTypeFilter(e.target.value as ActionType | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 액션</option>
            <option value="CREATE">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
            <option value="APPROVE">승인</option>
            <option value="REJECT">반려</option>
            <option value="ACTIVATE">활성화</option>
            <option value="DEACTIVATE">비활성화</option>
            <option value="SUSPEND">정지</option>
            <option value="UNLOCK">잠금해제</option>
            <option value="EXPORT">내보내기</option>
            <option value="BULK_UPDATE">대량수정</option>
          </select>
          <select
            value={resourceTypeFilter}
            onChange={(e) => {
              setResourceTypeFilter(e.target.value as ResourceType | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 리소스</option>
            <option value="USER">사용자</option>
            <option value="PROPERTY">매물</option>
            <option value="RESERVATION">예약</option>
            <option value="PAYMENT">결제</option>
            <option value="SETTLEMENT">정산</option>
            <option value="INQUIRY">문의</option>
            <option value="NOTIFICATION">알림</option>
            <option value="ADMIN">관리자</option>
            <option value="SYSTEM">시스템</option>
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
                onClick={loadLogs}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                총{' '}
                <span className="font-semibold text-gray-900">
                  {totalCount.toLocaleString()}
                </span>
                건
              </div>
            </div>
            <Table columns={columns} data={logs} />
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
