import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type {
  ServiceTask,
  ServiceTaskType,
  ServiceTaskStatus,
} from '../../types';
import { formatDate } from '../../utils/format';
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

// 현재 상태에서 전환 가능한 상태 목록
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

// ─── D-day 표시 ───────────────────────────────────────────────────────────────

function formatDDay(dDay: number): string {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-day';
  return `D+${Math.abs(dDay)}`;
}

function isDDayUrgent(dDay: number): boolean {
  return dDay <= 3;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

type TabKey = 'pending' | 'all';

export default function ServiceTaskList() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 전체 탭 전용 필터
  const [taskTypeFilter, setTaskTypeFilter] = useState<ServiceTaskType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ServiceTaskStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 상태 변경 모달
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);
  const [nextStatus, setNextStatus] = useState<ServiceTaskStatus | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorRefNo, setVendorRefNo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 20;
  const totalPages = Math.ceil(total / itemsPerPage);

  // ── 목록 로드 ──────────────────────────────────────────────────────────────

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params =
        activeTab === 'pending'
          ? { tab: 'pending' as const, page: currentPage, limit: itemsPerPage }
          : {
              tab: 'all' as const,
              page: currentPage,
              limit: itemsPerPage,
              ...(taskTypeFilter !== 'all' && { task_type: taskTypeFilter }),
              ...(statusFilter !== 'all' && { status: statusFilter }),
              ...(dateFrom && { date_from: dateFrom }),
              ...(dateTo && { date_to: dateTo }),
            };

      const res = await serviceTaskService.getTasks(params);
      setTasks(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setError('목록을 불러오는데 실패했습니다.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeTab, currentPage, taskTypeFilter, statusFilter, dateFrom, dateTo]);

  // ── 탭 전환 ───────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    // 전체 탭 필터 초기화
    setTaskTypeFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // ── 상태 변경 모달 ────────────────────────────────────────────────────────

  const openModal = (task: ServiceTask) => {
    setSelectedTask(task);
    setNextStatus(null);
    setVendorName('');
    setVendorContact('');
    setVendorRefNo('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
    setNextStatus(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask || !nextStatus) return;
    try {
      setActionLoading(true);
      await serviceTaskService.updateStatus(selectedTask.id, {
        status: nextStatus,
        ...(nextStatus === 'RESERVED' && {
          ...(vendorName.trim() && { vendorName: vendorName.trim() }),
          ...(vendorContact.trim() && { vendorContact: vendorContact.trim() }),
          ...(vendorRefNo.trim() && { vendorRefNo: vendorRefNo.trim() }),
        }),
      });
      closeModal();
      loadTasks();
    } catch {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  const columns = [
    {
      header: '계약 ID',
      accessor: (task: ServiceTask) => (
        <Link
          to={`/contracts/${task.contractId}`}
          className="text-primary-600 hover:underline font-medium"
        >
          #{task.contractId}
        </Link>
      ),
    },
    {
      header: '방 이름',
      accessor: (task: ServiceTask) => task.roomName,
    },
    {
      header: '타입',
      accessor: (task: ServiceTask) => (
        <Badge variant="default">{TASK_TYPE_LABELS[task.taskType]}</Badge>
      ),
    },
    {
      header: '기준일',
      accessor: (task: ServiceTask) => formatDate(task.referenceDate),
    },
    {
      header: 'D-day',
      accessor: (task: ServiceTask) => (
        <span
          className={
            isDDayUrgent(task.dDay)
              ? 'font-bold text-red-600'
              : 'text-gray-700'
          }
        >
          {formatDDay(task.dDay)}
        </span>
      ),
    },
    {
      header: '수량',
      accessor: (task: ServiceTask) =>
        task.quantity !== null ? task.quantity : '-',
    },
    {
      header: '상태',
      accessor: (task: ServiceTask) => {
        const cfg = STATUS_CONFIG[task.status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      header: '업체명',
      accessor: (task: ServiceTask) => task.vendorName ?? '-',
    },
    {
      header: '담당자',
      accessor: (task: ServiceTask) => task.vendorContact ?? '-',
    },
    {
      header: '예약번호',
      accessor: (task: ServiceTask) => task.vendorRefNo ?? '-',
    },
    {
      header: '액션',
      accessor: (task: ServiceTask) => (
        <Button size="sm" variant="outline" onClick={() => openModal(task)}>
          상태 변경
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          청소·침구류 외부 업체 예약 현황을 관리합니다.
        </p>
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
              {tab === 'pending' ? '예약 필요' : '전체 이행 현황'}
            </button>
          ))}
        </nav>
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
              variant="outline"
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
            <Table columns={columns} data={tasks} />
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
            {/* 현재 정보 요약 */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">방 이름</span>
                <span className="font-medium">{selectedTask.roomName}</span>
              </div>
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
            </div>

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
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeModal} disabled={actionLoading}>
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
