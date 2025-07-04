// src/components/ContentUpload.jsx
import React, { useState } from 'react';
// --- 중요: notifyError 임포트 ---
import { notifyError } from './Notification'; // Notification.jsx에서 임포트 (경로 확인)

// onAnalyze prop을 통해 부모 컴포넌트로 분석 요청을 전달합니다.
function ContentUpload({ onAnalyze, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 타입 유효성 검사 (PDF, Word 문서만 허용)
      const allowedTypes = [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
      ];
      if (!allowedTypes.includes(file.type)) {
        setFileError('PDF 또는 Word 문서 (doc, docx) 파일만 업로드할 수 있습니다.');
        notifyError('PDF 또는 Word 문서 (doc, docx) 파일만 업로드할 수 있습니다.'); // 알림 추가
        setSelectedFile(null);
        return;
      }
      setFileError('');
      setSelectedFile(file);
      setInputText(''); // 파일 선택 시 텍스트 입력 초기화
    } else {
      setSelectedFile(null);
    }
  };

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    setSelectedFile(null); // 텍스트 입력 시 파일 선택 초기화
  };

  const handleSubmit = () => {
    if (selectedFile || (inputText && inputText.trim() !== '')) {
      // 부모 컴포넌트로 선택된 파일 또는 입력된 텍스트를 전달
      onAnalyze({ file: selectedFile, text: inputText });
    } else {
      notifyError('이력서 파일 또는 텍스트를 입력해주세요.'); // 알림 추가
    }
  };

  return (
    // 컴포넌트 전체 배경 및 그림자 (다크 모드 적용)
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
      {/* 제목 텍스트 색상 (다크 모드 적용) */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">이력서 업로드 및 분석</h2>

      {/* 파일 업로드 섹션 */}
      <div className="mb-6 border-b pb-6 dark:border-gray-600"> {/* 하단 보더 색상 */}
        {/* 라벨 텍스트 색상 (다크 모드 적용) */}
        <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="file-upload">
          1. 이력서 파일 업로드 (PDF, Word)
        </label>
        {/* 드래그 앤 드롭 영역 테두리 및 배경 (다크 모드 적용) */}
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
          <div className="space-y-1 text-center">
            {/* SVG 아이콘 색상 (다크 모드 적용) */}
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600 dark:text-gray-300"> {/* 텍스트 색상 */}
              <label
                htmlFor="file-upload"
                // 파일 선택 버튼 배경 및 텍스트 색상 (다크 모드 적용)
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>파일 선택</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx" // 허용 파일 확장자
                  disabled={isLoading}
                />
              </label>
              <p className="pl-1">또는 파일을 드래그 앤 드롭</p>
            </div>
            {/* 파일 형식 안내 텍스트 색상 (다크 모드 적용) */}
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX 파일 (최대 10MB)</p>
            {selectedFile && (
              <p className="text-sm text-gray-700 mt-2 dark:text-gray-300">선택된 파일: <span className="font-semibold">{selectedFile.name}</span></p>
            )}
            {fileError && (
              <p className="text-sm text-red-500 mt-2 dark:text-red-300">{fileError}</p>
            )}
          </div>
        </div>
      </div>

      {/* 텍스트 직접 입력 섹션 */}
      <div className="mb-6">
        {/* 라벨 텍스트 색상 (다크 모드 적용) */}
        <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="text-input">
          2. 이력서 내용 직접 입력
        </label>
        <textarea
          id="text-input"
          // 텍스트 입력 필드 스타일 (다크 모드 적용)
          className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[150px] dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          placeholder="여기에 이력서 내용을 직접 입력하거나 붙여넣으세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
        ></textarea>
      </div>

      {/* 분석 시작 버튼 */}
      <button
        onClick={handleSubmit}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md w-full transition-colors duration-300"
        // --- 중요: disabled 조건 수정 (주석 확인) ---
        // 기존: disabled={isLoading || (!selectedFile && (inputText.trim() === ''))}
        // 변경: isLoading일 때만 비활성화 (버튼 클릭 시 입력 여부 체크는 handleSubmit에서)
        disabled={isLoading}
      >
        {isLoading ? '분석 중...' : '이력서 분석 시작'}
      </button>
    </div>
  );
}

export default ContentUpload;