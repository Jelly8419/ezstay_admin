import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { User, UserStatus } from '../../types';
import { ArrowLeft, CheckCircle2, XCircle, Phone, Mail, Calendar, Clock } from 'lucide-react';

// Mock data (실제로는 API에서 가져옴)
const mockUser: User = {
  id: 1,
  name: '김철수',
  nickname: 'chulsoo',
  phone: '010-1234-5678',
  email: 'chulsoo@example.com',
  role: 'host',
  status: 'active',
  phoneVerified: true,
  createdAt: '2024-01-15T09:00:00',
  lastLoginAt: '2024-10-25T14:30:00'
};

const statusBadgeVariant = (status: UserStatus) => {
  switch (status) {
    case 'active': return 'success';
    case 'suspended': return 'danger';
    case 'withdrawn': return 'default';
  }
};

const statusLabel = (status: UserStatus) => {
  switch (status) {
    case 'active': return '정상';
    case 'suspended': return '중지';
    case 'withdrawn': return '탈퇴';
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case 'guest': return '게스트';
    case 'host': return '호스트';
    case 'both': return '게스트+호스트';
    default: return role;
  }
};

export const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(mockUser);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<UserStatus>(user.status);

  const handleStatusChange = () => {
    setUser({ ...user, status: newStatus });
    setIsStatusModalOpen(false);
    // 실제로는 API 호출
    alert(`상태가 ${statusLabel(newStatus)}(으)로 변경되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>목록으로 돌아가기</span>
      </button>

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">유저 상세 정보</h1>
          <p className="text-gray-500 mt-2">회원번호: {user.id}</p>
        </div>
        <Button
          variant={user.status === 'active' ? 'danger' : 'success'}
          onClick={() => setIsStatusModalOpen(true)}
        >
          계정 상태 변경
        </Button>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card title="기본 정보">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">이름</span>
              <span className="text-gray-900">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">닉네임</span>
              <span className="text-gray-900">{user.nickname}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">역할</span>
              <span className="text-gray-900">{roleLabel(user.role)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">계정 상태</span>
              <Badge variant={statusBadgeVariant(user.status)}>
                {statusLabel(user.status)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <Card title="연락처 정보">
          <div className="space-y-4">
            <div className="flex items-start gap-3 py-3 border-b border-gray-100">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user.phone}</span>
                  {user.phoneVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">인증완료</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">미인증</span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500">휴대폰 번호</span>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-900 block">{user.email}</span>
                <span className="text-sm text-gray-500">이메일</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Activity */}
        <Card title="계정 활동">
          <div className="space-y-4">
            <div className="flex items-start gap-3 py-3 border-b border-gray-100">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-900 block">
                  {new Date(user.createdAt).toLocaleString('ko-KR')}
                </span>
                <span className="text-sm text-gray-500">가입일</span>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-900 block">
                  {new Date(user.lastLoginAt).toLocaleString('ko-KR')}
                </span>
                <span className="text-sm text-gray-500">마지막 로그인</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics (예시) */}
        <Card title="활동 통계">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600 mt-1">총 예약 수</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600 mt-1">완료된 예약</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600 mt-1">등록된 매물</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">4.8</div>
              <div className="text-sm text-gray-600 mt-1">평균 평점</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="계정 상태 변경"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleStatusChange}>
              변경하기
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{user.name}</strong> 님의 계정 상태를 변경하시겠습니까?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새로운 상태
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as UserStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">정상</option>
              <option value="suspended">중지</option>
            </select>
          </div>
          {newStatus === 'suspended' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ 계정을 중지하면 사용자가 로그인할 수 없게 됩니다.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
