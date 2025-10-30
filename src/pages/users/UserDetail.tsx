import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
          <p className="text-gray-500 mt-2">회원번호: {id}</p>
        </div>
      </div>

      {/* Placeholder Card */}
      <Card title="개발 중">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            유저 상세 페이지는 백엔드 API 연동 후 구현 예정입니다.
          </p>
          <Button onClick={() => navigate('/users')}>
            목록으로 돌아가기
          </Button>
        </div>
      </Card>
    </div>
  );
};
