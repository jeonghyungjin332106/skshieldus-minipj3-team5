// src/components/ResumeUploadSection.jsx
import React from 'react';

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
    recommendedResults,
    interviewPrepResults,
}) {
    return (
        <aside className="w-1/3 bg-white p-8 rounded-2xl shadow-xl border border-blue-100 flex flex-col justify-start space-y-6 overflow-y-auto mr-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">이력서 업로드</h2>
            <input
                type="file"
                id="resumeFileInput"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600
                          file:mr-4 file:py-3 file:px-6
                          file:rounded-full file:border-0
                          file:text-base file:font-semibold
                          file:bg-blue-100 file:text-blue-700
                          hover:file:bg-blue-200 transition-colors duration-200 cursor-pointer"
            />
            {selectedFile && (
                <p className="text-gray-700 mt-2 text-center text-base">
                    선택된 파일: <span className="font-semibold text-blue-700">{selectedFile.name}</span>
                </p>
            )}
            <div className="flex space-x-3 w-full">
                <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isUploading}
                    className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-md
                                ${!selectedFile || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            업로드 중...
                        </span>
                    ) : '이력서 업로드'}
                </button>
                {selectedFile && (
                    <button
                        onClick={handleClearFile}
                        className="flex-none px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                        파일 초기화
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
                지원 형식: PDF, Word (.docx), TXT
            </p>

            {/* 고급 설정 (Accordion) */}
            <div className="w-full mt-6">
                <button
                    onClick={toggleAdvancedSettings}
                    className="w-full text-left p-4 bg-blue-100 rounded-lg font-semibold text-blue-800 hover:bg-blue-200 transition-colors duration-200 flex justify-between items-center shadow-sm"
                >
                    <span>고급 설정</span>
                    <span>{showAdvancedSettings ? '▲' : '▼'}</span>
                </button>
                {showAdvancedSettings && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-b-lg space-y-4 shadow-inner">
                        <div>
                            <label htmlFor="chunkSize" className="block text-sm font-medium text-blue-700 mb-1">
                                청크 크기: {chunkSize}
                            </label>
                            <input
                                type="range"
                                id="chunkSize"
                                min="100"
                                max="2000"
                                step="50"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                title="텍스트를 나누는 단위 (500-2000 권장)"
                            />
                            <p className="text-xs text-blue-600 mt-1">텍스트를 나누는 단위 (500-2000 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="chunkOverlap" className="block text-sm font-medium text-blue-700 mb-1">
                                청크 중복: {chunkOverlap}
                            </label>
                            <input
                                type="range"
                                id="chunkOverlap"
                                min="0"
                                max="500"
                                step="10"
                                value={chunkOverlap}
                                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                title="청크 간 중복되는 문자 수 (50-300 권장)"
                            />
                            <p className="text-xs text-blue-600 mt-1">청크 간 중복되는 문자 수 (50-300 권장)</p>
                        </div>
                        <div>
                            <label htmlFor="temperature" className="block text-sm font-medium text-blue-700 mb-1">
                                창의성 수준: {temperature.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                id="temperature"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                title="0: 정확성 우선, 1: 창의성 우선"
                            />
                            <p className="text-xs text-blue-600 mt-1">0: 정확성 우선, 1: 창의성 우선</p>
                        </div>
                    </div>
                )}
            </div>


            {/* AI Recommendation Results Section */}
            {recommendedResults && (
                <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-lg border border-blue-200 w-full">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                        <span className="mr-2 text-2xl">✨</span> AI 추천 결과
                    </h3>
                    {recommendedResults.jobs.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-semibold text-blue-700 mb-2">추천 직무:</h4>
                            <ul className="list-disc list-inside text-gray-800 space-y-1">
                                {recommendedResults.jobs.map((job, idx) => (
                                    <li key={idx} className="text-sm">{job}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {recommendedResults.skills.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-blue-700 mb-2">필요 기술 스택:</h4>
                            <ul className="list-disc list-inside text-gray-800 space-y-1">
                                {recommendedResults.skills.map((skill, idx) => (
                                    <li key={idx} className="text-sm">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {recommendedResults.jobs.length === 0 && recommendedResults.skills.length === 0 && (
                        <p className="text-gray-600 text-sm">추천 결과가 없습니다.</p>
                    )}
                </div>
            )}

            {/* AI Generated Interview Questions Section */}
            {interviewPrepResults && (
                <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-lg border border-blue-200 w-full">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                        <span className="mr-2 text-2xl">🗣️</span> 예상 면접 질문
                    </h3>
                    {interviewPrepResults.questions.length > 0 ? (
                        <ol className="list-decimal list-inside text-gray-800 space-y-3">
                            {interviewPrepResults.questions.map((q, idx) => (
                                <li key={idx}>
                                    <p className="font-semibold text-base">{q.question}</p>
                                    {q.guidance && <p className="text-sm text-gray-700 ml-4 mt-1">💡 {q.guidance}</p>}
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-gray-600 text-sm">생성된 면접 질문이 없습니다.</p>
                    )}
                    {interviewPrepResults.guidance && interviewPrepResults.questions.length > 0 && (
                        <p className="text-sm text-gray-700 mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                            **전반적인 답변 가이드라인:** {interviewPrepResults.guidance}
                        </p>
                    )}
                </div>
            )}
        </aside>
    );
}

export default ResumeUploadSection;