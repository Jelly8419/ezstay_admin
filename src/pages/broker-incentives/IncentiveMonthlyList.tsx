import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Download, FileText, Users, Banknote } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { brokerIncentiveService } from '../../services/brokerIncentiveService';
import type {
  BrokerIncentivePayout,
  BrokerIncentiveMonthlySummary,
  BrokerPayoutStatus,
} from '../../types';
import {
  brokerTypeLabel,
  currentMonth,
  formatAmount,
  formatDateTime,
  isValidMonth,
  payoutStatusLabel,
} from '../brokers/brokerLabels';

export const IncentiveMonthlyList: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState<BrokerPayoutStatus | ''>('');
  const [payouts, setPayouts] = useState<BrokerIncentivePayout[]>([]);
  const [summary, setSummary] =
    useState<BrokerIncentiveMonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    if (!isValidMonth(month)) {
      setError('월 형식은 YYYY-MM 이어야 합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await brokerIncentiveService.getMonthly({
        month,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setPayouts(res.payouts);
      setSummary(res.summary);
    } catch (e: any) {
      setError(e?.message || '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [month, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownloadAll = async () => {
    if (!isValidMonth(month)) {
      alert('월 형식은 YYYY-MM 이어야 합니다.');
      return;
    }
    try {
      setDownloading(true);
      await brokerIncentiveService.downloadMonthlyCsv(month);
    } catch (e: any) {
      alert(e?.message || 'CSV 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    {
      key: 'broker',
      title: '중개인',
      render: (_: any, r: BrokerIncentivePayout) => (
        <div>
          <div className="font-medium text-gray-900">{r.brokerName}</div>
          <div className="text-xs text-gray-500">{r.brokerPhone || '-'}</div>
        </div>
      ),
    },
    {
      key: 'brokerType',
      title: '구분',
      render: (_: any, r: BrokerIncentivePayout) => (
        <Badge variant={r.brokerType === 'business' ? 'primary' : 'info'}>
          {brokerTypeLabel[r.brokerType]}
        </Badge>
      ),
    },
    {
      key: 'contractCount',
      title: '계약수',
      render: (_: any, r: BrokerIncentivePayout) => (
        <span className="font-medium">{r.contractCount}건</span>
      ),
    },
    {
      key: 'totalGross',
      title: '지급대상',
      render: (_: any, r: BrokerIncentivePayout) => formatAmount(r.totalGross),
    },
    {
      key: 'totalWithholding',
      title: '원천징수',
      render: (_: any, r: BrokerIncentivePayout) =>
        r.totalWithholding > 0 ? (
          <span className="text-red-600">
            -{formatAmount(r.totalWithholding)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'totalSupply',
      title: '공급가액',
      render: (_: any, r: BrokerIncentivePayout) =>
        r.totalSupply > 0 ? formatAmount(r.totalSupply) : '-',
    },
    {
      key: 'totalVat',
      title: '부가세',
      render: (_: any, r: BrokerIncentivePayout) =>
        r.totalVat > 0 ? formatAmount(r.totalVat) : '-',
    },
    {
      key: 'totalNet',
      title: '실지급액',
      render: (_: any, r: BrokerIncentivePayout) => (
        <span className="font-medium text-gray-900">
          {formatAmount(r.totalNet)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: BrokerIncentivePayout) => (
        <div>
          <Badge variant={r.status === 'PAID' ? 'success' : 'warning'}>
            {payoutStatusLabel[r.status]}
          </Badge>
          {r.paidAt && (
            <div className="text-xs text-gray-500 mt-1">
              {formatDateTime(r.paidAt)}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              중개인 인센티브
            </h1>
            <p className="text-sm text-gray-500">
              월별 인센티브 집계 및 지급 관리. 조회 시 자동 집계가 갱신됩니다.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleDownloadAll}
          disabled={downloading}
        >
          <Download className="w-4 h-4 inline-block mr-1" />
          {downloading ? '다운로드 중...' : '월별 전체 CSV'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정산월 *
            </label>
            <input
              type="month"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BrokerPayoutStatus | '')
              }
            >
              <option value="">전체</option>
              <option value="PENDING">지급 대기</option>
              <option value="PAID">지급 완료</option>
            </select>
          </div>
          <Button onClick={load} disabled={loading}>
            조회
          </Button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="중개인 수"
            value={`${summary.totalBrokers}명`}
            icon={Users}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
          />
          <StatCard
            title="총 계약수"
            value={`${summary.totalContracts}건`}
            icon={FileText}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="지급대상"
            value={formatAmount(summary.totalGross)}
            icon={Banknote}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
          <StatCard
            title={`실지급액 (${summary.paidCount}/${summary.pendingCount + summary.paidCount})`}
            value={formatAmount(summary.totalNet)}
            icon={Wallet}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
        </div>
      )}

      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">불러오는 중...</div>
        ) : (
          <Table
            columns={columns}
            data={payouts}
            onRowClick={(r) => navigate(`/broker-incentives/${r.payoutId}`)}
          />
        )}
      </Card>
    </div>
  );
};

export default IncentiveMonthlyList;
