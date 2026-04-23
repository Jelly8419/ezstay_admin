import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Pencil,
  Plus,
  Trash2,
  Percent,
  Users,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { brokerService } from '../../services/brokerService';
import type {
  Broker,
  BrokerCreateRequest,
  BrokerHostAddRequest,
  BrokerHostMapping,
  BrokerRate,
  BrokerRateAddRequest,
  BrokerUpdateRequest,
} from '../../types';
import {
  brokerStatusLabel,
  brokerTypeLabel,
  formatDate,
  formatDateTime,
  formatRate,
} from './brokerLabels';
import BrokerFormModal from './BrokerFormModal';
import RateAddModal from './RateAddModal';
import HostMapAddModal from './HostMapAddModal';

type TabKey = 'info' | 'rates' | 'hosts';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'info', label: '정보' },
  { key: 'rates', label: '요율 이력' },
  { key: 'hosts', label: '귀속 임대인' },
];

export const BrokerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const brokerId = Number(id);

  const [broker, setBroker] = useState<Broker | null>(null);
  const [rates, setRates] = useState<BrokerRate[]>([]);
  const [hostMappings, setHostMappings] = useState<BrokerHostMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brokerService.get(brokerId);
      setBroker(res.broker);
      setRates(res.rates);
      setHostMappings(res.hostMappings);
    } catch (e: any) {
      setError(e?.message || '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [brokerId]);

  useEffect(() => {
    if (!isNaN(brokerId)) load();
  }, [brokerId, load]);

  const handleUpdate = async (
    body: BrokerCreateRequest | BrokerUpdateRequest
  ) => {
    await brokerService.update(brokerId, body as BrokerUpdateRequest);
    await load();
  };

  const handleRateAdd = async (body: BrokerRateAddRequest) => {
    await brokerService.addRate(brokerId, body);
    await load();
  };

  const handleHostAdd = async (body: BrokerHostAddRequest) => {
    await brokerService.addHost(brokerId, body);
    await load();
  };

  const handleHostRemove = async (hostId: number, hostName: string | null) => {
    const label = hostName || `#${hostId}`;
    if (!window.confirm(`${label} 임대인의 귀속을 해제하시겠습니까?`)) return;
    try {
      await brokerService.removeHost(brokerId, hostId);
      await load();
    } catch (e: any) {
      alert(e?.message || '귀속 해제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">불러오는 중...</div>
    );
  }
  if (error || !broker) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/brokers')}>
          <ArrowLeft className="w-4 h-4 inline-block mr-1" />
          목록으로
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || '중개인을 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const activeHostCount = hostMappings.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/brokers')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{broker.name}</h1>
              <Badge variant={broker.status === 'active' ? 'success' : 'default'}>
                {brokerStatusLabel[broker.status]}
              </Badge>
              <Badge
                variant={broker.brokerType === 'business' ? 'primary' : 'info'}
              >
                {brokerTypeLabel[broker.brokerType]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">{broker.phone}</p>
          </div>
        </div>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="w-4 h-4 inline-block mr-1" />
          수정
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="현재 요율"
          value={formatRate(broker.currentRate)}
          icon={Percent}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
        />
        <StatCard
          title="활성 귀속 임대인"
          value={`${activeHostCount}명`}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="활동 상태"
          value={brokerStatusLabel[broker.status]}
          icon={Briefcase}
          iconColor={
            broker.status === 'active' ? 'text-green-600' : 'text-gray-600'
          }
          iconBgColor={
            broker.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
          }
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
              {t.key === 'rates' && rates.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  ({rates.length})
                </span>
              )}
              {t.key === 'hosts' && hostMappings.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  ({activeHostCount}/{hostMappings.length})
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'info' && <InfoTab broker={broker} />}
      {activeTab === 'rates' && (
        <RatesTab rates={rates} onAdd={() => setRateOpen(true)} />
      )}
      {activeTab === 'hosts' && (
        <HostsTab
          mappings={hostMappings}
          onAdd={() => setHostOpen(true)}
          onRemove={handleHostRemove}
        />
      )}

      <BrokerFormModal
        isOpen={editOpen}
        mode="edit"
        initial={broker}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
      />
      <RateAddModal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        onSubmit={handleRateAdd}
      />
      <HostMapAddModal
        isOpen={hostOpen}
        onClose={() => setHostOpen(false)}
        onSubmit={handleHostAdd}
      />
    </div>
  );
};

// ---------------- Info Tab ----------------
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-0">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="col-span-2 text-sm text-gray-900">{children}</div>
  </div>
);

const InfoTab: React.FC<{ broker: Broker }> = ({ broker }) => (
  <Card>
    <InfoRow label="중개인명">{broker.name}</InfoRow>
    <InfoRow label="연락처">{broker.phone}</InfoRow>
    <InfoRow label="구분">
      <Badge variant={broker.brokerType === 'business' ? 'primary' : 'info'}>
        {brokerTypeLabel[broker.brokerType]}
      </Badge>
      <span className="ml-2 text-xs text-gray-500">
        {broker.brokerType === 'business'
          ? '세금계산서 수취 · 공급가액/부가세 분리'
          : '기타소득 · 원천징수 8.8%'}
      </span>
    </InfoRow>
    {broker.brokerType === 'business' && (
      <InfoRow label="사업자등록번호">
        <span className="font-mono">{broker.taxId || '-'}</span>
      </InfoRow>
    )}
    <InfoRow label="지급 계좌">
      {broker.bankName ? (
        <div>
          <div>
            {broker.bankName} {broker.bankAccount}
          </div>
          <div className="text-xs text-gray-500">
            예금주: {broker.bankHolder || '-'}
          </div>
        </div>
      ) : (
        <span className="text-gray-400">미등록</span>
      )}
    </InfoRow>
    <InfoRow label="활동 기간">
      {formatDate(broker.startDate)} ~ {formatDate(broker.endDate)}
    </InfoRow>
    <InfoRow label="상태">
      <Badge variant={broker.status === 'active' ? 'success' : 'default'}>
        {brokerStatusLabel[broker.status]}
      </Badge>
    </InfoRow>
    <InfoRow label="현재 요율">{formatRate(broker.currentRate)}</InfoRow>
    <InfoRow label="귀속 임대인 수">{broker.hostCount}명</InfoRow>
    <InfoRow label="메모">{broker.memo || '-'}</InfoRow>
    <InfoRow label="생성일">{formatDateTime(broker.createdAt)}</InfoRow>
    <InfoRow label="수정일">{formatDateTime(broker.updatedAt)}</InfoRow>
  </Card>
);

// ---------------- Rates Tab ----------------
const RatesTab: React.FC<{ rates: BrokerRate[]; onAdd: () => void }> = ({
  rates,
  onAdd,
}) => {
  const columns = [
    {
      key: 'rate',
      title: '적용률',
      render: (_: any, r: BrokerRate) => (
        <span className="font-medium">{formatRate(r.rate)}</span>
      ),
    },
    {
      key: 'effectiveFrom',
      title: '적용 시작',
      render: (_: any, r: BrokerRate) => formatDateTime(r.effectiveFrom),
    },
    {
      key: 'effectiveTo',
      title: '적용 종료',
      render: (_: any, r: BrokerRate) =>
        r.effectiveTo ? (
          formatDateTime(r.effectiveTo)
        ) : (
          <Badge variant="success">현재 적용 중</Badge>
        ),
    },
    {
      key: 'createdAt',
      title: '생성일',
      render: (_: any, r: BrokerRate) => (
        <span className="text-xs text-gray-500">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">
          ℹ️ 과거 계약의 인센티브는 결제 승인 시점의 요율로 스냅샷되어
          변경되지 않습니다.
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 inline-block mr-1" />
          요율 추가
        </Button>
      </div>
      <Table columns={columns} data={rates} />
    </Card>
  );
};

// ---------------- Hosts Tab ----------------
const HostsTab: React.FC<{
  mappings: BrokerHostMapping[];
  onAdd: () => void;
  onRemove: (hostId: number, hostName: string | null) => void;
}> = ({ mappings, onAdd, onRemove }) => {
  const columns = [
    {
      key: 'host',
      title: '임대인',
      render: (_: any, r: BrokerHostMapping) => (
        <Link
          to={`/users/${r.hostId}`}
          className="text-primary-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-medium">
            #{r.hostId} {r.hostName || '-'}
          </div>
          <div className="text-xs text-gray-500">{r.hostPhone || '-'}</div>
        </Link>
      ),
    },
    {
      key: 'startDate',
      title: '귀속 시작',
      render: (_: any, r: BrokerHostMapping) => formatDateTime(r.startDate),
    },
    {
      key: 'endDate',
      title: '귀속 종료',
      render: (_: any, r: BrokerHostMapping) =>
        r.endDate ? formatDateTime(r.endDate) : '-',
    },
    {
      key: 'isActive',
      title: '상태',
      render: (_: any, r: BrokerHostMapping) =>
        r.isActive ? (
          <Badge variant="success">활성</Badge>
        ) : (
          <Badge variant="default">해제됨</Badge>
        ),
    },
    {
      key: 'action',
      title: '',
      render: (_: any, r: BrokerHostMapping) =>
        r.isActive ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemove(r.hostId, r.hostName)}
          >
            <Trash2 className="w-3 h-3 inline-block mr-1" />
            해제
          </Button>
        ) : null,
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">
          ℹ️ 해제(soft-end) 후 다른 중개인으로 재귀속 가능합니다.
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 inline-block mr-1" />
          임대인 귀속 추가
        </Button>
      </div>
      <Table columns={columns} data={mappings} />
    </Card>
  );
};

export default BrokerDetail;
