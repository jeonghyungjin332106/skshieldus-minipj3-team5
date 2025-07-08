import React, { useState } from 'react';
import { Upload, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { notifyError } from './Notification';
import LoadingSpinner from './LoadingSpinner';

/**
 * 이력서 업로드 및 분석 관련 설정을 담당하는 컴포넌트입니다.
 * 사용자에게 파일 업로드 또는 텍스트 직접 입력을 통해 이력서를 제공받고,
 * 고급 설정을 통해 분석 파라미터를 조절할 수 있는 인터페이스를 제공합니다.
 *
 * @param {object} props - ResumeUploadSection 컴포넌트에 전달되는 props
 * @param {function(object): void} props.onAnalyzeProp - '분석 시작하기' 버튼 클릭 시 호출될 함수.
 * 선택된 파일, 입력 텍스트, 고급 설정 값들을 포함하는 객체를 인자로 받습니다.
 * @param {boolean} props.isLoading - 이력서 분석 API 호출 중 로딩 상태 여부
 */
function ResumeUploadSection({
    onAnalyzeProp,
    isLoading
}) {
    // 이력서 파일 업로드 및 텍스트 입력 상태 관리
    const [selectedFile, setSelectedFile] = useState(null);
    const [inputText, setInputText] = useState('');
    const [fileError, setFileError] = useState('');

    // 고급 설정 관련 상태 관리
    const [chunkSize, setChunkSize] = useState(1000);
    const [chunkOverlap, setChunkOverlap] = useState(200);
    const [temperature, setTemperature] = useState(0.0);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    /**
     * 파일 입력 변경 핸들러입니다.
     * 선택된 파일의 유효성을 검사하고 상태를 업데이트합니다.
     * 파일이 선택되면 텍스트 입력 필드를 초기화합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 파일 입력 변경 이벤트 객체
     */
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        // 허용되지 않는 파일 형식일 경우 에러 메시지 표시
        if (!allowedTypes.includes(file.type)) {
            const errorMsg = 'PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.';
            setFileError(errorMsg);
            notifyError(errorMsg);
            setSelectedFile(null);
            e.target.value = ''; // 파일 입력 필드 초기화
            return;
        }
        setFileError(''); // 에러 상태 초기화
        setSelectedFile(file); // 선택된 파일 상태 업데이트
        setInputText(''); // 파일 선택 시 텍스트 입력 초기화
    };

    /**
     * 첨부된 파일 제거 핸들러입니다.
     * 선택된 파일 상태와 파일 입력 필드를 초기화합니다.
     */
    const handleClearFile = () => {
        setSelectedFile(null);
        setFileError('');
        const fileInput = document.getElementById('resumeFileInput');
        if (fileInput) fileInput.value = ''; // 실제 input 요소의 값 초기화
    };

    /**
     * 이력서 내용 직접 입력 필드 변경 핸들러입니다.
     * 텍스트 입력 시 선택된 파일이 있으면 파일을 초기화합니다.
     * @param {React.ChangeEvent<HTMLTextAreaElement>} e - 텍스트 영역 변경 이벤트 객체
     */
    const handleTextChange = (e) => {
        setInputText(e.target.value);
        if (selectedFile) handleClearFile(); // 텍스트 입력 시 파일 선택 해제
    };

    /**
     * '분석 시작하기' 버튼 클릭 핸들러입니다.
     * 필수 입력값(파일 또는 텍스트)이 있는지 확인하고,
     * `onAnalyzeProp` 함수를 호출하여 분석을 시작합니다.
     */
    const handleSubmit = () => {
        // 파일 또는 텍스트 중 하나는 반드시 제공되어야 합니다.
        if (!selectedFile && !inputText.trim()) {
            notifyError('이력서 파일 또는 텍스트를 입력해주세요.');
            return;
        }
        if (isLoading) return; // 로딩 중에는 중복 제출 방지

        // 부모 컴포넌트로 현재 설정된 모든 값을 전달하여 분석 요청
        onAnalyzeProp({
            file: selectedFile,
            text: inputText.trim(),
            chunkSize,
            chunkOverlap,
            temperature
        });
    };

    return (
        <aside
            className="w-full md:w-96 h-full flex-shrink-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-200
                       flex flex-col dark:bg-gray-800 dark:border-gray-700"
        >
            <h2 className="text-xl font-bold text-gray-800 text-center dark:text-gray-50 mb-4 flex-shrink-0">
                이력서 업로드 및 설정
            </h2>

            {/* 이력서 업로드 또는 직접 입력 섹션 */}
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">
                {/* 1. 이력서 파일 업로드 */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                        1. 이력서 파일 업로드
                    </label>
                    <label
                        htmlFor="resumeFileInput"
                        className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                    ${isLoading
                                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                        : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                    }
                                    dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400
                                    ${!isLoading && 'dark:hover:bg-gray-700 dark:hover:border-gray-500'}`}
                    >
                        <Upload size={20} className="mr-2" />
                        <span className="truncate">
                            {selectedFile ? selectedFile.name : '파일 선택 (PDF, DOCX, TXT)'}
                        </span>
                        <input
                            id="resumeFileInput"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="sr-only" // 시각적으로 숨김
                            disabled={isLoading}
                        />
                    </label>
                    {/* 선택된 파일 이름 및 제거 버튼 */}
                    {selectedFile && (
                        <div
                            className="flex items-center justify-between bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-sm mt-2
                                       dark:bg-gray-700 dark:text-gray-200"
                        >
                            <span className="truncate">{selectedFile.name}</span>
                            <button
                                onClick={handleClearFile}
                                disabled={isLoading}
                                className="text-gray-500 hover:text-gray-700 ml-2 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                                aria-label="선택된 파일 제거"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {/* 파일 업로드 에러 메시지 */}
                    {fileError && <p className="text-sm text-red-500 mt-2 dark:text-red-400">{fileError}</p>}
                </div>

                {/* 2. 이력서 내용 직접 입력 */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="text-input-resume-section">
                        2. 이력서 내용 직접 입력
                    </label>
                    <textarea
                        id="text-input-resume-section"
                        className="w-full shadow-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[150px]
                                   dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                        placeholder="이력서 내용을 직접 입력하거나 붙여넣으세요..."
                        value={inputText}
                        onChange={handleTextChange}
                        disabled={isLoading}
                    ></textarea>
                </div>
            </div>

            {/* 고급 설정 섹션 */}
            <div className="w-full mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0">
                {/* 고급 설정 토글 버튼 */}
                <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="w-full flex justify-between items-center font-bold text-gray-700 hover:text-black transition-colors duration-200
                               dark:text-gray-200 dark:hover:text-white"
                    disabled={isLoading}
                    aria-expanded={showAdvancedSettings}
                    aria-controls="advanced-settings-panel-resume" // 고유 ID 부여
                >
                    <span className="flex items-center text-md">
                        <Settings size={18} className="mr-2" /> 고급 설정
                    </span>
                    {showAdvancedSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {/* 고급 설정 패널 (토글 시 표시) */}
                {showAdvancedSettings && (
                    <div id="advanced-settings-panel-resume" className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                        {/* 청크 크기 설정 */}
                        <div>
                            <label htmlFor="chunkSize-resume-section" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                청크 크기: {chunkSize}
                            </label>
                            <input
                                id="chunkSize-resume-section"
                                type="range"
                                min="100"
                                max="2000"
                                step="50"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-600 dark:accent-blue-500"
                                disabled={isLoading}
                                title="AI가 한 번에 읽고 처리할 글자 수를 조절합니다. 값이 클수록 넓은 맥락을 파악하지만, 세부 정보는 놓칠 수 있습니다."
                            />
                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">AI가 한 번에 읽는 글자 수 (권장: 500-1500)</p>
                        </div>
                        {/* 청크 중복 설정 */}
                        <div>
                            <label htmlFor="chunkOverlap-resume-section" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                청크 중복: {chunkOverlap}
                            </label>
                            <input
                                id="chunkOverlap-resume-section"
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={chunkOverlap}
                                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-600 dark:accent-blue-500"
                                disabled={isLoading}
                                title="나누어진 텍스트 조각(청크)들이 서로 겹치는 글자 수입니다. 문맥 연결을 부드럽게 합니다."
                            />
                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">문맥 연결을 위한 겹치는 글자 수 (권장: 50-200)</p>
                        </div>
                        {/* 창의성 수준 (Temperature) 설정 */}
                        <div>
                            <label htmlFor="temperature-resume-section" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                창의성 수준: {temperature.toFixed(1)}
                            </label>
                            <input
                                id="temperature-resume-section"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-600 dark:accent-blue-500"
                                disabled={isLoading}
                                title="0에 가까울수록 사실 기반의 답변을, 1에 가까울수록 다양하고 창의적인 답변을 생성합니다."
                            />
                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">0: 정확성 우선, 1: 창의성 우선 </p>
                        </div>
                    </div>
                )}
            </div>

            {/* '분석 시작하기' 버튼 */}
            <div className="mt-auto pt-4 flex-shrink-0">
                <button
                    onClick={handleSubmit}
                    className="w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center
                               bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed dark:disabled:bg-blue-800"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner size="sm" color="white" />
                            <span className="ml-2">분석 중...</span>
                        </>
                    ) : (
                        '분석 시작하기'
                    )}
                </button>
            </div>
        </aside>
    );
}

export default ResumeUploadSection;