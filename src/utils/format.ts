// 금액 포맷팅
export const formatCurrency = (amount: number): string => {
  return `₩${amount.toLocaleString('ko-KR')}`;
};

// 날짜 포맷팅
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 날짜+시간 포맷팅
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 상태별 색상
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    // User
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',

    // Property
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-blue-100 text-blue-800',
    hidden_by_admin: 'bg-orange-100 text-orange-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
    visible: 'bg-blue-100 text-blue-800',
    hidden: 'bg-gray-100 text-gray-800',

    // Reservation
    confirmed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',

    // Payment
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',

    // Settlement
    on_hold: 'bg-yellow-100 text-yellow-800',

    // Inquiry
    answered: 'bg-blue-100 text-blue-800',

    // Notification
    email: 'bg-purple-100 text-purple-800',
    sms: 'bg-green-100 text-green-800',

    // Payment Method
    card: 'bg-blue-100 text-blue-800',
    bank: 'bg-green-100 text-green-800',
    virtual: 'bg-purple-100 text-purple-800',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// 상태별 텍스트
export const getStatusText = (status: string, _type?: string): string => {
  const textMap: Record<string, string> = {
    // User
    active: '활성',
    suspended: '정지',
    withdrawn: '탈퇴',

    // User Role
    guest: '게스트',
    host: '호스트',
    both: '게스트/호스트',

    // Property
    draft: '작성 중',
    pending_review: '심사중',
    approved: '승인',
    rejected: '반려',
    published: '게시중',
    hidden_by_admin: '숨김(관리자)',
    inactive: '비활성',
    visible: '노출',
    hidden: '비공개',

    // Reservation
    confirmed: '확정',
    cancelled: '취소',
    completed: '완료',

    // Payment
    success: '성공',
    failed: '실패',
    refunded: '환불',

    // Payment Method
    card: '카드',
    bank: '계좌이체',
    virtual: '가상계좌',

    // Settlement
    on_hold: '보류',

    // Inquiry
    answered: '답변완료',

    // Notification
    email: '이메일',
    sms: 'SMS',
  };

  return textMap[status] || status;
};

// 전화번호 마스킹
export const maskPhone = (phone: string): string => {
  return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
};

// 이메일 마스킹
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

// 계좌번호 마스킹
export const maskBankAccount = (account: string): string => {
  return account.replace(/(\S+\s)(\d+)-(\d+)-(\d+)/, '$1****-****-$4');
};
