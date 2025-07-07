// src/components/ContentUpload.jsx
import React, { useState } from 'react';
import { Upload, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'; // 필요한 아이콘 임포트
import { notifyError } from './Notification'; // Notification.jsx에서 임포트 (경로 확인)

// onAnalyze prop을 통해 부모 컴포넌트로 분석 요청을 전달합니다.
function ContentUpload({ onAnalyze, isLoading }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [inputText, setInputText] = useState('');
    const [fileError, setFileError] = useState('');

    // --- 고급 설정 상태 변수들 (ResumeUploadSection에서 가져옴) ---
    const [chunkSize, setChunkSize] = useState(1000); // 청크 크기
    const [chunkOverlap, setChunkOverlap] = useState(200); // 청크 중복
    const [temperature, setTemperature] = useState(0.0); // 창의성 수준 (슬라이더)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // 고급 설정 아코디언 상태
    // -----------------------------------------------------------------

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]; // optional chaining 적용
        if (file) {
            const allowedTypes = [
                'application/pdf',
                'application/msword', // .doc
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'text/plain' // TXT 파일도 지원하도록 추가
            ];
            if (!allowedTypes.includes(file.type)) {
                setFileError('PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.');
                notifyError('PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.');
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

    // 파일 선택 초기화 핸들러 (ResumeUploadSection에서 가져옴)
    const handleClearFile = () => {
        setSelectedFile(null);
        setFileError(''); // 파일 에러도 초기화
        const fileInput = document.getElementById('resumeFileInput-contentupload'); // ID 변경: 충돌 방지
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleTextChange = (e) => {
        setInputText(e.target.value);
        setSelectedFile(null); // 텍스트 입력 시 파일 선택 초기화
    };

    const handleSubmit = () => {
        if (selectedFile || (inputText && inputText.trim() !== '')) {
            // 부모 컴포넌트로 선택된 파일 또는 입력된 텍스트, 그리고 고급 설정 값을 전달
            onAnalyze({ 
                file: selectedFile, 
                text: inputText,
                chunkSize,      // 추가
                chunkOverlap,   // 추가
                temperature     // 추가
            });
        } else {
            notifyError('이력서 파일 또는 텍스트를 입력해주세요.');
        }
    };

    // 고급 설정 아코디언 토글 함수
    const toggleAdvancedSettings = () => {
        setShowAdvancedSettings(!showAdvancedSettings);
    };

    return (
        // 컴포넌트 전체 배경 및 그림자 (다크 모드 적용)
        <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
            {/* 제목 텍스트 색상 (다크 모드 적용) */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">이력서 업로드 및 분석</h2>

            {/* 파일 업로드 섹션 - ResumeUploadSection 디자인 적용 */}
            <div className="mb-6 border-b pb-6 dark:border-gray-600">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="resumeFileInput-contentupload">
                    1. 이력서 파일 업로드 (PDF, Word, TXT)
                </label>
                <label htmlFor="resumeFileInput-contentupload" className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-blue-700
                                                                        dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload size={20} className="mr-2" />
                    {selectedFile ? selectedFile.name : '파일 선택 (PDF, DOCX, TXT)'}
                    <input
                        id="resumeFileInput-contentupload" // ID 변경: 충돌 방지
                        type="file"
                        accept=".pdf,.docx,.txt" // TXT 지원 형식에 추가
                        onChange={handleFileChange}
                        className="sr-only" // hidden 대신 sr-only 사용
                        disabled={isLoading}
                    />
                </label>
                {selectedFile && (
                    <div className="flex items-center justify-between bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm mt-2
                                    dark:bg-blue-800 dark:text-blue-200">
                        <span>{selectedFile.name}</span>
                        <button onClick={handleClearFile} className="text-blue-600 hover:text-blue-800 ml-2 dark:text-blue-300 dark:hover:text-blue-100">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <p className="text-sm text-gray-500 mt-2 text-center dark:text-gray-400">
                    지원 형식: PDF, Word (.doc, .docx), TXT
                </p>
                {fileError && (
                    <p className="text-sm text-red-500 mt-2 dark:text-red-300">{fileError}</p>
                )}
            </div>

            {/* 텍스트 직접 입력 섹션 */}
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="text-input">
                    2. 이력서 내용 직접 입력
                </label>
                <textarea
                    id="text-input"
                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[150px] dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    placeholder="여기에 이력서 내용을 직접 입력하거나 붙여넣으세요..."
                    value={inputText}
                    onChange={handleTextChange}
                    disabled={isLoading}
                ></textarea>
            </div>

            {/* --- 고급 설정 (Accordion) 섹션 시작 --- */}
            <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-600">
                <button
                    onClick={toggleAdvancedSettings}
                    className="w-full flex justify-between items-center text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200
                               dark:text-gray-50 dark:hover:text-blue-400"
                    disabled={isLoading}
                >
                    <span className="flex items-center">
                        <Settings size={20} className="mr-2" /> 고급 설정
                    </span>
                    {showAdvancedSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showAdvancedSettings && (
                    <div className="mt-4 space-y-4 text-gray-700 p-4 bg-blue-50 rounded-lg shadow-inner border border-blue-200
                                    dark:bg-blue-900 dark:border-blue-700 dark:text-gray-100">
                        <div>
                            <label htmlFor="chunkSize-contentupload" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 크기: {chunkSize}
                            </label>
                            <input
                                id="chunkSize-contentupload" // ID 변경: 충돌 방지
                                type="range"
                                min="100"
                                max="2000"
                                step="50"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="텍스트를 나누는 단위 (500-2000 권장)"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">텍스트를 나누는 단위 (500-2000 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="chunkOverlap-contentupload" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 중복: {chunkOverlap}
                            </label>
                            <input
                                id="chunkOverlap-contentupload" // ID 변경: 충돌 방지
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={chunkOverlap}
                                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="청크 간 중복되는 문자 수 (50-300 권장)"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">청크 간 중복되는 문자 수 (50-300 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="temperature-contentupload" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                창의성 수준: {temperature.toFixed(1)}
                            </label>
                            <input
                                id="temperature-contentupload" // ID 변경: 충돌 방지
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="0: 정확성 우선, 1: 창의성 우선"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">0: 정확성 우선, 1: 창의성 우선</p>
                        </div>
                    </div>
                )}
            </div>
            {/* --- 고급 설정 (Accordion) 섹션 끝 --- */}

            {/* 분석 시작 버튼 */}
            <button
                onClick={handleSubmit}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md w-full transition-colors duration-300 mt-6 dark:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {isLoading ? '분석 중...' : '이력서 분석 시작'}
            </button>
        </div>
    );
}

export default ContentUpload;