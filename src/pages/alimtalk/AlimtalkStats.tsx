import React, { useState, useEffect } from 'react';
import { AlertCircle, Send, XCircle, RotateCcw, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { alimtalkService } from '../../services/alimtalkService';
import type { AlimtalkStatsResponse } from '../../types';

export const AlimtalkStats: React.FC = () => {
  const [stats, setStats] = useState<AlimtalkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range filter
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    loadStats();
  }, [startDate, endDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alimtalkService.getStats({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setStats(data);
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error || '데이터를 불러올 수 없습니다.'}</p>
        <Button variant="secondary" className="mt-4" onClick={loadStats}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">
            {stats.period.startDate} ~ {stats.period.endDate}
          </span>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="전체 발송"
          value={stats.summary.total.toLocaleString()}
          icon={MessageSquare}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="발송 성공"
          value={stats.summary.sent.toLocaleString()}
          icon={Send}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="재시도 성공"
          value={stats.summary.retried.toLocaleString()}
          icon={RotateCcw}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
        />
        <StatCard
          title="SMS 대체 발송"
          value={stats.summary.fallbackSent.toLocaleString()}
          icon={MessageSquare}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="실패"
          value={stats.summary.failed.toLocaleString()}
          icon={XCircle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Success Rate */}
      <Card title="성공률">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-green-600">{stats.summary.successRate}</div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: stats.summary.successRate }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* By Status */}
      <Card title="상태별 발송 현황">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">건수</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">비율</th>
              </tr>
            </thead>
            <tbody>
              {stats.byStatus.map((item) => {
                const percentage = stats.summary.total > 0
                  ? ((item.count / stats.summary.total) * 100).toFixed(1)
                  : '0.0';
                const statusLabels: Record<string, string> = {
                  SENT: '발송 성공',
                  FAILED: '발송 실패',
                  RETRIED: '재시도 성공',
                  FALLBACK_SENT: 'SMS 대체 성공',
                  FALLBACK_FAILED: 'SMS 대체 실패',
                  PENDING: '대기중',
                };
                const variantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
                  SENT: 'success',
                  FAILED: 'danger',
                  RETRIED: 'info',
                  FALLBACK_SENT: 'warning',
                  FALLBACK_FAILED: 'danger',
                  PENDING: 'default',
                };

                return (
                  <tr key={item.status} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <Badge variant={variantMap[item.status] || 'default'} size="sm">
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* By Event */}
      <Card title="이벤트별 발송 현황">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">이벤트명</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">전체</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">성공</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">실패</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">SMS 대체</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">성공률</th>
              </tr>
            </thead>
            <tbody>
              {stats.byEvent.map((event) => {
                const rate = event.total > 0
                  ? (((event.sent + event.fallback) / event.total) * 100).toFixed(1)
                  : '0.0';

                return (
                  <tr key={event.eventName} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {event.eventName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{event.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-green-600">{event.sent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-red-600">{event.failed.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-yellow-600">{event.fallback.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={parseFloat(rate) >= 95 ? 'text-green-600' : parseFloat(rate) >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {stats.byEvent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    이벤트별 통계가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AlimtalkStats;
