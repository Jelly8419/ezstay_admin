# EZstay 관리자 대시보드 API 연동 가이드

백엔드 API와 프론트엔드 관리자 대시보드가 성공적으로 연동되었습니다! 🎉

## 📁 생성된 파일

### 1. API 서비스 레이어 (`src/services/`)

#### `api.ts` - 기본 API 설정
```typescript
- API 베이스 URL 설정
- HTTP 요청 헬퍼 함수 (GET, POST, PATCH, DELETE)
- JWT 토큰 자동 포함
- 에러 핸들링
```

#### `dashboardService.ts` - 대시보드 API
```typescript
- getStats(): 대시보드 통계 조회
- getRecentActivities(): 최근 활동 조회
```

#### `userService.ts` - 유저 관리 API
```typescript
- getUsers(params): 유저 목록 조회 (페이지네이션, 필터링, 검색)
- getUserDetail(userId): 유저 상세 조회
- updateUserStatus(userId, isActive): 유저 상태 변경
```

#### `propertyService.ts` - 매물 관리 API
```typescript
- getProperties(params): 매물 목록 조회
- getPendingReviewProperties(): 심사 대기 매물 조회
- approveProperty(roomId): 매물 승인
- rejectProperty(roomId, reason): 매물 반려
```

#### `reservationService.ts` - 예약 관리 API
```typescript
- getReservations(params): 예약 목록 조회
- getReservationDetail(contractId): 예약 상세 조회
```

### 2. 업데이트된 페이지

#### ✅ `src/pages/Dashboard.tsx`
- 실시간 대시보드 통계 표시
- 최근 예약 내역
- 로딩 상태 및 에러 처리

#### ✅ `src/pages/users/UserList.tsx`
- 유저 목록 조회 (페이지네이션)
- 검색 및 필터링 (회원 타입, 활성 상태)
- 실시간 데이터 로딩

#### ✅ `src/pages/properties/PropertyReview.tsx`
- 매물 심사 대기 목록
- 승인/반려 기능
- 실시간 통계 (심사 대기, 승인, 반려)
- 모달을 통한 심사 처리

## 🚀 시작하기

### 1. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하세요:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_PORT=3001
```

### 2. 백엔드 서버 실행

백엔드 API 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.

```bash
# ezstay_back 디렉토리에서
cd ../ezstay_back
npm run dev
```

### 3. 프론트엔드 개발 서버 실행

```bash
# admin-dashboard 디렉토리에서
npm install
npm run dev
```

### 4. 관리자 계정으로 로그인

관리자 권한(`isAdmin: true`)이 있는 계정으로 로그인해야 합니다.

데이터베이스에서 관리자 계정을 만드는 방법:

```sql
-- 기존 계정을 관리자로 변경
UPDATE users
SET is_admin = true, admin_role = 'super_admin'
WHERE email = 'admin@ezstay.com';
```

## 📊 API 엔드포인트 매핑

| 페이지 | API 엔드포인트 | 설명 |
|--------|----------------|------|
| 대시보드 | GET `/admin/dashboard/stats` | 통계 데이터 |
| 대시보드 | GET `/admin/dashboard/recent-activities` | 최근 활동 |
| 유저 목록 | GET `/admin/users` | 유저 목록 (페이지네이션) |
| 유저 상세 | GET `/admin/users/:userId` | 유저 상세 정보 |
| 유저 상태 변경 | PATCH `/admin/users/:userId/status` | 유저 활성화/비활성화 |
| 매물 목록 | GET `/admin/properties` | 매물 목록 |
| 심사 대기 매물 | GET `/admin/properties/pending-review` | 심사 대기 매물만 |
| 매물 승인 | POST `/admin/properties/:roomId/approve` | 매물 승인 |
| 매물 반려 | POST `/admin/properties/:roomId/reject` | 매물 반려 |
| 예약 목록 | GET `/admin/reservations` | 예약 목록 |
| 예약 상세 | GET `/admin/reservations/:contractId` | 예약 상세 |

## 🔐 인증

### JWT 토큰 관리

API 서비스는 자동으로 `localStorage`에서 `accessToken`을 가져와 요청 헤더에 포함합니다:

```typescript
Authorization: Bearer <accessToken>
```

### 로그인 구현 예시

```typescript
// 로그인 API 호출
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data: { accessToken } } = await response.json();

// 토큰 저장
localStorage.setItem('accessToken', accessToken);
```

## 🎨 주요 기능

### 1. 대시보드

- **실시간 통계**: 전체 사용자, 등록 매물, 활성 예약, 월 매출
- **전월 대비 증감률**: 각 지표별 트렌드 표시
- **최근 예약**: 최신 예약 내역 표시
- **알림**: 심사 대기 매물, 미답변 문의 수

### 2. 유저 관리

- **검색**: 이름, 이메일, 전화번호로 검색
- **필터링**: 회원 타입 (일반/소셜), 활성 상태
- **페이지네이션**: 20개씩 페이지 단위 조회
- **상세 보기**: 유저 클릭 시 상세 페이지 이동

### 3. 매물 심사

- **심사 대기 목록**: 제출된 매물 확인
- **승인/반려**: 모달을 통한 간편한 심사 처리
- **반려 사유**: 텍스트로 상세 사유 입력
- **실시간 통계**: 심사 상태별 카운트
- **필터링**: 상태별 필터 (심사 대기, 승인, 반려, 전체)

## 🛠️ 에러 처리

모든 페이지에는 다음과 같은 에러 처리가 구현되어 있습니다:

1. **로딩 상태**: 스피너 표시
2. **에러 상태**: 에러 메시지 및 재시도 버튼
3. **빈 데이터**: 적절한 안내 메시지

```typescript
// 예시: Dashboard 페이지
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage onRetry={loadData} />;
if (!data) return <EmptyState />;
```

## 🔄 데이터 새로고침

### 자동 새로고침
- 매물 승인/반려 후 자동으로 목록 새로고침
- 필터/검색 변경 시 자동 재조회

### 수동 새로고침
- 에러 발생 시 "다시 시도" 버튼 제공

## 📝 TODO: 아직 구현되지 않은 페이지

다음 페이지들은 아직 API 연동이 되지 않았습니다:

- [ ] 예약 목록 (`ReservationList.tsx`)
- [ ] 결제 관리 (`PaymentList.tsx`)
- [ ] 정산 관리 (`SettlementList.tsx`)
- [ ] 문의 관리 (`InquiryList.tsx`)
- [ ] 알림 관리 (`NotificationList.tsx`)
- [ ] 매물 목록 (`PropertyList.tsx`)
- [ ] 유저 상세 (`UserDetail.tsx`)

이 페이지들은 동일한 패턴으로 구현할 수 있습니다.

## 🎯 다음 단계

### 1. 예약 관리 페이지 구현

```typescript
// ReservationList.tsx 예시
import { reservationService } from '../../services/reservationService';

const [reservations, setReservations] = useState([]);

useEffect(() => {
  const loadReservations = async () => {
    const response = await reservationService.getReservations({
      page: 1,
      limit: 20,
    });
    setReservations(response.reservations);
  };
  loadReservations();
}, []);
```

### 2. 로그인 페이지 구현

현재는 `localStorage`에 토큰이 있다고 가정합니다. 로그인 페이지를 구현하여 실제 인증 플로우를 완성하세요.

### 3. 권한 체크

관리자 권한이 없는 경우 접근을 차단하는 로직을 추가하세요.

```typescript
// 예시
if (!user.isAdmin) {
  navigate('/unauthorized');
}
```

## 🐛 문제 해결

### CORS 에러

백엔드에서 CORS 설정이 되어 있어야 합니다:

```javascript
// express 예시
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

### 401 Unauthorized

- `localStorage`에 `accessToken`이 저장되어 있는지 확인
- 토큰이 만료되지 않았는지 확인
- 관리자 권한(`isAdmin: true`)이 있는지 확인

### API 연결 실패

- 백엔드 서버가 `http://localhost:8080`에서 실행 중인지 확인
- `.env` 파일의 `VITE_API_BASE_URL` 설정 확인

## 📚 참고 자료

- [백엔드 API 문서](../ezstay_back/docs/admin-api.md)
- [프로젝트 기술 문서](./CLAUDE.md)

## 💡 개발 팁

1. **타입 안정성**: 모든 API 응답에 TypeScript 타입이 정의되어 있습니다.
2. **재사용성**: `api.ts`의 헬퍼 함수를 활용하여 새로운 서비스를 쉽게 추가할 수 있습니다.
3. **에러 처리**: 일관된 에러 처리 패턴을 따르세요.
4. **로딩 상태**: 사용자 경험을 위해 항상 로딩 상태를 표시하세요.

---

**작성일**: 2025-10-27
**작성자**: Claude AI
**버전**: 1.0.0
