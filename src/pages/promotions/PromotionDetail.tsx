import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Gift, Users, CheckCircle2, Ticket, Pencil } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { promotionService } from '../../services/promotionService';
import type {
  PromotionEvent,
  PromotionParticipant,
  PromotionContractBenefit,
  PromotionCreateRequest,
  PromotionUpdateRequest,
} from '../../types';
import {
  targetRoleLabel,
  benefitTypeLabel,
  applyTriggerLabel,
  benefitStatusLabel,
  voidedReasonLabel,
  formatAmount,
  formatDateTime,
} from './promotionLabels';
import PromotionFormModal from './PromotionFormModal';

type TabKey = 'info' | 'participants' | 'benefits';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'info', label: '정보' },
  { key: 'participants', label: '참여자' },
  { key: 'benefits', label: '혜택 이력' },
];

export const PromotionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const promotionId = Number(id);

  const [event, setEvent] = useState<PromotionEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [editOpen, setEditOpen] = useState(false);

  const [participants, setParticipants] = useState<PromotionParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);

  const [benefits, setBenefits] = useState<PromotionContractBenefit[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsLoaded, setBenefitsLoaded] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promotionService.getPromotion(promotionId);
      setEvent(res);
    } catch (e: any) {
      setError(e?.message || '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [promotionId]);

  useEffect(() => {
    if (!isNaN(promotionId)) loadEvent();
  }, [promotionId, loadEvent]);

  useEffect(() => {
    if (activeTab === 'participants' && !participantsLoaded) {
      setParticipantsLoading(true);
      promotionService
        .getParticipants(promotionId)
        .then((res) => {
          setParticipants(res.participants);
          setParticipantsLoaded(true);
        })
        .catch((e) => alert(e?.message || '참여자 조회 실패'))
        .finally(() => setParticipantsLoading(false));
    }
    if (activeTab === 'benefits' && !benefitsLoaded) {
      setBenefitsLoading(true);
      promotionService
        .getBenefits(promotionId)
        .then((res) => {
          setBenefits(res.benefits);
          setBenefitsLoaded(true);
        })
        .catch((e) => alert(e?.message || '혜택 이력 조회 실패'))
        .finally(() => setBenefitsLoading(false));
    }
  }, [activeTab, promotionId, participantsLoaded, benefitsLoaded]);

  const handleUpdate = async (
    body: PromotionCreateRequest | PromotionUpdateRequest
  ) => {
    await promotionService.updatePromotion(
      promotionId,
      body as PromotionUpdateRequest
    );
    await loadEvent();
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">불러오는 중...</div>
    );
  }
  if (error || !event) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/promotions')}>
          <ArrowLeft className="w-4 h-4 inline-block mr-1" />
          목록으로
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || '이벤트를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/promotions')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-pink-100 p-2 rounded-lg">
            <Gift className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <Badge variant={event.isActive ? 'success' : 'default'}>
                {event.isActive ? '활성' : '비활성'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">{event.code}</p>
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
          title="참여자 수"
          value={`${event.stats?.participantCount ?? 0}${
            event.participantLimit != null ? ` / ${event.participantLimit}` : ''
          }`}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="혜택 소진"
          value={event.stats?.consumedCount ?? 0}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="활성 혜택"
          value={event.stats?.activeBenefitCount ?? 0}
          icon={Ticket}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
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
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'info' && <InfoTab event={event} />}
      {activeTab === 'participants' && (
        <ParticipantsTab
          participants={participants}
          loading={participantsLoading}
        />
      )}
      {activeTab === 'benefits' && (
        <BenefitsTab benefits={benefits} loading={benefitsLoading} />
      )}

      <PromotionFormModal
        isOpen={editOpen}
        mode="edit"
        initial={event}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
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

const InfoTab: React.FC<{ event: PromotionEvent }> = ({ event }) => (
  <Card>
    <InfoRow label="코드">
      <span className="font-mono">{event.code}</span>
      <span className="ml-2 text-xs text-gray-400">(변경 불가)</span>
    </InfoRow>
    <InfoRow label="이름">{event.name}</InfoRow>
    <InfoRow label="설명">{event.description || '-'}</InfoRow>
    <InfoRow label="대상">
      <Badge variant={event.targetRole === 'HOST' ? 'info' : 'primary'}>
        {targetRoleLabel[event.targetRole]}
      </Badge>
      <span className="ml-2 text-xs text-gray-400">(변경 불가)</span>
    </InfoRow>
    <InfoRow label="혜택 타입">
      {benefitTypeLabel[event.benefitType]}
      <span className="ml-2 text-xs text-gray-400">(변경 불가)</span>
    </InfoRow>
    <InfoRow label="적용 시점">
      {applyTriggerLabel[event.applyTrigger]}
      <span className="ml-2 text-xs text-gray-400">(변경 불가)</span>
    </InfoRow>
    <InfoRow label="할인 금액">{formatAmount(event.discountAmount)}</InfoRow>
    <InfoRow label="선착순 제한">
      {event.participantLimit == null ? '무제한' : `${event.participantLimit}명`}
    </InfoRow>
    <InfoRow label="1인 1회 제한">
      {event.applyOnce ? '✅ 적용' : '❌ 미적용'}
    </InfoRow>
    <InfoRow label="시작일">{formatDateTime(event.startAt)}</InfoRow>
    <InfoRow label="종료일">{formatDateTime(event.endAt)}</InfoRow>
    <InfoRow label="활성화">
      <Badge variant={event.isActive ? 'success' : 'default'}>
        {event.isActive ? '활성' : '비활성'}
      </Badge>
    </InfoRow>
    <InfoRow label="생성일">{formatDateTime(event.createdAt)}</InfoRow>
    <InfoRow label="수정일">{formatDateTime(event.updatedAt)}</InfoRow>
  </Card>
);

// ---------------- Participants Tab ----------------
const ParticipantsTab: React.FC<{
  participants: PromotionParticipant[];
  loading: boolean;
}> = ({ participants, loading }) => {
  const columns = [
    {
      key: 'userId',
      title: '유저',
      render: (_: any, r: PromotionParticipant) => (
        <Link
          to={`/users/${r.userId}`}
          className="text-primary-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          #{r.userId} {r.userName || r.userEmail}
        </Link>
      ),
    },
    {
      key: 'userEmail',
      title: '이메일',
      render: (_: any, r: PromotionParticipant) => (
        <span className="text-xs text-gray-600">{r.userEmail}</span>
      ),
    },
    {
      key: 'appliedAt',
      title: '신청일',
      render: (_: any, r: PromotionParticipant) => formatDateTime(r.appliedAt),
    },
    {
      key: 'consumed',
      title: '소진 여부',
      render: (_: any, r: PromotionParticipant) =>
        r.consumed ? (
          <Badge variant="success">소진</Badge>
        ) : (
          <Badge variant="default">미사용</Badge>
        ),
    },
    {
      key: 'consumedContract',
      title: '소진 계약',
      render: (_: any, r: PromotionParticipant) =>
        r.consumedContract ? (
          <div className="text-xs">
            <Link
              to={`/contracts/${r.consumedContract.id}`}
              className="text-primary-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {r.consumedContract.orderId}
            </Link>
            <div className="text-gray-500">{r.consumedContract.status}</div>
            <div className="text-gray-400">
              {formatDateTime(r.consumedAt)}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];
  return (
    <Card>
      {loading ? (
        <div className="py-12 text-center text-gray-500">불러오는 중...</div>
      ) : (
        <Table columns={columns} data={participants} />
      )}
    </Card>
  );
};

// ---------------- Benefits Tab ----------------
const BenefitsTab: React.FC<{
  benefits: PromotionContractBenefit[];
  loading: boolean;
}> = ({ benefits, loading }) => {
  const columns = [
    {
      key: 'contractId',
      title: '계약',
      render: (_: any, r: PromotionContractBenefit) => (
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
      key: 'contractStatus',
      title: '계약 상태',
      render: (_: any, r: PromotionContractBenefit) => (
        <span className="text-xs text-gray-700">{r.contractStatus}</span>
      ),
    },
    {
      key: 'users',
      title: '호스트 / 게스트',
      render: (_: any, r: PromotionContractBenefit) => (
        <div className="text-xs">
          <div>호스트 #{r.hostId}</div>
          <div className="text-gray-500">게스트 #{r.guestId}</div>
        </div>
      ),
    },
    {
      key: 'benefitType',
      title: '혜택 타입',
      render: (_: any, r: PromotionContractBenefit) => (
        <span className="text-xs">{benefitTypeLabel[r.benefitType]}</span>
      ),
    },
    {
      key: 'discountAmount',
      title: '할인 금액',
      render: (_: any, r: PromotionContractBenefit) => (
        <span className="font-medium">{formatAmount(r.discountAmount)}</span>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: PromotionContractBenefit) => (
        <Badge variant={r.status === 'ACTIVE' ? 'success' : 'danger'}>
          {benefitStatusLabel[r.status]}
        </Badge>
      ),
    },
    {
      key: 'appliedAt',
      title: '적용일',
      render: (_: any, r: PromotionContractBenefit) => (
        <div className="text-xs">
          <div>{formatDateTime(r.appliedAt)}</div>
          {r.voidedAt && (
            <div className="text-red-500">
              무효 {formatDateTime(r.voidedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'voidedReason',
      title: '무효 사유',
      render: (_: any, r: PromotionContractBenefit) =>
        r.voidedReason ? (
          <span className="text-xs text-red-600">
            {voidedReasonLabel[r.voidedReason]}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];
  return (
    <Card>
      {loading ? (
        <div className="py-12 text-center text-gray-500">불러오는 중...</div>
      ) : (
        <Table columns={columns} data={benefits} />
      )}
    </Card>
  );
};

export default PromotionDetail;
