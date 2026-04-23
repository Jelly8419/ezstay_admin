import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { BrokerHostAddRequest } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (body: BrokerHostAddRequest) => Promise<void>;
}

export const HostMapAddModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [hostId, setHostId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHostId('');
      setStartDate('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);
    const id = Number(hostId);
    if (!hostId || isNaN(id) || id <= 0) {
      setError('올바른 임대인 ID 를 입력하세요.');
      return;
    }

    const body: BrokerHostAddRequest = { hostId: id };
    if (startDate) {
      body.startDate = new Date(startDate).toISOString();
    }

    try {
      setSubmitting(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      // 4914: 이미 활성 매핑 존재
      const existing = e?.details?.existingBrokerId;
      if (existing) {
        setError(
          `이미 중개인 #${existing} 에 귀속되어 있습니다. 먼저 귀속을 해제해주세요.`
        );
      } else {
        setError(e?.message || '귀속 추가에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="임대인 귀속 추가"
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <Input
          label="임대인(호스트) ID *"
          type="number"
          min={1}
          value={hostId}
          onChange={(e) => setHostId(e.target.value)}
          placeholder="123"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            귀속 시작 시각
          </label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            미지정 시 현재 시각으로 적용됩니다.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-xs">
          💡 해당 호스트에 이미 활성 매핑이 존재하면 추가되지 않습니다. 먼저
          기존 매핑을 해제하세요.
        </div>
      </div>
    </Modal>
  );
};

export default HostMapAddModal;
