// src/components/QuestionGenerationControls.jsx
import React, { useState } from 'react';

function QuestionGenerationControls({ onGenerate, isLoading }) {
  const [companyName, setCompanyName] = useState('');
  const [interviewType, setInterviewType] = useState('general'); // 'general', 'technical', 'behavioral'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setFileError('PDF 또는 Word 문서 (doc, docx) 파일만 업로드할 수 있습니다.');
        setSelectedFile(null);
        return;
      }
      setFileError('');
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = () => {
    onGenerate({ companyName, interviewType, resumeFile: selectedFile });
  };

  return (
    // 컴포넌트 전체 배경 및 그림자 (다크 모드 적용)
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
      {/* 제목 텍스트 색상 (다크 모드 적용) */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">면접 예상 질문 도출</h2>

      {/* 회사 이름 입력 섹션 */}
      <div className="mb-4">
        {/* 라벨 텍스트 색상 (다크 모드 적용) */}
        <label htmlFor="company-name" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
          회사 이름 (선택 사항)
        </label>
        <input
          type="text"
          id="company-name"
          // 입력 필드 스타일 (다크 모드 적용)
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          placeholder="면접 볼 회사 이름을 입력하세요 (예: Google, 삼성전자)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* 면접 유형 선택 섹션 */}
      <div className="mb-4">
        {/* 라벨 텍스트 색상 (다크 모드 적용) */}
        <label htmlFor="interview-type" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
          면접 유형
        </label>
        <select
          id="interview-type"
          // 선택 필드 스타일 (다크 모드 적용)
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value)}
          disabled={isLoading}
        >
          <option value="general">종합 면접 질문</option>
          <option value="technical">기술 면접 질문만</option>
          <option value="behavioral">인성 면접 질문만</option>
        </select>
      </div>

      {/* 이력서 파일 업로드 섹션 */}
      <div className="mb-6">
        {/* 라벨 텍스트 색상 (다크 모드 적용) */}
        <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="resume-file-upload">
          이력서 파일 첨부 (선택 사항 - PDF, Word)
        </label>
        {/* 파일 업로드 드래그 영역 스타일 (다크 모드 적용) */}
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
                htmlFor="resume-file-upload"
                // 파일 선택 버튼 스타일 (다크 모드 적용)
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>파일 선택</span>
                <input
                  id="resume-file-upload"
                  name="resume-file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
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

      {/* 질문 생성 버튼 (스타일 유지 - 자주 사용되는 색상) */}
      <button
        onClick={handleSubmit}
        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-md w-full transition-colors duration-300"
        disabled={isLoading}
      >
        {isLoading ? '질문 생성 중...' : '면접 질문 생성 시작'}
      </button>
    </div>
  );
}

export default QuestionGenerationControls;