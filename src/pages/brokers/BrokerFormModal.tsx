import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type {
  Broker,
  BrokerCreateRequest,
  BrokerUpdateRequest,
  BrokerType,
  BrokerStatus,
} from '../../types';
import { toDateInput } from './brokerLabels';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial?: Broker | null;
  onClose: () => void;
  onSubmit: (
    body: BrokerCreateRequest | BrokerUpdateRequest
  ) => Promise<void>;
}

interface FormState {
  name: string;
  phone: string;
  brokerType: BrokerType;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  startDate: string;
  endDate: string;
  status: BrokerStatus;
  memo: string;
  initialRatePercent: string;
}

const defaultForm: FormState = {
  name: '',
  phone: '',
  brokerType: 'business',
  taxId: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  startDate: '',
  endDate: '',
  status: 'active',
  memo: '',
  initialRatePercent: '',
};

export const BrokerFormModal: React.FC<Props> = ({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
}) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        name: initial.name,
        phone: initial.phone ?? '',
        brokerType: initial.brokerType,
        taxId: initial.taxId ?? '',
        bankName: initial.bankName ?? '',
        bankAccount: initial.bankAccount ?? '',
        bankHolder: initial.bankHolder ?? '',
        startDate: toDateInput(initial.startDate),
        endDate: toDateInput(initial.endDate),
        status: initial.status,
        memo: initial.memo ?? '',
        initialRatePercent: '',
      });
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [isOpen, initial]);

  const canSubmit = useMemo(() => {
    if (!form.name.trim() || !form.phone.trim()) return false;
    if (form.brokerType === 'business' && !form.taxId.trim()) return false;
    if (!isEdit && (!form.startDate || !form.endDate)) return false;
    return true;
  }, [form, isEdit]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError(null);

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('종료일은 시작일 이후여야 합니다.');
      return;
    }

    let initialRate: number | null = null;
    if (!isEdit && form.initialRatePercent !== '') {
      const pct = Number(form.initialRatePercent);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        setError('초기 적용률은 0 초과 100 이하의 %로 입력하세요.');
        return;
      }
      initialRate = pct / 100;
    }

    const common = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      brokerType: form.brokerType,
      taxId: form.brokerType === 'business' ? form.taxId.trim() : null,
      bankName: form.bankName.trim() || null,
      bankAccount: form.bankAccount.trim() || null,
      bankHolder: form.bankHolder.trim() || null,
      status: form.status,
      memo: form.memo.trim() || null,
    };

    const body: BrokerCreateRequest | BrokerUpdateRequest = isEdit
      ? {
          ...common,
          ...(form.startDate ? { startDate: form.startDate } : {}),
          ...(form.endDate ? { endDate: form.endDate } : {}),
        }
      : {
          ...common,
          startDate: form.startDate,
          endDate: form.endDate,
          ...(initialRate != null ? { initialRate } : {}),
        };

    try {
      setSubmitting(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      setError(e?.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '중개인 정보 수정' : '중개인 등록'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? '저장 중...' : isEdit ? '수정' : '등록'}
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
          <Input
            label="중개인명 *"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="00부동산 / 홍길동"
          />
          <Input
            label="연락처 *"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="010-1234-5678"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구분 *
            </label>
            <div className="flex gap-4 py-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.brokerType === 'individual'}
                  onChange={() => update('brokerType', 'individual')}
                />
                개인 (원천징수 8.8%)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.brokerType === 'business'}
                  onChange={() => update('brokerType', 'business')}
                />
                사업자 (세금계산서)
              </label>
            </div>
          </div>
          <Input
            label={
              form.brokerType === 'business'
                ? '사업자등록번호 *'
                : '사업자등록번호'
            }
            value={form.taxId}
            onChange={(e) => update('taxId', e.target.value)}
            placeholder="123-45-67890"
            disabled={form.brokerType === 'individual'}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="은행명"
            value={form.bankName}
            onChange={(e) => update('bankName', e.target.value)}
            placeholder="국민은행"
          />
          <Input
            label="계좌번호"
            value={form.bankAccount}
            onChange={(e) => update('bankAccount', e.target.value)}
          />
          <Input
            label="예금주"
            value={form.bankHolder}
            onChange={(e) => update('bankHolder', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              활동 시작일 {isEdit ? '' : '*'}
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              활동 종료일 {isEdit ? '' : '*'}
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={form.status}
              onChange={(e) =>
                update('status', e.target.value as BrokerStatus)
              }
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        {!isEdit && (
          <div>
            <Input
              label="초기 적용률 (%) — 선택"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.initialRatePercent}
              onChange={(e) => update('initialRatePercent', e.target.value)}
              placeholder="50 (=0.5)"
            />
            <p className="mt-1 text-xs text-gray-500">
              입력 시 BrokerRate 가 함께 생성됩니다. 미입력 시 이후 "요율 추가"로 설정.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메모
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={2}
            value={form.memo}
            onChange={(e) => update('memo', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default BrokerFormModal;
