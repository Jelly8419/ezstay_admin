import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import roomManagementService from '../../services/roomManagementService';
import type { RoomManagementData } from '../../types/roomManagement';

// 컴포넌트 import
import RoomInfoCard from '../../components/rooms/RoomInfoCard';
import StatusControl from '../../components/rooms/StatusControl';
import ContractHistory from '../../components/rooms/ContractHistory';
import MemoSection from '../../components/rooms/MemoSection';

export default function RoomManagement() {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = useState<RoomManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await roomManagementService.getRoomManagement(
        Number(roomId)
      );
      setData(result);
    } catch (err: any) {
      console.error('방 정보 로드 실패:', err);
      setError(err.response?.data?.error?.message || '방 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            데이터 로드 실패
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRoomData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 페이지 제목 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">방 정보 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          호스트가 등록한 방의 상세 정보를 관리합니다
        </p>
      </div>

      {/* 방 정보 카드 */}
      <RoomInfoCard roomInfo={data.roomInfo} hostInfo={data.hostInfo} />

      {/* 상태 제어 */}
      <StatusControl
        roomId={Number(roomId)}
        currentStatus={data.roomInfo.status}
        onStatusChange={loadRoomData}
      />

      {/* 계약 정보 */}
      <ContractHistory contracts={data.contracts} />

      {/* 메모 섹션 */}
      <MemoSection
        roomId={Number(roomId)}
        memos={data.memos}
        onMemoChange={loadRoomData}
      />
    </div>
  );
}
