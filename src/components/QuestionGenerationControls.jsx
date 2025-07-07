// src/components/QuestionGenerationControls.jsx
import React, { useState } from 'react';
import { Upload, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'; // 모든 필요한 아이콘 임포트

function QuestionGenerationControls({ onGenerate, isLoading }) {
    const [companyName, setCompanyName] = useState('');
    const [interviewType, setInterviewType] = useState('general'); // 'general', 'technical', 'behavioral'
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');

    // --- 다시 추가되는 상태 변수들 (파일 업로드 및 고급 설정) ---
    const [chunkSize, setChunkSize] = useState(1000); // 청크 크기
    const [chunkOverlap, setChunkOverlap] = useState(200); // 청크 중복
    const [temperature, setTemperature] = useState(0.0); // 창의성 수준 (슬라이더)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // 고급 설정 아코디언 상태
    // -----------------------------------------------------------

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = [
                'application/pdf',
                'application/msword', // .doc
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'text/plain' // TXT 파일도 지원
            ];
            if (!allowedTypes.includes(file.type)) {
                setFileError('PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.');
                setSelectedFile(null);
                return;
            }
            setFileError('');
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setFileError('');
        const fileInput = document.getElementById('resume-file-upload-qgc'); // ID 변경: 충돌 방지
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = () => {
        // 모든 설정 값들을 onGenerate 함수로 전달
        onGenerate({
            companyName,
            interviewType,
            resumeFile: selectedFile, // 파일도 함께 전달
            chunkSize,
            chunkOverlap,
            temperature
        });
    };

    const toggleAdvancedSettings = () => {
        setShowAdvancedSettings(!showAdvancedSettings);
    };

    return (
        // 컴포넌트 전체 배경 및 그림자 (다크 모드 적용)
        <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
            {/* 제목 텍스트 색상 (다크 모드 적용) */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">면접 예상 질문 도출</h2>

            {/* 회사 이름 입력 섹션 */}
            <div className="mb-4">
                <label htmlFor="company-name" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                    회사 이름 (선택 사항)
                </label>
                <input
                    type="text"
                    id="company-name"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    placeholder="면접 볼 회사 이름을 입력하세요 (예: Google, 삼성전자)"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            {/* 면접 유형 선택 섹션 */}
            <div className="mb-4">
                <label htmlFor="interview-type" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                    면접 유형
                </label>
                <select
                    id="interview-type"
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

            {/* 이력서 파일 첨부 섹션 - ResumeUploadSection 디자인 적용 */}
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="resume-file-upload-qgc">
                    이력서 파일 첨부 (선택 사항 - PDF, Word, TXT)
                </label>
                <label htmlFor="resume-file-upload-qgc" className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-blue-700
                                                                        dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload size={20} className="mr-2" />
                    {selectedFile ? selectedFile.name : '파일 선택 (PDF, DOCX, TXT)'}
                    <input
                        id="resume-file-upload-qgc" // ID 고유화
                        type="file"
                        accept=".pdf,.doc,.docx,.txt" // TXT 지원 형식에 추가
                        onChange={handleFileChange}
                        className="sr-only"
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
                {fileError && (
                    <p className="text-sm text-red-500 mt-2 dark:text-red-300">{fileError}</p>
                )}
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
                            <label htmlFor="chunkSize-qgc" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 크기: {chunkSize}
                            </label>
                            <input
                                id="chunkSize-qgc" // ID 고유화
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
                            <label htmlFor="chunkOverlap-qgc" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 중복: {chunkOverlap}
                            </label>
                            <input
                                id="chunkOverlap-qgc" // ID 고유화
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
                            <label htmlFor="temperature-qgc" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                창의성 수준: {temperature.toFixed(1)}
                            </label>
                            <input
                                id="temperature-qgc" // ID 고유화
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

            {/* 질문 생성 버튼 */}
            <button
                onClick={handleSubmit}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-md w-full transition-colors duration-300 mt-6 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {isLoading ? '질문 생성 중...' : '면접 질문 생성 시작'}
            </button>
        </div>
    );
}

export default QuestionGenerationControls;