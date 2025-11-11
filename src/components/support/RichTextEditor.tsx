import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

/**
 * 리치 텍스트 에디터 (간단한 textarea 버전)
 * 실제 프로젝트에서는 react-quill 등의 라이브러리 사용 권장
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  rows = 10,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
      />
      <p className="text-xs text-gray-500">
        {value.length}자 | HTML 태그 사용 가능
      </p>
    </div>
  );
};
