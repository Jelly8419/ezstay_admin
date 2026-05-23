import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import type {
  ServiceTask,
  ServiceTaskDetail,
  ServiceTaskLog,
  ServiceTaskSourceFilter,
  ServiceTaskType,
  ServiceTaskStatus,
} from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { serviceTaskService } from '../../services/serviceTaskService';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const TASK_TYPE_LABELS: Record<ServiceTaskType, string> = {
  CLEANING:          '청소',
  BEDDING_DELIVERY:  '침구 대여',
  BEDDING_RETRIEVAL: '침구 회수',
};

const STATUS_CONFIG: Record<
  ServiceTaskStatus,
  { label: string; variant: 'danger' | 'info' | 'success' | 'warning' }
> = {
  PENDING:   { label: '예약 필요', variant: 'danger' },
  RESERVED:  { label: '예약 완료', variant: 'info' },
  COMPLETED: { label: '작업 완료', variant: 'success' },
  ISSUE:     { label: '이슈 발생', variant: 'warning' },
};

const ALLOWED_TRANSITIONS: Record<ServiceTaskStatus, ServiceTaskStatus[]> = {
  PENDING:   ['RESERVED', 'COMPLETED', 'ISSUE'],
  RESERVED:  ['COMPLETED', 'ISSUE'],
  ISSUE:     ['RESERVED', 'COMPLETED'],
  COMPLETED: ['PENDING', 'RESERVED', 'ISSUE'],
};

const TASK_TYPE_OPTIONS: { value: ServiceTaskType | 'all'; label: string }[] = [
  { value: 'all',               label: '전체' },
  { value: 'CLEANING',          label: '청소' },
  { value: 'BEDDING_DELIVERY',  label: '침구 대여' },
  { value: 'BEDDING_RETRIEVAL', label: '침구 회수' },
];

const STATUS_OPTIONS: { value: ServiceTaskStatus | 'all'; label: string }[] = [
  { value: 'all',       label: '전체' },
  { value: 'PENDING',   label: '예약 필요' },
  { value: 'RESERVED',  label: '예약 완료' },
  { value: 'COMPLETED', label: '작업 완료' },
  { value: 'ISSUE',     label: '이슈 발생' },
];

const SOURCE_OPTIONS: { value: ServiceTaskSourceFilter; label: string }[] = [
  { value: 'all',      label: '전체 도메인' },
  { value: 'internal', label: '내부 계약' },
  { value: 'move_in',  label: '입주 준비' },
];

const SOURCE_BADGE: Record<
  'internal' | 'move_in',
  { label: string; variant: 'default' | 'info' }
> = {
  internal: { label: '내부 계약', variant: 'default' },
  move_in:  { label: '입주 준비', variant: 'info' },
};

// ─── D-day 표시 ───────────────────────────────────────────────────────────────

function formatDDay(dDay: number): string {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-day';
  return `D+${Math.abs(dDay)}`;
}

function isDDayUrgent(dDay: number): boolean {
  return dDay <= 3;
}

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

function buildColumns(
  openModal: (task: ServiceTask) => void,
  showSourceColumn: boolean
): any[] {
  const cols: any[] = [];

  if (showSourceColumn) {
    cols.push({
      key: 'source',
      title: '도메인',
      render: (_: any, task: ServiceTask) => {
        const cfg = task.source ? SOURCE_BADGE[task.source] : undefined;
        if (!cfg) {
          return <span className="text-xs text-gray-400">{task.source ?? '-'}</span>;
        }
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    });
  }

  cols.push(
    {
      key: 'contractId',
      title: '계약 / 케이스',
      render: (_: any, task: ServiceTask) => {
        if (task.source === 'move_in') {
          return (
            <span className="text-gray-700 font-medium">
              #케이스-{task.caseId ?? '-'}
            </span>
          );
        }
        return (
          <Link
            to={`/contracts/${task.contractId}`}
            className="text-primary-600 hover:underline font-medium"
          >
            #{task.contractId}
          </Link>
        );
      },
    },
    {
      key: 'roomName',
      title: '방 이름',
      render: (_: any, task: ServiceTask) => (
        <div>
          <div className="text-gray-900">{task.roomName || '-'}</div>
          {task.source === 'move_in' && task.address && (
            <div className="text-xs text-gray-500 mt-0.5">
              {task.address}
              {task.detailAddress ? ` ${task.detailAddress}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'guestName',
      title: '임차인',
      render: (_: any, task: ServiceTask) => {
        if (task.source !== 'move_in') return <span className="text-gray-400">-</span>;
        return (
          <div>
            <div className="text-gray-900">{task.guestName || '-'}</div>
            {task.guestPhone && (
              <div className="text-xs text-gray-500 mt-0.5">{task.guestPhone}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'taskType',
      title: '타입',
      render: (value: ServiceTaskType) => (
        <Badge variant="default">{TASK_TYPE_LABELS[value] ?? value ?? '-'}</Badge>
      ),
    },
    {
      key: 'referenceDate',
      title: '기준일',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'dDay',
      title: 'D-day',
      render: (value: number) => (
        <span className={isDDayUrgent(value) ? 'font-bold text-red-600' : 'text-gray-700'}>
          {formatDDay(value)}
        </span>
      ),
    },
    {
      key: 'quantity',
      title: '수량',
      render: (value: number | null) => (value !== null ? value : '-'),
    },
    {
      key: 'status',
      title: '상태',
      render: (value: ServiceTaskStatus, task: ServiceTask) => {
        const cfg = value ? STATUS_CONFIG[value] : undefined;
        const badge = cfg ? (
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        ) : (
          <span className="text-xs text-gray-400">{value ?? '-'}</span>
        );
        if (value === 'ISSUE' && (task as any).issueNote) {
          return (
            <span title={(task as any).issueNote} className="cursor-help">
              {badge}
              <span className="ml-1 text-gray-400 text-xs">ⓘ</span>
            </span>
          );
        }
        return badge;
      },
    },
    {
      key: 'vendorName',
      title: '업체명',
      render: (value: string | null) => value ?? '-',
    },
    {
      key: 'vendorContact',
      title: '담당자',
      render: (value: string | null) => value ?? '-',
    },
    {
      key: 'vendorRefNo',
      title: '예약번호',
      render: (value: string | null) => value ?? '-',
    },
    {
      key: 'id',
      title: '액션',
      render: (_: any, task: ServiceTask) => (
        <Button size="sm" variant="secondary" onClick={() => openModal(task)}>
          상태 변경
        </Button>
      ),
    }
  );

  return cols;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

type TabKey = 'pending' | 'all';

export default function ServiceTaskList() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState<{ internal: number; move_in: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 도메인 필터 (전 탭 공통)
  const [sourceFilter, setSourceFilter] = useState<ServiceTaskSourceFilter>('all');

  // 전체 탭 전용 필터
  const [taskTypeFilter, setTaskTypeFilter] = useState<ServiceTaskType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ServiceTaskStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 상태 변경 모달
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);
  const [taskDetail, setTaskDetail] = useState<ServiceTaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState<ServiceTaskStatus | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorRefNo, setVendorRefNo] = useState('');
  const [reservedAmount, setReservedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [issueNote, setIssueNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const itemsPerPage = 20;
  const totalPages = Math.ceil(total / itemsPerPage);

  // ── 목록 로드 ──────────────────────────────────────────────────────────────

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseParams = {
        source: sourceFilter,
        page: currentPage,
        limit: itemsPerPage,
      };
      const params =
        activeTab === 'pending'
          ? { ...baseParams, tab: 'pending' as const }
          : {
              ...baseParams,
              tab: 'all' as const,
              ...(taskTypeFilter !== 'all' && { task_type: taskTypeFilter }),
              ...(statusFilter !== 'all' && { status: statusFilter }),
              ...(dateFrom && { date_from: dateFrom }),
              ...(dateTo && { date_to: dateTo }),
            };

      const res = await serviceTaskService.getTasks(params);
      setTasks(res.items ?? []);
      setTotal(res.total ?? 0);
      setBreakdown(res.breakdown ?? null);
    } catch {
      setError('목록을 불러오는데 실패했습니다.');
      setTasks([]);
      setBreakdown(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeTab, sourceFilter, currentPage, taskTypeFilter, statusFilter, dateFrom, dateTo]);

  // ── 탭 전환 ───────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setTaskTypeFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // ── 상태 변경 모달 ────────────────────────────────────────────────────────

  const openModal = async (task: ServiceTask) => {
    setSelectedTask(task);
    setTaskDetail(null);
    setNextStatus(null);
    setVendorName('');
    setVendorContact('');
    setVendorRefNo('');
    setReservedAmount('');
    setActualAmount('');
    setIssueNote('');
    setShowPasswords(false);
    setModalOpen(true);
    try {
      setDetailLoading(true);
      const detail = await serviceTaskService.getTaskDetail(task.id, task.source);
      setTaskDetail(detail);
    } catch {
      // 이력 로드 실패 시 모달은 유지
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
    setTaskDetail(null);
    setNextStatus(null);
    setShowPasswords(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask || !nextStatus) return;
    try {
      setActionLoading(true);
      await serviceTaskService.updateStatus(
        selectedTask.id,
        {
          status: nextStatus,
          ...(nextStatus === 'RESERVED' && {
            ...(vendorName.trim() && { vendorName: vendorName.trim() }),
            ...(vendorContact.trim() && { vendorContact: vendorContact.trim() }),
            ...(vendorRefNo.trim() && { vendorRefNo: vendorRefNo.trim() }),
            ...(reservedAmount.trim() && { reservedAmount: Number(reservedAmount) }),
          }),
          ...(nextStatus === 'COMPLETED' && {
            ...(actualAmount.trim() && { actualAmount: Number(actualAmount) }),
          }),
          ...(nextStatus === 'ISSUE' && {
            ...(issueNote.trim() && { issueNote: issueNote.trim() }),
          }),
        },
        selectedTask.source
      );
      closeModal();
      loadTasks();
    } catch {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 도메인 컬럼은 sourceFilter === 'all' 일 때만 노출
  const columns = buildColumns(openModal, sourceFilter === 'all');

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          청소·침구류 외부 업체 예약 현황을 관리합니다.
        </p>
      </div>

      {/* D-DAY 정의 안내 */}
      <div className="inline-block border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 bg-white">
        <p className="font-medium mb-1">D-DAY 정의</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
          <li>침구류 대여 = 입주일</li>
          <li>침구류 회수 = 퇴실일</li>
          <li>청소 = 퇴실일</li>
        </ul>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['pending', 'all'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'pending' ? '예약 필요' : '전체 현황'}
            </button>
          ))}
        </nav>
      </div>

      {/* 도메인 필터 (전 탭 공통) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">도메인</span>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSourceFilter(opt.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sourceFilter === opt.value
                  ? 'bg-white shadow text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {breakdown && sourceFilter === 'all' && (
          <span className="text-xs text-gray-500 ml-2">
            내부 {breakdown.internal} · 입주 {breakdown.move_in}
          </span>
        )}
      </div>

      {/* 전체 탭 전용 필터 */}
      {activeTab === 'all' && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                타입
              </label>
              <select
                value={taskTypeFilter}
                onChange={(e) => {
                  setTaskTypeFilter(e.target.value as ServiceTaskType | 'all');
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ServiceTaskStatus | 'all');
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                기준일
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setTaskTypeFilter('all');
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
            >
              초기화
            </Button>
          </div>
        </Card>
      )}

      {/* 목록 */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {activeTab === 'pending' ? '예약이 필요한 작업이 없습니다.' : '조건에 맞는 작업이 없습니다.'}
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{total}</span>건
            </div>
            <Table
              columns={columns}
              data={tasks}
              rowKey={(r) => `${r.source}-${r.id}`}
            />
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 상태 변경 모달 */}
      {selectedTask && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title="상태 변경"
        >
          <div className="space-y-4">
            {/* 변경 이력 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">변경 내역</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-52 overflow-y-auto">
                {detailLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                  </div>
                ) : taskDetail && taskDetail.logs.length > 0 ? (
                  taskDetail.logs.map((log: ServiceTaskLog) => (
                    <div key={log.id} className="px-4 py-3 text-sm space-y-0.5">
                      <p className="text-gray-500">일시 : {formatDateTime(log.createdAt)}</p>
                      <p className="text-gray-800">
                        상태 : {STATUS_CONFIG[log.toStatus]?.label ?? log.toStatus}
                      </p>
                      {log.clearedReservedAmount != null && (
                        <p className="text-gray-800">
                          금액 : {log.clearedReservedAmount.toLocaleString()}원
                        </p>
                      )}
                      {log.issueNote && (
                        <p className="text-gray-800">이슈 내용 : {log.issueNote}</p>
                      )}
                      {log.note && (
                        <p className="text-gray-800">내용 : {log.note}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-gray-400 text-center">변경 이력이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 현재 정보 요약 */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">도메인</span>
                <Badge variant={SOURCE_BADGE[selectedTask.source].variant}>
                  {SOURCE_BADGE[selectedTask.source].label}
                </Badge>
              </div>
              {selectedTask.source === 'move_in' && selectedTask.caseId != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">케이스 ID</span>
                  <span className="font-medium">#{selectedTask.caseId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">방 이름</span>
                <span className="font-medium">{selectedTask.roomName}</span>
              </div>
              {selectedTask.source === 'move_in' && selectedTask.address && (
                <div className="flex justify-between">
                  <span className="text-gray-500">주소</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {selectedTask.address}
                    {selectedTask.detailAddress ? ` ${selectedTask.detailAddress}` : ''}
                  </span>
                </div>
              )}
              {selectedTask.source === 'move_in' && selectedTask.guestName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">임차인</span>
                  <span className="font-medium">
                    {selectedTask.guestName}
                    {selectedTask.guestPhone ? ` (${selectedTask.guestPhone})` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">타입</span>
                <span className="font-medium">{TASK_TYPE_LABELS[selectedTask.taskType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">기준일</span>
                <span className="font-medium">{formatDate(selectedTask.referenceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">현재 상태</span>
                <Badge variant={STATUS_CONFIG[selectedTask.status].variant}>
                  {STATUS_CONFIG[selectedTask.status].label}
                </Badge>
              </div>
              {selectedTask.status === 'ISSUE' && taskDetail?.issueNote && (
                <div className="flex justify-between">
                  <span className="text-gray-500">이슈 내용</span>
                  <span className="font-medium text-right max-w-[60%]">{taskDetail.issueNote}</span>
                </div>
              )}
            </div>

            {/* 입주 준비 청소: 공동현관 / 도어락 비밀번호 */}
            {selectedTask.source === 'move_in' &&
              taskDetail &&
              (taskDetail.commonEntrancePassword || taskDetail.doorLockPassword) && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">출입 비밀번호</span>
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900"
                    >
                      {showPasswords ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                          숨기기
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          표시
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">공동현관</span>
                    <span className="font-mono">
                      {showPasswords
                        ? taskDetail.commonEntrancePassword || '-'
                        : '••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">도어락</span>
                    <span className="font-mono">
                      {showPasswords ? taskDetail.doorLockPassword || '-' : '••••••'}
                    </span>
                  </div>
                  {taskDetail.cleaningSuppliesLocation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">청소도구 위치</span>
                      <span className="text-gray-800 text-right max-w-[60%]">
                        {taskDetail.cleaningSuppliesLocation}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* 전환할 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                변경할 상태 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_TRANSITIONS[selectedTask.status].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNextStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      nextStatus === s
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 예약 완료 선택 시 업체 정보 입력 */}
            {nextStatus === 'RESERVED' && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  업체 정보를 입력하면 함께 저장됩니다. (선택)
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="예: 청소나라"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="예: 김철수"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예약번호
                  </label>
                  <input
                    type="text"
                    value={vendorRefNo}
                    onChange={(e) => setVendorRefNo(e.target.value)}
                    placeholder="예: CLN-2026-0401"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    견적 금액 (원)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reservedAmount}
                    onChange={(e) => setReservedAmount(e.target.value)}
                    placeholder="예: 150000"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* ISSUE: 이슈 내용 */}
            {nextStatus === 'ISSUE' && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이슈 내용
                  </label>
                  <textarea
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    placeholder="예: 업체 당일 취소 연락 옴"
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* COMPLETED: 실제 청구 금액 */}
            {nextStatus === 'COMPLETED' && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  실제 청구 금액을 입력하면 함께 저장됩니다. (선택)
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실제 청구 금액 (원)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="예: 150000"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
                취소
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!nextStatus || actionLoading}
              >
                {actionLoading ? '처리 중...' : '변경'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
