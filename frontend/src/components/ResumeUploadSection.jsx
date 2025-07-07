// src/components/ResumeUploadSection.jsx
import React, { useState } from 'react';
import { Upload, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { notifyError } from './Notification';
import LoadingSpinner from './LoadingSpinner'; // ⭐️ LoadingSpinner 임포트 추가 ⭐️


function ResumeUploadSection({
    onAnalyzeProp,
    isLoading
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [inputText, setInputText] = useState('');
    const [fileError, setFileError] = useState('');

    const [chunkSize, setChunkSize] = useState(1000);
    const [chunkOverlap, setChunkOverlap] = useState(200);
    const [temperature, setTemperature] = useState(0.0);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
            if (!allowedTypes.includes(file.type)) {
                setFileError('PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.');
                notifyError('PDF, Word (.doc, .docx), TXT 파일만 업로드할 수 있습니다.');
                setSelectedFile(null);
                return;
            }
            setFileError('');
            setSelectedFile(file);
            setInputText('');
        } else {
            setSelectedFile(null);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setFileError('');
        const fileInput = document.getElementById('resumeFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleTextChange = (e) => {
        setInputText(e.target.value);
        setSelectedFile(null);
    };

    const handleSubmitAnalysis = () => {
        if (!selectedFile && (inputText.trim() === '')) {
            notifyError('이력서 파일 또는 텍스트를 입력해주세요.');
            return;
        }
        if (isLoading) return;

        onAnalyzeProp({ 
            file: selectedFile,
            text: inputText.trim(),
            chunkSize: chunkSize,
            chunkOverlap: chunkOverlap,
            temperature: temperature
        });
    };

    const toggleAdvancedSettings = () => {
        setShowAdvancedSettings(!showAdvancedSettings);
    };

    return (
        <aside className="w-full md:w-80 flex-shrink-0 bg-white p-6 rounded-2xl shadow-xl border border-blue-100 flex flex-col justify-start space-y-6 overflow-y-auto mr-6
                           dark:bg-gray-700 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center dark:text-gray-50">
                이력서 업로드 및 분석
            </h2>
            
            <div className="mb-6 border-b pb-6 dark:border-gray-600">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="resumeFileInput">
                    1. 이력서 파일 업로드 (PDF, Word, TXT)
                </label>
                <label htmlFor="resumeFileInput" className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-blue-700
                                                                        dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload size={20} className="mr-2" />
                    {selectedFile ? selectedFile.name : '파일 선택 (PDF, DOCX, TXT)'}
                    <input
                        id="resumeFileInput"
                        type="file"
                        accept=".pdf,.docx,.txt"
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
                <p className="text-sm text-gray-500 mt-2 text-center dark:text-gray-400">
                    지원 형식: PDF, Word (.doc, .docx), TXT
                </p>
                {fileError && (
                    <p className="text-sm text-red-500 mt-2 dark:text-red-300">{fileError}</p>
                )}
            </div>

            {/* 2. 텍스트 직접 입력 섹션 */}
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="text-input-resume-section">
                    2. 이력서 내용 직접 입력
                </label>
                <textarea
                    id="text-input-resume-section"
                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[150px] dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    placeholder="여기에 이력서 내용을 직접 입력하거나 붙여넣으세요..."
                    value={inputText}
                    onChange={handleTextChange}
                    disabled={isLoading}
                ></textarea>
            </div>

            {/* 고급 설정 (Accordion) */}
            <div className="w-full mt-6 border-t pt-6 border-gray-200 dark:border-gray-600">
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
                            <label htmlFor="chunkSize-resume-section" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
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
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="텍스트를 나누는 단위 (500-2000 권장)"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">텍스트를 나누는 단위 (500-2000 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="chunkOverlap-resume-section" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
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
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                                           dark:bg-blue-700 dark:accent-blue-400"
                                title="청크 간 중복되는 문자 수 (50-300 권장)"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-blue-600 mt-1 dark:text-blue-300">청크 간 중복되는 문자 수 (50-300 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="temperature-resume-section" className="block text-sm font-medium text-blue-700 mb-1 dark:text-blue-200">
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
            
            {/* 분석 시작 버튼 */}
            <button
                onClick={handleSubmitAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md w-full transition-colors duration-300 mt-6 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {/* ⭐️⭐️⭐️ 로딩 스피너 적용 ⭐️⭐️⭐️ */}
                {isLoading ? (
                    <span className="flex items-center justify-center">
                        <LoadingSpinner size="sm" color="white" /> {/* 버튼 내부이므로 sm 사이즈, 흰색 */}
                        <span className="ml-2">분석 중...</span>
                    </span>
                ) : (
                    '이력서 분석 시작'
                )}
                {/* --------------------------- */}
            </button>
        </aside>
    );
}

export default ResumeUploadSection;