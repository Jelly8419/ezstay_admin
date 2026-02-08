import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Home,
  ClipboardList
} from 'lucide-react';
import { UserDetail as UserDetailType } from '../../types';
import { api } from '../../services/api';

export const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await api.get<UserDetailType>(`/admin/users/${id}`);
        setUser(data);
      } catch (err) {
        setError('회원 정보를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAccountNumber = (accountNumber: string) => {
    // 계좌번호 마스킹: 앞 4자리 + **** + 뒤 4자리
    if (accountNumber.length <= 8) return accountNumber;
    const start = accountNumber.slice(0, 4);
    const end = accountNumber.slice(-4);
    return `${start}****${end}`;
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: '이메일',
      kakao: '카카오',
      naver: '네이버',
      google: '구글',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로 돌아가기</span>
        </button>
        <Card title="오류">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/users')}>목록으로 돌아가기</Button>
          </div>
        </Card>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name || '이름 없음'}</h1>
            <p className="text-gray-500 mt-1">회원번호: {user.id}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? '활성' : '비활성'}
              </Badge>
              <Badge variant="secondary">
                {getAccountTypeLabel(user.accountTypeDetail.type)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card title="기본 정보">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="font-medium">{user.email}</p>
              {user.accountTypeDetail.emailVerified && (
                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  인증 완료
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">연락처</p>
              <p className="font-medium">{user.phoneNumber || '-'}</p>
              {user.phoneNumber && (
                <span className="text-xs text-gray-500 mt-1">
                  연락처 등록됨
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">가입일</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">역할</p>
              <p className="font-medium">{user.role === 'host' ? '호스트' : '게스트'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 계정 보안 정보 */}
      <Card title="계정 보안">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">계정 상태</p>
              <div className="flex items-center gap-2 mt-1">
                {user.accountTypeDetail.isLocked ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-600">잠김</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">정상</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">로그인 실패 횟수</p>
              <p className="font-medium">{user.accountTypeDetail.failedLoginAttempts}회</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 계좌 정보 */}
      <Card title="계좌 정보">
        {user.bankAccounts.length > 0 ? (
          <div className="space-y-4">
            {user.bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.bankName}</p>
                      {account.isPrimary && (
                        <Badge variant="primary" size="sm">
                          주 계좌
                        </Badge>
                      )}
                      {account.isVerified && (
                        <Badge variant="success" size="sm">
                          인증 완료
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatAccountNumber(account.accountNumber)}
                    </p>
                    <p className="text-sm text-gray-500">예금주: {account.accountHolder}</p>
                    {account.verifiedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        인증일: {formatDate(account.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">등록된 계좌가 없습니다.</div>
        )}
      </Card>

      {/* 활동 정보 */}
      <Card title="활동 정보">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">호스트 등록 매물</p>
              <p className="font-medium">{user.hostRoomsCount ?? 0}개</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">게스트 예약 수</p>
              <p className="font-medium">{user.guestReservationsCount ?? 0}건</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 활동 통계 */}
      <Card title="활동 통계">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">호스트 매물 수</p>
              <p className="text-2xl font-bold text-gray-900">{user.hostRoomsCount}개</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">게스트 예약 수</p>
              <p className="text-2xl font-bold text-gray-900">{user.guestReservationsCount}건</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 관리 액션 */}
      <Card title="계정 관리">
        <div className="flex gap-3">
          <Button
            variant={user.isActive ? 'danger' : 'primary'}
            onClick={() => {
              // TODO: 계정 상태 변경 API 호출
              alert('계정 상태 변경 기능은 추후 구현됩니다.');
            }}
          >
            {user.isActive ? '계정 비활성화' : '계정 활성화'}
          </Button>

          {user.accountTypeDetail.isLocked && (
            <Button
              variant="warning"
              onClick={() => {
                // TODO: 계정 잠금 해제 API 호출
                alert('계정 잠금 해제 기능은 추후 구현됩니다.');
              }}
            >
              계정 잠금 해제
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
