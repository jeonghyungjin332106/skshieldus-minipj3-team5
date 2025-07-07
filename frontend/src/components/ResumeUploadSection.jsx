// src/components/ResumeUploadSection.jsx
import React from 'react';
import { Upload, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'; // 아이콘 임포트

function ResumeUploadSection({
    selectedFile,
    isUploading,
    handleFileChange,
    handleClearFile,
    handleFileUpload,
    chunkSize,
    setChunkSize,
    chunkOverlap,
    setChunkOverlap,
    temperature,
    setTemperature,
    showAdvancedSettings,
    toggleAdvancedSettings,
    // recommendedResults, // 더 이상 이 컴포넌트에서 직접 사용하지 않음
    // interviewPrepResults, // 더 이상 이 컴포넌트에서 직접 사용하지 않음
}) {
    return (
        <aside className="w-full md:w-80 flex-shrink-0 bg-white p-6 rounded-2xl shadow-xl border border-blue-100 flex flex-col justify-start space-y-6 overflow-y-auto mr-6
                           dark:bg-gray-700 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center dark:text-gray-50">
                이력서 업로드
            </h2>
            <label htmlFor="resumeFileInput" className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-blue-700
                                                        dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800">
                <Upload size={20} className="mr-2" />
                {selectedFile ? selectedFile.name : '파일 선택 (PDF, DOCX, TXT)'}
                <input
                    id="resumeFileInput"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
            {selectedFile && (
                <div className="flex items-center justify-between bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm
                                dark:bg-blue-800 dark:text-blue-200">
                    <span>{selectedFile.name}</span>
                    <button onClick={handleClearFile} className="text-blue-600 hover:text-blue-800 ml-2 dark:text-blue-300 dark:hover:text-blue-100">
                        <X size={16} />
                    </button>
                </div>
            )}
            <button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    !selectedFile || isUploading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-md dark:bg-blue-700 dark:hover:bg-blue-800'
                }`}
            >
                {isUploading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        업로드 중...
                    </span>
                ) : '이력서 업로드 및 분석 시작'}
            </button>
            <p className="text-sm text-gray-500 mt-2 text-center dark:text-gray-400">
                지원 형식: PDF, Word (.docx), TXT
            </p>

            {/* 고급 설정 (Accordion) */}
            <div className="w-full mt-6 border-t pt-6 border-gray-200 dark:border-gray-600">
                <button
                    onClick={toggleAdvancedSettings}
                    className="w-full flex justify-between items-center text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200
                               dark:text-gray-50 dark:hover:text-blue-400"
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
                            <label htmlFor="chunkSize" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 크기: {chunkSize}
                            </label>
                            <input
                                id="chunkSize"
                                type="range"
                                min="100"
                                max="2000"
                                step="50"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="텍스트를 나누는 단위 (500-2000 권장)"
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">텍스트를 나누는 단위 (500-2000 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="chunkOverlap" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                청크 중복: {chunkOverlap}
                            </label>
                            <input
                                id="chunkOverlap"
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={chunkOverlap}
                                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="청크 간 중복되는 문자 수 (50-300 권장)"
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">청크 간 중복되는 문자 수 (50-300 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="temperature" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
                                창의성 수준: {temperature.toFixed(1)}
                            </label>
                            <input
                                id="temperature"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="0: 정확성 우선, 1: 창의성 우선"
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">0: 정확성 우선, 1: 창의성 우선</p>
                        </div>
                    </div>
                )}
            </div>
            {/* recommendedResults 및 interviewPrepResults 섹션은 ResumeAnalysisPage에서 AnalysisResultDisplay를 통해 처리되므로 이 컴포넌트에서는 제거함 */}
        </aside>
    );
}

export default ResumeUploadSection;