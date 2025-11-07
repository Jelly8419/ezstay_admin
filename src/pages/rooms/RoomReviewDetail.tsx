import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  Home,
  DollarSign,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { propertyService, PropertyDetail } from '../../services/roomService';

const getStatusBadgeVariant = (
  status: string
): 'warning' | 'success' | 'danger' | 'default' => {
  switch (status) {
    case 'pending_review':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'published':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending_review':
      return '심사 대기';
    case 'approved':
      return '승인';
    case 'rejected':
      return '반려';
    case 'published':
      return '게시됨';
    case 'draft':
      return '작성중';
    default:
      return status;
  }
};

export const RoomReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사진 갤러리
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 심사 모달
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPropertyDetail(Number(id));
    }
  }, [id]);

  const loadPropertyDetail = async (roomId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.getPropertyDetail(roomId);
      console.log('🔍 매물 데이터:', data);
      console.log('📸 사진 데이터:', data.photos);
      if (data.photos && data.photos.length > 0) {
        console.log('🖼️ 첫 번째 사진 URL:', data.photos[0].url);
        console.log('🌐 완성된 URL:', `http://localhost:8080${data.photos[0].url}`);
      }
      setProperty(data);
    } catch (err: any) {
      console.error('매물 상세 조회 실패:', err);
      setError(err.message || '매물 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!property) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (reviewAction === 'approve') {
        await propertyService.approveProperty(property.id);
        alert('매물이 승인되었습니다.');
      } else {
        await propertyService.rejectProperty(property.id, rejectionReason);
        alert('매물이 반려되었습니다.');
      }

      setIsReviewModalOpen(false);
      setRejectionReason('');
      navigate('/rooms/review'); // 목록으로 돌아가기
    } catch (err: any) {
      console.error('매물 심사 처리 실패:', err);
      alert(err.message || '매물 심사 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextPhoto = () => {
    if (property && property.photos && property.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % property.photos.length);
    }
  };

  const prevPhoto = () => {
    if (property && property.photos && property.photos.length > 0) {
      setCurrentPhotoIndex(
        (prev) => (prev - 1 + property.photos.length) % property.photos.length
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">매물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">매물 정보 로드 실패</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => navigate('/rooms/review')}>
              목록으로
            </Button>
            <Button onClick={() => id && loadPropertyDetail(Number(id))}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rooms/review')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">매물 심사 상세</h1>
            <p className="text-gray-500 mt-1">ID: {property.id}</p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(property.status)}>
          {getStatusLabel(property.status)}
        </Badge>
      </div>

      {/* 사진 갤러리 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">매물 사진</h2>
        <div className="relative">
          {property.photos && property.photos.length > 0 ? (
            <>
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={`http://localhost:8080${property.photos[currentPhotoIndex].url}`}
                  alt={`매물 사진 ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                {property.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {property.photos.length}
                </div>
              </div>
              {/* 썸네일 */}
              <div className="mt-4 grid grid-cols-6 gap-2">
                {property.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      currentPhotoIndex === index
                        ? 'border-primary-600'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={`http://localhost:8080${photo.url}`}
                      alt={`썸네일 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">등록된 사진이 없습니다</p>
            </div>
          )}
        </div>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold">기본 정보</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">방 이름</label>
            <p className="text-gray-900">{property.roomName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <p className="text-gray-900">{property.address}</p>
          </div>
          {property.detailAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 주소
              </label>
              <p className="text-gray-900">{property.detailAddress}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면적</label>
            <p className="text-gray-900">{property.area}㎡</p>
          </div>
          {property.floor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">층수</label>
              <p className="text-gray-900">{property.floor}</p>
            </div>
          )}
          {property.buildingType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                건물 유형
              </label>
              <p className="text-gray-900">{property.buildingType}</p>
            </div>
          )}
          {property.entrancePassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출입 비밀번호
              </label>
              <p className="text-gray-900 font-mono">{property.entrancePassword}</p>
            </div>
          )}
        </div>

        {/* 방 구조 */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">방 구조</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {property.roomCount !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {property.roomCount}
                </div>
                <div className="text-sm text-gray-600">방</div>
              </div>
            )}
            {property.bathroomCount !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {property.bathroomCount}
                </div>
                <div className="text-sm text-gray-600">욕실</div>
              </div>
            )}
            {property.livingRoomCount !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {property.livingRoomCount}
                </div>
                <div className="text-sm text-gray-600">거실</div>
              </div>
            )}
            {property.kitchenCount !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {property.kitchenCount}
                </div>
                <div className="text-sm text-gray-600">주방</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-4">
            {property.parkingAvailable !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">주차:</span>
                <Badge variant={property.parkingAvailable ? 'success' : 'default'}>
                  {property.parkingAvailable ? '가능' : '불가'}
                </Badge>
                {property.parkingInfo && (
                  <span className="text-sm text-gray-500">({property.parkingInfo})</span>
                )}
              </div>
            )}
            {property.elevatorAvailable !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">엘리베이터:</span>
                <Badge variant={property.elevatorAvailable ? 'success' : 'default'}>
                  {property.elevatorAvailable ? '있음' : '없음'}
                </Badge>
              </div>
            )}
            {property.isDuplex !== undefined && property.isDuplex && (
              <Badge variant="default">복층</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* 요금 정보 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold">요금 정보</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1일 임대료
            </label>
            <p className="text-2xl font-bold text-primary-600">
              ₩{property.dailyRent.toLocaleString()}
            </p>
          </div>
          {property.dailyMaintenanceFee !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관리비</label>
              <p className="text-xl font-semibold text-gray-900">
                ₩{property.dailyMaintenanceFee.toLocaleString()}
              </p>
            </div>
          )}
          {property.maintenanceDetail && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리비 포함 내역
              </label>
              <p className="text-gray-900">{property.maintenanceDetail}</p>
            </div>
          )}
          {property.cleaningFee !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                청소비
              </label>
              <p className="text-gray-900">₩{property.cleaningFee.toLocaleString()}</p>
            </div>
          )}
          {property.minContractWeeks !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 계약 기간
              </label>
              <p className="text-gray-900">{property.minContractWeeks}주</p>
            </div>
          )}
        </div>

        {/* 할인 정보 */}
        {(property.longTermDiscount || property.quickMoveInDiscount) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">할인 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {property.longTermDiscount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700 font-medium">장기 할인</div>
                  <div className="text-lg font-bold text-green-900">
                    {property.longTermWeeks}주 이상 {property.longTermDiscount}% 할인
                  </div>
                </div>
              )}
              {property.quickMoveInDiscount && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium">즉시 입주 할인</div>
                  <div className="text-lg font-bold text-blue-900">
                    {property.quickMoveIn} {property.quickMoveInDiscount}% 할인
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 포함 항목 */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">요금 포함 항목</h3>
          <div className="flex flex-wrap gap-2">
            {property.includeElectricity && <Badge variant="success">전기료</Badge>}
            {property.includeWater && <Badge variant="success">수도료</Badge>}
            {property.includeGas && <Badge variant="success">가스비</Badge>}
            {property.includeInternet && <Badge variant="success">인터넷</Badge>}
          </div>
        </div>

        {property.refundPolicy && (
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              환불 정책
            </label>
            <p className="text-gray-900">{property.refundPolicy}</p>
          </div>
        )}
      </Card>

      {/* 편의시설 */}
      {property.amenities && (
        <Card>
          <h2 className="text-xl font-bold mb-4">편의시설</h2>

          {property.amenities.basicOptions && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">기본 옵션</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.basicOptions.bed && <Badge>침대</Badge>}
                {property.amenities.basicOptions.desk && <Badge>책상</Badge>}
                {property.amenities.basicOptions.closet && <Badge>옷장</Badge>}
                {property.amenities.basicOptions.shoeRack && <Badge>신발장</Badge>}
              </div>
            </div>
          )}

          {property.amenities.additionalOptions && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">추가 옵션</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.additionalOptions.airConditioner && (
                  <Badge variant="success">에어컨</Badge>
                )}
                {property.amenities.additionalOptions.refrigerator && (
                  <Badge variant="success">냉장고</Badge>
                )}
                {property.amenities.additionalOptions.washingMachine && (
                  <Badge variant="success">세탁기</Badge>
                )}
                {property.amenities.additionalOptions.tv && (
                  <Badge variant="success">TV</Badge>
                )}
              </div>
            </div>
          )}

          {property.amenities.convenienceOptions && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">편의 시설</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.convenienceOptions.wifi && (
                  <Badge variant="success">Wi-Fi</Badge>
                )}
                {property.amenities.convenienceOptions.microwave && (
                  <Badge variant="success">전자레인지</Badge>
                )}
                {property.amenities.convenienceOptions.inductionStove && (
                  <Badge variant="success">인덕션</Badge>
                )}
              </div>
            </div>
          )}

          {property.amenities.petsAllowed !== undefined && (
            <div>
              <h3 className="font-semibold mb-3">반려동물</h3>
              <Badge variant={property.amenities.petsAllowed ? 'success' : 'danger'}>
                {property.amenities.petsAllowed ? '가능' : '불가'}
              </Badge>
            </div>
          )}
        </Card>
      )}

      {/* 무료 부가서비스 */}
      {property.freeServices && (
        <Card>
          <h2 className="text-xl font-bold mb-4">무료 부가서비스</h2>
          <div className="space-y-4">
            {property.freeServices.cleaningService && (
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">청소 도구 제공</div>
                  {property.freeServices.cleaningToolImageUrl && (
                    <img
                      src={`http://localhost:8080${property.freeServices.cleaningToolImageUrl}`}
                      alt="청소도구"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}
            {property.freeServices.hairDryerRental && (
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="font-medium">헤어드라이어 대여</div>
              </div>
            )}
            {property.freeServices.beddingService && (
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">침구류 제공</div>
                  {property.freeServices.bedSizes && (
                    <div className="mt-2 flex gap-3">
                      {property.freeServices.bedSizes.superSingle && property.freeServices.bedSizes.superSingle > 0 && (
                        <Badge>슈퍼싱글 {property.freeServices.bedSizes.superSingle}개</Badge>
                      )}
                      {property.freeServices.bedSizes.queen && property.freeServices.bedSizes.queen > 0 && (
                        <Badge>퀸 {property.freeServices.bedSizes.queen}개</Badge>
                      )}
                      {property.freeServices.bedSizes.king && property.freeServices.bedSizes.king > 0 && (
                        <Badge>킹 {property.freeServices.bedSizes.king}개</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {property.freeServices.amenityKit && (
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="font-medium">어메니티 키트</div>
              </div>
            )}
            {property.freeServices.autoPasswordChange && (
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="font-medium">자동 비밀번호 변경</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 방 소개 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">방 소개</h2>
        <div className="space-y-4">
          {property.description && (
            <div>
              <h3 className="font-semibold mb-2">매물 설명</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
            </div>
          )}
          {property.transportation && (
            <div>
              <h3 className="font-semibold mb-2">교통편</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property.transportation}</p>
            </div>
          )}
          {property.houseRules && (
            <div>
              <h3 className="font-semibold mb-2">하우스 룰</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property.houseRules}</p>
            </div>
          )}
        </div>
      </Card>

      {/* 호스트 정보 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold">호스트 정보</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <button
              onClick={() => navigate(`/users/${property.host.id}`)}
              className="text-primary-600 hover:underline font-medium"
            >
              {property.host.name}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <p className="text-gray-900">{property.host.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <p className="text-gray-900">{property.host.phoneNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">인증 상태</label>
            <div className="flex gap-2">
              {property.host.isVerified !== undefined && (
                <Badge variant={property.host.isVerified ? 'success' : 'danger'}>
                  {property.host.isVerified ? '본인인증 완료' : '미인증'}
                </Badge>
              )}
              {property.host.hasBankAccount !== undefined && (
                <Badge variant={property.host.hasBankAccount ? 'success' : 'warning'}>
                  {property.host.hasBankAccount ? '계좌등록 완료' : '계좌 미등록'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 제출 정보 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold">제출 정보</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생성일</label>
            <p className="text-gray-900">
              {new Date(property.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
          {property.submittedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                심사 제출일
              </label>
              <p className="text-gray-900">
                {new Date(property.submittedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
          {property.approvedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">승인일</label>
              <p className="text-gray-900">
                {new Date(property.approvedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
          {property.publishedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">게시일</label>
              <p className="text-gray-900">
                {new Date(property.publishedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
          {property.rejectionReason && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                반려 사유
              </label>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-900">{property.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 심사 액션 (심사 대기 상태일 때만 표시) */}
      {property.status === 'pending_review' && (
        <Card>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="success"
              onClick={() => handleReviewClick('approve')}
              className="min-w-[200px]"
            >
              <Check className="w-5 h-5 mr-2" />
              승인
            </Button>
            <Button
              size="lg"
              variant="danger"
              onClick={() => handleReviewClick('reject')}
              className="min-w-[200px]"
            >
              <X className="w-5 h-5 mr-2" />
              반려
            </Button>
          </div>
        </Card>
      )}

      {/* 심사 모달 */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setRejectionReason('');
        }}
        title={reviewAction === 'approve' ? '매물 승인' : '매물 반려'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReviewModalOpen(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'success' : 'danger'}
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '처리 중...'
                : reviewAction === 'approve'
                ? '승인하기'
                : '반려하기'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">{property.roomName}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>위치: {property.address}</p>
              <p>호스트: {property.host.name}</p>
              <p>
                제출일:{' '}
                {property.submittedAt
                  ? new Date(property.submittedAt).toLocaleString('ko-KR')
                  : '-'}
              </p>
            </div>
          </div>

          {reviewAction === 'approve' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ 이 매물을 승인하시겠습니까? 승인 후 호스트가 게시할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  ⚠️ 이 매물을 반려하시겠습니까? 반려 사유를 입력해주세요.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반려 사유 *
                </label>
                <textarea
                  placeholder="상세한 반려 사유를 입력해주세요 (예: 사진 품질이 낮습니다. 밝고 선명한 사진으로 다시 업로드해주세요.)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
