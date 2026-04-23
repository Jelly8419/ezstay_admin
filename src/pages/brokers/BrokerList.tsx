import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { brokerService } from '../../services/brokerService';
import type {
  Broker,
  BrokerCreateRequest,
  BrokerListParams,
  BrokerStatus,
  BrokerUpdateRequest,
} from '../../types';
import {
  brokerStatusLabel,
  brokerTypeLabel,
  formatDate,
  formatRate,
} from './brokerLabels';
import BrokerFormModal from './BrokerFormModal';

export const BrokerList: React.FC = () => {
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<BrokerStatus | ''>('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: BrokerListParams = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await brokerService.list(params);
      setBrokers(res.brokers);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (
    body: BrokerCreateRequest | BrokerUpdateRequest
  ) => {
    await brokerService.create(body as BrokerCreateRequest);
    setPage(1);
    await load();
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns = [
    {
      key: 'name',
      title: '중개인',
      render: (_: any, r: Broker) => (
        <div>
          <div className="font-medium text-gray-900">{r.name}</div>
          <div className="text-xs text-gray-500">{r.phone}</div>
        </div>
      ),
    },
    {
      key: 'brokerType',
      title: '구분',
      render: (_: any, r: Broker) => (
        <div>
          <Badge variant={r.brokerType === 'business' ? 'primary' : 'info'}>
            {brokerTypeLabel[r.brokerType]}
          </Badge>
          {r.brokerType === 'business' && r.taxId && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              {r.taxId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'currentRate',
      title: '현재 요율',
      render: (_: any, r: Broker) => (
        <span className="font-medium">{formatRate(r.currentRate)}</span>
      ),
    },
    {
      key: 'hostCount',
      title: '귀속 임대인',
      render: (_: any, r: Broker) => (
        <span className="text-sm">{r.hostCount}명</span>
      ),
    },
    {
      key: 'period',
      title: '활동 기간',
      render: (_: any, r: Broker) => (
        <div className="text-xs text-gray-600">
          <div>{formatDate(r.startDate)}</div>
          <div className="text-gray-400">~ {formatDate(r.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: Broker) => (
        <Badge variant={r.status === 'active' ? 'success' : 'default'}>
          {brokerStatusLabel[r.status]}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: '생성일',
      render: (_: any, r: Broker) => (
        <span className="text-xs text-gray-500">
          {formatDate(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">중개인 관리</h1>
            <p className="text-sm text-gray-500">
              부동산 파트너를 등록하고 요율 / 귀속 임대인을 관리합니다.
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 inline-block mr-1" />
          중개인 등록
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <form onSubmit={onSearch} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <Input
              label="검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="이름 또는 연락처"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as BrokerStatus | '');
              }}
            >
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <Button type="submit">
            <Search className="w-4 h-4 inline-block mr-1" />
            검색
          </Button>
        </form>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={brokers}
              onRowClick={(r) => navigate(`/brokers/${r.id}`)}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">총 {total}명</div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    이전
                  </Button>
                  <span className="text-sm py-1">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <BrokerFormModal
        isOpen={formOpen}
        mode="create"
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default BrokerList;
