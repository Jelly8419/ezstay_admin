import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/common/Pagination';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatDate, formatDateTime } from '../../utils/format';
import type {
  MoveInCaseListItem,
  MoveInCaseListParams,
  MoveInCleaningStatus,
} from '../../types';
import {
  CLEANING_STATUS_CONFIG,
  CLEANING_STATUS_OPTIONS,
  getGroupStatusBadge,
} from './moveInCaseLabels';

const DEFAULT_LIMIT = 20;

export default function MoveInCaseList() {
  const navigate = useNavigate();

  // 데이터
  const [items, setItems] = useState<MoveInCaseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cleaningStatus, setCleaningStatus] = useState<
    MoveInCleaningStatus | 'all'
  >('all');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [checkOutFrom, setCheckOutFrom] = useState('');
  const [checkOutTo, setCheckOutTo] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: MoveInCaseListParams = {
        page,
        limit: DEFAULT_LIMIT,
      };
      if (search.trim()) params.search = search.trim();
      if (cleaningStatus !== 'all') params.cleaningStatus = cleaningStatus;
      if (checkInFrom) params.checkInFrom = checkInFrom;
      if (checkInTo) params.checkInTo = checkInTo;
      if (checkOutFrom) params.checkOutFrom = checkOutFrom;
      if (checkOutTo) params.checkOutTo = checkOutTo;

      const res = await moveInCaseService.getCases(params);
      setItems(res.items);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    cleaningStatus,
    checkInFrom,
    checkInTo,
    checkOutFrom,
    checkOutTo,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCleaningStatus('all');
    setCheckInFrom('');
    setCheckInTo('');
    setCheckOutFrom('');
    setCheckOutTo('');
    setPage(1);
  };

  const columns = [
    {
      key: 'id',
      title: '번호',
      width: '80px',
      render: (value: number) => (
        <span className="text-gray-700">{value}</span>
      ),
    },
    {
      key: 'address',
      title: '방 정보',
      render: (_: any, r: MoveInCaseListItem) => (
        <div>
          <div className="font-medium text-gray-900">{r.address}</div>
          {r.detailAddress && (
            <div className="text-xs text-gray-500 mt-0.5">
              {r.detailAddress}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'host',
      title: '임대인',
      render: (_: any, r: MoveInCaseListItem) => (
        <div>
          <div className="text-gray-900">{r.host.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.host.phoneNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'guest',
      title: '임차인',
      render: (_: any, r: MoveInCaseListItem) => (
        <div>
          <div className="text-gray-900">{r.guest.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.guest.phoneNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      title: '입주일 ~ 퇴실일',
      render: (_: any, r: MoveInCaseListItem) => (
        <div className="text-sm text-gray-700">
          <div>{formatDate(r.checkInDate)}</div>
          <div className="text-xs text-gray-500">
            ~ {formatDate(r.checkOutDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'cleaning',
      title: '청소 서비스',
      render: (_: any, r: MoveInCaseListItem) => {
        const cfg = CLEANING_STATUS_CONFIG[r.cleaning.status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'amenity',
      title: '입주용품',
      render: (_: any, r: MoveInCaseListItem) => {
        const badge = getGroupStatusBadge(r.amenity.status);
        if (!badge) return <span className="text-gray-400">-</span>;
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'bedding',
      title: '침구류 대여',
      render: (_: any, r: MoveInCaseListItem) => {
        const badge = getGroupStatusBadge(r.bedding.status);
        if (!badge) return <span className="text-gray-400">-</span>;
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      title: '등록일',
      render: (value: string) => (
        <span className="text-xs text-gray-700">{formatDateTime(value)}</span>
      ),
    },
    {
      key: 'actions',
      title: '관리',
      width: '120px',
      render: (_: any, r: MoveInCaseListItem) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/move-in-cases/${r.id}`);
          }}
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">입주 준비 서비스</h1>
          <p className="text-sm text-gray-500 mt-1">
            총 {total.toLocaleString('ko-KR')}건의 케이스
          </p>
        </div>
      </div>

      {/* 검색바 */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="방 이름, 주소, 임대인, 임차인 검색"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              청소 상태
            </label>
            <select
              value={cleaningStatus}
              onChange={(e) => {
                setPage(1);
                setCleaningStatus(
                  e.target.value as MoveInCleaningStatus | 'all'
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CLEANING_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              입주일 범위
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={checkInFrom}
                onChange={(e) => {
                  setPage(1);
                  setCheckInFrom(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={checkInTo}
                onChange={(e) => {
                  setPage(1);
                  setCheckInTo(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              퇴실일 범위
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={checkOutFrom}
                onChange={(e) => {
                  setPage(1);
                  setCheckOutFrom(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={checkOutTo}
                onChange={(e) => {
                  setPage(1);
                  setCheckOutTo(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <Button variant="secondary" size="sm" onClick={handleResetFilters}>
            필터 초기화
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <Table<MoveInCaseListItem>
              columns={columns}
              data={items}
              onRowClick={(r) => navigate(`/move-in-cases/${r.id}`)}
            />
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
