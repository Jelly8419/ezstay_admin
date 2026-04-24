import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { promotionService } from '../../services/promotionService';
import type {
  PromotionEvent,
  PromotionCreateRequest,
  PromotionUpdateRequest,
} from '../../types';
import {
  targetRoleLabel,
  benefitTypeLabel,
  benefitModeLabel,
  formatAmount,
  formatDateTime,
} from './promotionLabels';
import PromotionFormModal from './PromotionFormModal';

export const PromotionList: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promotionService.getPromotions();
      setEvents(res.events);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (
    body: PromotionCreateRequest | PromotionUpdateRequest
  ) => {
    await promotionService.createPromotion(body as PromotionCreateRequest);
    await load();
  };

  const handleToggleActive = async (ev: PromotionEvent) => {
    const next = !ev.isActive;
    const confirmMsg = next
      ? `"${ev.name}" 이벤트를 활성화하시겠습니까?`
      : `"${ev.name}" 이벤트를 비활성화하시겠습니까?\n신규 자격 등록 및 미소진 혜택 적용이 차단됩니다.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      setTogglingId(ev.id);
      await promotionService.updatePromotion(ev.id, { isActive: next });
      await load();
    } catch (e: any) {
      alert(e?.message || '상태 변경에 실패했습니다.');
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      key: 'code',
      title: '코드',
      render: (_: any, r: PromotionEvent) => (
        <span className="font-mono text-xs text-gray-700">{r.code}</span>
      ),
    },
    {
      key: 'name',
      title: '이름',
      render: (_: any, r: PromotionEvent) => (
        <div>
          <div className="font-medium text-gray-900">{r.name}</div>
          {r.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'targetRole',
      title: '대상',
      render: (_: any, r: PromotionEvent) => (
        <Badge variant={r.targetRole === 'HOST' ? 'info' : 'primary'}>
          {targetRoleLabel[r.targetRole]}
        </Badge>
      ),
    },
    {
      key: 'benefitType',
      title: '혜택',
      render: (_: any, r: PromotionEvent) => (
        <div>
          <div className="text-xs text-gray-700">
            {benefitTypeLabel[r.benefitType]}
          </div>
          <Badge
            variant={r.benefitMode === 'FEE_WAIVER_FULL' ? 'warning' : 'default'}
            size="sm"
            className="mt-1"
          >
            {benefitModeLabel[r.benefitMode]}
          </Badge>
        </div>
      ),
    },
    {
      key: 'discountAmount',
      title: '할인',
      render: (_: any, r: PromotionEvent) =>
        r.benefitMode === 'FEE_WAIVER_FULL' ? (
          <span className="text-xs text-gray-500">동적 (수수료 면제)</span>
        ) : (
          <span className="font-medium text-gray-900">
            {formatAmount(r.discountAmount)}
          </span>
        ),
    },
    {
      key: 'participants',
      title: '참여 / 소진',
      render: (_: any, r: PromotionEvent) => {
        const limit =
          r.participantLimit == null ? '무제한' : r.participantLimit;
        const participants = r.stats?.participantCount ?? 0;
        const consumed = r.stats?.consumedCount ?? 0;
        return (
          <div className="text-sm">
            <div>
              <span className="font-medium">{participants}</span>
              <span className="text-gray-400"> / {limit}</span>
            </div>
            <div className="text-xs text-gray-500">소진 {consumed}</div>
          </div>
        );
      },
    },
    {
      key: 'period',
      title: '기간',
      render: (_: any, r: PromotionEvent) => (
        <div className="text-xs text-gray-600">
          <div>{r.startAt ? formatDateTime(r.startAt) : '즉시 시작'}</div>
          <div className="text-gray-400">
            ~ {r.endAt ? formatDateTime(r.endAt) : '무기한'}
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      title: '상태',
      render: (_: any, r: PromotionEvent) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(r);
          }}
          disabled={togglingId === r.id}
          className="focus:outline-none disabled:opacity-50"
        >
          <Badge variant={r.isActive ? 'success' : 'default'}>
            {r.isActive ? '활성' : '비활성'}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-pink-100 p-2 rounded-lg">
            <Gift className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">프로모션 관리</h1>
            <p className="text-sm text-gray-500">
              호스트/게스트 혜택 이벤트를 생성하고 참여 현황을 관리합니다.
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 inline-block mr-1" />
          이벤트 생성
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">불러오는 중...</div>
        ) : (
          <Table
            columns={columns}
            data={events}
            onRowClick={(r) => navigate(`/promotions/${r.id}`)}
          />
        )}
      </Card>

      <PromotionFormModal
        isOpen={formOpen}
        mode="create"
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default PromotionList;
