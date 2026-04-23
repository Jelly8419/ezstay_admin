import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wallet, Download, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { brokerIncentiveService } from '../../services/brokerIncentiveService';
import type {
  BrokerIncentivePayout,
  BrokerIncentiveItem,
} from '../../types';
import {
  brokerTypeLabel,
  formatAmount,
  formatDate,
  formatDateTime,
  formatRate,
  incentiveStatusLabel,
  payoutStatusLabel,
} from '../brokers/brokerLabels';

export const IncentiveMonthlyDetail: React.FC = () => {
  const { payoutId } = useParams<{ payoutId: string }>();
  const navigate = useNavigate();
  const id = Number(payoutId);

  const [payout, setPayout] = useState<BrokerIncentivePayout | null>(null);
  const [incentives, setIncentives] = useState<BrokerIncentiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brokerIncentiveService.getPayoutDetail(id);
      setPayout(res.payout);
      setIncentives(res.incentives);
    } catch (e: any) {
      setError(e?.message || '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNaN(id)) load();
  }, [id, load]);

  const handleMarkPaid = async () => {
    if (!payout) return;
    const memo = window.prompt(
      `${payout.brokerName} ${payout.settlementMonth} 인센티브를 지급 완료 처리하시겠습니까?\n\n메모 (선택):`,
      ''
    );
    if (memo === null) return; // 취소
    try {
      setPaying(true);
      await brokerIncentiveService.markPaid(id, memo);
      await load();
    } catch (e: any) {
      alert(e?.message || '지급 완료 처리에 실패했습니다.');
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = async () => {
    if (!payout) return;
    try {
      setDownloading(true);
      await brokerIncentiveService.downloadPayoutCsv(
        id,
        `broker-incentive-${payout.brokerName}-${payout.settlementMonth}.csv`
      );
    } catch (e: any) {
      alert(e?.message || 'CSV 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">불러오는 중...</div>
    );
  }
  if (error || !payout) {
    return (
      <div className="space-y-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/broker-incentives')}
        >
          <ArrowLeft className="w-4 h-4 inline-block mr-1" />
          목록으로
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || '지급 정보를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const isPaid = payout.status === 'PAID';

  const columns = [
    {
      key: 'contract',
      title: '계약',
      render: (_: any, r: BrokerIncentiveItem) => (
        <Link
          to={`/contracts/${r.contractId}`}
          className="text-primary-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-medium">{r.orderId}</div>
          <div className="text-xs text-gray-500">#{r.contractId}</div>
        </Link>
      ),
    },
    {
      key: 'host',
      title: '임대인',
      render: (_: any, r: BrokerIncentiveItem) => (
        <Link
          to={`/users/${r.hostId}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm">{r.hostName || '-'}</div>
          <div className="text-xs text-gray-500">
            {r.hostNickname || `#${r.hostId}`}
          </div>
        </Link>
      ),
    },
    {
      key: 'paidAt',
      title: '결제일',
      render: (_: any, r: BrokerIncentiveItem) => (
        <span className="text-xs">{formatDate(r.paidAt)}</span>
      ),
    },
    {
      key: 'settlementExpectedDate',
      title: '정산예정일',
      render: (_: any, r: BrokerIncentiveItem) => (
        <span className="text-xs">{formatDate(r.settlementExpectedDate)}</span>
      ),
    },
    {
      key: 'baseFee',
      title: '기준(수수료)',
      render: (_: any, r: BrokerIncentiveItem) => formatAmount(r.baseFee),
    },
    {
      key: 'appliedRate',
      title: '적용률',
      render: (_: any, r: BrokerIncentiveItem) => formatRate(r.appliedRate),
    },
    {
      key: 'grossAmount',
      title: '지급대상',
      render: (_: any, r: BrokerIncentiveItem) => (
        <span className="font-medium">{formatAmount(r.grossAmount)}</span>
      ),
    },
    {
      key: 'withholdingAmount',
      title: '원천징수',
      render: (_: any, r: BrokerIncentiveItem) =>
        r.withholdingAmount > 0 ? (
          <span className="text-red-600">
            -{formatAmount(r.withholdingAmount)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'supplyAmount',
      title: '공급가액',
      render: (_: any, r: BrokerIncentiveItem) =>
        r.supplyAmount > 0 ? formatAmount(r.supplyAmount) : '-',
    },
    {
      key: 'vatAmount',
      title: '부가세',
      render: (_: any, r: BrokerIncentiveItem) =>
        r.vatAmount > 0 ? formatAmount(r.vatAmount) : '-',
    },
    {
      key: 'netAmount',
      title: '실지급액',
      render: (_: any, r: BrokerIncentiveItem) => (
        <span className="font-medium text-gray-900">
          {formatAmount(r.netAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: BrokerIncentiveItem) => (
        <Badge
          variant={
            r.status === 'PAID'
              ? 'success'
              : r.status === 'ON_HOLD' || r.status === 'CANCELLED'
                ? 'danger'
                : 'default'
          }
        >
          {incentiveStatusLabel[r.status]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/broker-incentives')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {payout.brokerName}
              </h1>
              <Badge variant={isPaid ? 'success' : 'warning'}>
                {payoutStatusLabel[payout.status]}
              </Badge>
              <Badge
                variant={payout.brokerType === 'business' ? 'primary' : 'info'}
              >
                {brokerTypeLabel[payout.brokerType]}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              정산월: <span className="font-medium">{payout.settlementMonth}</span>
              {payout.brokerPhone && ` · ${payout.brokerPhone}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-4 h-4 inline-block mr-1" />
            CSV
          </Button>
          {!isPaid && (
            <Button onClick={handleMarkPaid} disabled={paying}>
              <CheckCircle2 className="w-4 h-4 inline-block mr-1" />
              {paying ? '처리 중...' : '지급 완료 처리'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <SummaryCell label="계약수" value={`${payout.contractCount}건`} />
          <SummaryCell
            label="지급대상"
            value={formatAmount(payout.totalGross)}
          />
          <SummaryCell
            label="원천징수"
            value={
              payout.totalWithholding > 0
                ? `-${formatAmount(payout.totalWithholding)}`
                : '-'
            }
            danger={payout.totalWithholding > 0}
          />
          <SummaryCell
            label="공급가액"
            value={
              payout.totalSupply > 0 ? formatAmount(payout.totalSupply) : '-'
            }
          />
          <SummaryCell
            label="부가세"
            value={payout.totalVat > 0 ? formatAmount(payout.totalVat) : '-'}
          />
          <SummaryCell
            label="실지급액"
            value={formatAmount(payout.totalNet)}
            highlight
          />
        </div>
        {(payout.paidAt || payout.memo) && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            {payout.paidAt && (
              <div>
                <span className="text-gray-500">지급일시:</span>{' '}
                {formatDateTime(payout.paidAt)}
                {payout.paidByAdminId != null && (
                  <span className="ml-2 text-gray-400">
                    (관리자 #{payout.paidByAdminId})
                  </span>
                )}
              </div>
            )}
            {payout.memo && (
              <div>
                <span className="text-gray-500">메모:</span> {payout.memo}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Incentives Table */}
      <Card title={`계약별 인센티브 (${incentives.length}건)`}>
        <Table columns={columns} data={incentives} />
      </Card>
    </div>
  );
};

const SummaryCell: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}> = ({ label, value, highlight, danger }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div
      className={`font-semibold ${
        highlight
          ? 'text-emerald-600 text-lg'
          : danger
            ? 'text-red-600'
            : 'text-gray-900'
      }`}
    >
      {value}
    </div>
  </div>
);

export default IncentiveMonthlyDetail;
