import { User, MapPin, Phone, Mail } from 'lucide-react';
import type { RoomInfo, HostInfo } from '../../types/roomManagement';

interface RoomInfoCardProps {
  roomInfo: RoomInfo;
  hostInfo: HostInfo;
}

export default function RoomInfoCard({ roomInfo, hostInfo }: RoomInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {roomInfo.roomName}
          </h2>

          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {roomInfo.address}, {roomInfo.detailAddress}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-700">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">
                <span className="font-medium">호스트:</span> {hostInfo.name}
              </span>
            </div>

            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">
                <span className="font-medium">연락처:</span> {hostInfo.phoneNumber}
              </span>
            </div>

            <div className="flex items-center text-gray-700">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">
                <span className="font-medium">이메일:</span> {hostInfo.email}
              </span>
            </div>
          </div>

          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            방 정보 전체 보기
            <span className="ml-1">→</span>
          </button>
        </div>

        <div className="ml-6">
          <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src="https://via.placeholder.com/128"
              alt={roomInfo.roomName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
