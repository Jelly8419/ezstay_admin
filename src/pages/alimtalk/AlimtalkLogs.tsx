import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/common/Pagination';
import { alimtalkService } from '../../services/alimtalkService';
import type { AlimtalkLog, AlimtalkLogStatus } from '../../types';
import { formatDateTime, maskPhone } from '../../utils/format';

const statusMap: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  PENDING: { label: '대기중', variant: 'default' },
  SENT: { label: '발송 성공', variant: 'success' },
  FAILED: { label: '발송 실패', variant: 'danger' },
  RETRIED: { label: '재시도 성공', variant: 'info' },
  FALLBACK_SENT: { label: 'SMS 대체 성공', variant: 'warning' },
  FALLBACK_FAILED: { label: 'SMS 대체 실패', variant: 'danger' },
};

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'SENT', label: '발송 성공' },
  { value: 'FAILED', label: '발송 실패' },
  { value: 'RETRIED', label: '재시도 성공' },
  { value: 'FALLBACK_SENT', label: 'SMS 대체 성공' },
  { value: 'FALLBACK_FAILED', label: 'SMS 대체 실패' },
  { value: 'PENDING', label: '대기중' },
];

const ITEMS_PER_PAGE = 20;

export const AlimtalkLogs: React.FC = () => {
  const [logs, setLogs] = useState<AlimtalkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [retrying, setRetrying] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alimtalkService.getLogs({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: (statusFilter || undefined) as AlimtalkLogStatus | undefined,
        eventName: eventNameFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError('발송 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, eventNameFilter, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRetry = async (logId: number) => {
    if (!confirm('이 알림톡을 재시도하시겠습니까?')) return;
    try {
      setRetrying(logId);
      await alimtalkService.retryLog(logId);
      alert('재시도가 완료되었습니다.');
      await loadLogs();
    } catch (err: any) {
      alert(err?.message || '재시도에 실패했습니다.');
    } finally {
      setRetrying(null);
    }
  };

  const handleFilterReset = () => {
    setStatusFilter('');
    setEventNameFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="이벤트명 필터"
            value={eventNameFilter}
            onChange={(e) => { setEventNameFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button variant="secondary" onClick={handleFilterReset}>
            필터 초기화
          </Button>
        </div>
        {totalCount > 0 && (
          <p className="mt-3 text-sm text-gray-500">총 {totalCount.toLocaleString()}건</p>
        )}
      </Card>

      {/* Logs Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadLogs}>
              다시 시도
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">이벤트명</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">수신자</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">템플릿 코드</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">재시도</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">발송일시</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const statusInfo = statusMap[log.status] || { label: log.status, variant: 'default' as const };
                  const canRetry = log.status === 'FAILED' || log.status === 'FALLBACK_FAILED';

                  return (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{log.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.eventName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-gray-500 text-xs">ID: {log.receiverId}</span>
                          <br />
                          <span className="text-gray-700">{maskPhone(log.receiverPhone)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{log.tplCode}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{log.retryCount}회</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {log.sentAt ? formatDateTime(log.sentAt) : log.failedAt ? formatDateTime(log.failedAt) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {canRetry && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                          >
                            <RotateCcw className={`w-3 h-3 mr-1 ${retrying === log.id ? 'animate-spin' : ''}`} />
                            재시도
                          </Button>
                        )}
                        {log.errorMessage && (
                          <span
                            className="ml-2 text-xs text-red-500 cursor-help"
                            title={log.errorMessage}
                          >
                            오류
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      발송 이력이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default AlimtalkLogs;
