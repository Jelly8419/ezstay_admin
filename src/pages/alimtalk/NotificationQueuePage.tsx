import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { notificationQueueService } from '../../services/notificationQueueService';
import type {
  NotificationQueueStatsResponse,
  NotificationQueueContractResponse,
  NotificationQueueJobType,
  NotificationQueueJob,
} from '../../types';
import { formatDateTime } from '../../utils/format';

// ── 유형 메타 ──────────────────────────────────────────────
const JOB_TYPE_META: Record<
  NotificationQueueJobType,
  { label: string; variant: 'info' | 'warning' | 'danger' | 'default' }
> = {
  'checkin-today':      { label: '입주 당일',       variant: 'info' },
  'option-deadline':    { label: '옵션 마감',        variant: 'warning' },
  'checkout-reminder':  { label: '퇴실 알림',        variant: 'warning' },
  'checkout-today':     { label: '퇴실 당일',        variant: 'info' },
  'payment-pending':    { label: '결제 만료 임박',   variant: 'danger' },
};

const JOB_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '전체 유형' },
  ...Object.entries(JOB_TYPE_META).map(([value, { label }]) => ({ value, label })),
];

// ── 남은 시간 포맷 ─────────────────────────────────────────
function formatRemaining(ms: number): string {
  if (ms <= 0) return '곧';
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}일 후`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return `${hours}시간 후`;
  const minutes = Math.floor(ms / 60_000);
  if (minutes > 0) return `${minutes}분 후`;
  return '곧';
}

// ── 큐 상태 배지 색상 ──────────────────────────────────────
const STATE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  waiting:   'default',
  active:    'info',
  delayed:   'warning',
  failed:    'danger',
  completed: 'success',
};

// ── 메인 컴포넌트 ──────────────────────────────────────────
export const NotificationQueuePage: React.FC = () => {
  const [stats, setStats] = useState<NotificationQueueStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  // 계약별 조회
  const [contractInput, setContractInput] = useState('');
  const [contractResult, setContractResult] = useState<NotificationQueueContractResponse | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await notificationQueueService.getStats();
      setStats(data);
    } catch {
      setError('알림 큐 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleContractSearch = async () => {
    const id = parseInt(contractInput.trim(), 10);
    if (!id || isNaN(id)) {
      setContractError('유효한 계약 ID를 입력해주세요.');
      return;
    }
    try {
      setContractLoading(true);
      setContractError(null);
      setContractResult(null);
      const data = await notificationQueueService.getContractQueue(id);
      setContractResult(data);
    } catch {
      setContractError('계약 알림 큐를 불러오는데 실패했습니다.');
    } finally {
      setContractLoading(false);
    }
  };

  // 필터링된 jobs
  const filteredJobs: NotificationQueueJob[] = stats
    ? typeFilter
      ? (stats.byType[typeFilter as NotificationQueueJobType] ?? [])
      : stats.jobs
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <Button variant="secondary" className="mt-4" onClick={() => loadStats()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">알림 큐 현황</h1>
            <p className="text-sm text-gray-500">예약된 알림톡 발송 큐를 조회합니다.</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => loadStats(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '새로고침 중...' : '새로고침'}
        </Button>
      </div>

      {/* 요약 StatCard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="대기중"
            value={stats.stats.waiting}
            icon={Clock}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-100"
          />
          <StatCard
            title="처리중"
            value={stats.stats.active}
            icon={RefreshCw}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="예약됨"
            value={stats.stats.delayed}
            icon={Bell}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
          <StatCard
            title="실패"
            value={stats.stats.failed}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
          <StatCard
            title="완료"
            value={stats.stats.completed}
            icon={Bell}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
        </div>
      )}

      {/* 예약된 알림 목록 */}
      <Card title="예약된 알림 목록">
        <div className="mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {JOB_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="ml-3 text-sm text-gray-500">총 {filteredJobs.length}건</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">유형</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">계약 ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Job ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">발송 예정</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">남은 시간</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const meta = JOB_TYPE_META[job.type] ?? { label: job.type, variant: 'default' as const };
                return (
                  <tr key={job.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{job.contractId}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-500">{job.jobId}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-xs">
                      {job.fireAt || formatDateTime(job.scheduledAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-blue-600">
                        {formatRemaining(job.remainingMs)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    예약된 알림이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 계약별 큐 조회 */}
      <Card title="계약별 큐 조회">
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="계약 ID 입력"
            value={contractInput}
            onChange={(e) => setContractInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContractSearch()}
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            onClick={handleContractSearch}
            disabled={contractLoading}
          >
            <Search className="w-4 h-4 mr-1" />
            {contractLoading ? '조회 중...' : '조회'}
          </Button>
        </div>

        {contractError && (
          <p className="text-sm text-red-500 mb-3">{contractError}</p>
        )}

        {contractResult && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              계약 ID <span className="font-semibold text-gray-800">{contractResult.contractId}</span>
              의 예약 알림 {contractResult.scheduled.length}건
            </p>
            {contractResult.scheduled.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">예약된 알림이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">유형</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Job ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">발송 예정</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">딜레이</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractResult.scheduled.map((job) => {
                      const meta = JOB_TYPE_META[job.type] ?? { label: job.type, variant: 'default' as const };
                      const stateVariant = STATE_VARIANT[job.state] ?? 'default';
                      return (
                        <tr key={job.jobId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-gray-500">{job.jobId}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 text-xs">
                            {formatDateTime(job.scheduledAt)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs">
                            {formatRemaining(job.delay)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={stateVariant} size="sm">{job.state}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationQueuePage;
