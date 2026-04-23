import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { BrokerRateAddRequest } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (body: BrokerRateAddRequest) => Promise<void>;
}

export const RateAddModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [percent, setPercent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPercent('');
      setEffectiveFrom('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);
    const pct = Number(percent);
    if (percent === '' || isNaN(pct) || pct <= 0 || pct > 100) {
      setError('적용률은 0 초과 100 이하의 %로 입력하세요.');
      return;
    }

    const body: BrokerRateAddRequest = { rate: pct / 100 };
    if (effectiveFrom) {
      body.effectiveFrom = new Date(effectiveFrom).toISOString();
    }

    try {
      setSubmitting(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      setError(e?.message || '요율 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="새 요율 추가"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '추가 중...' : '추가'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-xs">
          ⚠️ 기존 활성 요율은 <code>effectiveFrom</code> 시점으로 자동 마감됩니다.<br />
          이미 체결된 과거 계약의 인센티브는 스냅샷으로 보존되므로 영향 없습니다.
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <Input
          label="적용률 (%) *"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="30 (= 0.3)"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            적용 시작 시각
          </label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            미지정 시 현재 시각으로 적용됩니다.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RateAddModal;
