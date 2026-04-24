import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type {
  PromotionEvent,
  PromotionCreateRequest,
  PromotionUpdateRequest,
  PromotionTargetRole,
  PromotionBenefitType,
  PromotionBenefitMode,
  PromotionApplyTrigger,
} from '../../types';
import { toDatetimeLocal, fromDatetimeLocal } from './promotionLabels';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial?: PromotionEvent | null;
  onClose: () => void;
  onSubmit: (
    body: PromotionCreateRequest | PromotionUpdateRequest
  ) => Promise<void>;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  targetRole: PromotionTargetRole;
  benefitType: PromotionBenefitType;
  benefitMode: PromotionBenefitMode;
  discountAmount: string;
  participantLimit: string;
  participantLimitUnlimited: boolean;
  applyTrigger: PromotionApplyTrigger;
  applyOnce: boolean;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  code: '',
  name: '',
  description: '',
  targetRole: 'HOST',
  benefitType: 'HOST_FEE_WAIVER',
  benefitMode: 'FIXED_AMOUNT',
  discountAmount: '',
  participantLimit: '',
  participantLimitUnlimited: true,
  applyTrigger: 'SETTLEMENT',
  applyOnce: true,
  startAt: '',
  endAt: '',
  isActive: true,
};

export const PromotionFormModal: React.FC<Props> = ({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        code: initial.code,
        name: initial.name,
        description: initial.description ?? '',
        targetRole: initial.targetRole,
        benefitType: initial.benefitType,
        benefitMode: initial.benefitMode ?? 'FIXED_AMOUNT',
        discountAmount: String(initial.discountAmount),
        participantLimit:
          initial.participantLimit == null ? '' : String(initial.participantLimit),
        participantLimitUnlimited: initial.participantLimit == null,
        applyTrigger: initial.applyTrigger,
        applyOnce: initial.applyOnce,
        startAt: toDatetimeLocal(initial.startAt),
        endAt: toDatetimeLocal(initial.endAt),
        isActive: initial.isActive,
      });
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [isOpen, initial]);

  const isFeeWaiverFull = form.benefitMode === 'FEE_WAIVER_FULL';

  const canSubmit = useMemo(() => {
    const amountOk = isFeeWaiverFull || form.discountAmount !== '';
    if (isEdit) {
      return form.name.trim().length > 0 && amountOk;
    }
    return (
      form.code.trim().length > 0 &&
      form.name.trim().length > 0 &&
      amountOk
    );
  }, [form, isEdit, isFeeWaiverFull]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** targetRole 변경 시 benefitType 자동 동기화 (4400 조합 위반 방지) */
  const handleTargetRoleChange = (role: PromotionTargetRole) => {
    setForm((prev) => ({
      ...prev,
      targetRole: role,
      benefitType: role === 'HOST' ? 'HOST_FEE_WAIVER' : 'GUEST_DISCOUNT',
      applyTrigger: role === 'HOST' ? 'SETTLEMENT' : 'CONTRACT',
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    // 조합 유효성 (targetRole × benefitType)
    const validCombo =
      (form.targetRole === 'HOST' && form.benefitType === 'HOST_FEE_WAIVER') ||
      (form.targetRole === 'GUEST' && form.benefitType === 'GUEST_DISCOUNT');
    if (!validCombo) {
      setError('targetRole 과 benefitType 조합이 올바르지 않습니다.');
      return;
    }

    // FEE_WAIVER_FULL 모드에서는 discountAmount 무시(0 처리)
    const discount = isFeeWaiverFull ? 0 : Number(form.discountAmount);
    if (!isFeeWaiverFull && (isNaN(discount) || discount < 0)) {
      setError('할인 금액이 올바르지 않습니다.');
      return;
    }
    const participantLimit: number | null = form.participantLimitUnlimited
      ? null
      : form.participantLimit === ''
        ? null
        : Number(form.participantLimit);
    if (
      participantLimit !== null &&
      (isNaN(participantLimit) || participantLimit < 0)
    ) {
      setError('참여자 제한 수가 올바르지 않습니다.');
      return;
    }

    const body: PromotionCreateRequest | PromotionUpdateRequest = isEdit
      ? {
          name: form.name.trim(),
          description: form.description.trim() || null,
          benefitMode: form.benefitMode,
          discountAmount: discount,
          participantLimit,
          applyOnce: form.applyOnce,
          startAt: fromDatetimeLocal(form.startAt),
          endAt: fromDatetimeLocal(form.endAt),
          isActive: form.isActive,
        }
      : {
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          targetRole: form.targetRole,
          benefitType: form.benefitType,
          benefitMode: form.benefitMode,
          discountAmount: discount,
          participantLimit,
          applyTrigger: form.applyTrigger,
          applyOnce: form.applyOnce,
          startAt: fromDatetimeLocal(form.startAt),
          endAt: fromDatetimeLocal(form.endAt),
          isActive: form.isActive,
        };

    try {
      setSubmitting(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      setError(e?.message || '요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '프로모션 이벤트 수정' : '프로모션 이벤트 생성'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? '저장 중...' : isEdit ? '수정' : '생성'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="이벤트 코드 *"
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="LAUNCH_HOST_2026"
              disabled={isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">생성 후 변경 불가</p>
            )}
          </div>
          <Input
            label="이벤트 이름 *"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="런칭 호스트 수수료 면제"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대상 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              value={form.targetRole}
              onChange={(e) =>
                handleTargetRoleChange(e.target.value as PromotionTargetRole)
              }
              disabled={isEdit}
            >
              <option value="HOST">호스트</option>
              <option value="GUEST">게스트</option>
            </select>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">변경 불가</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              혜택 타입 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              value={form.benefitType}
              disabled
            >
              <option value="HOST_FEE_WAIVER">호스트 수수료 면제</option>
              <option value="GUEST_DISCOUNT">게스트 결제 할인</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              대상에 따라 자동 결정
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              적용 시점 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              value={form.applyTrigger}
              onChange={(e) =>
                update(
                  'applyTrigger',
                  e.target.value as PromotionApplyTrigger
                )
              }
              disabled={isEdit}
            >
              <option value="CONTRACT">계약 시</option>
              <option value="SETTLEMENT">정산 시</option>
            </select>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">변경 불가</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            할인 방식 *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={form.benefitMode}
            onChange={(e) =>
              update('benefitMode', e.target.value as PromotionBenefitMode)
            }
          >
            <option value="FIXED_AMOUNT">
              고정 금액 할인 (discountAmount 원 차감)
            </option>
            <option value="FEE_WAIVER_FULL">
              수수료 전액 면제 (동적 금액, discountAmount 무시)
            </option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label={isFeeWaiverFull ? '할인 금액 (원)' : '할인 금액 (원) *'}
              type="number"
              min={0}
              value={isFeeWaiverFull ? '' : form.discountAmount}
              onChange={(e) => update('discountAmount', e.target.value)}
              placeholder={isFeeWaiverFull ? '수수료 전액 면제' : '10000'}
              disabled={isFeeWaiverFull}
            />
            {isFeeWaiverFull && (
              <p className="mt-1 text-xs text-gray-500">
                수수료 전액 면제 모드에서는 이 값이 무시됩니다.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              선착순 제한
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                value={form.participantLimit}
                onChange={(e) => update('participantLimit', e.target.value)}
                disabled={form.participantLimitUnlimited}
                placeholder="100"
              />
              <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={form.participantLimitUnlimited}
                  onChange={(e) =>
                    update('participantLimitUnlimited', e.target.checked)
                  }
                />
                무제한
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.startAt}
              onChange={(e) => update('startAt', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.endAt}
              onChange={(e) => update('endAt', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.applyOnce}
              onChange={(e) => update('applyOnce', e.target.checked)}
            />
            1인 1회 제한 (applyOnce)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
            />
            활성화 (isActive)
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default PromotionFormModal;
