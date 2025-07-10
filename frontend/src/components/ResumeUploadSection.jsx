import React, { useState } from 'react';
import { Upload, FileText, X, ChevronDown, Settings } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

function ResumeUploadSection({ onAnalyzeProp, isLoading }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [chunkSize, setChunkSize] = useState(1000);
    const [chunkOverlap, setChunkOverlap] = useState(200);
    const [temperature, setTemperature] = useState(0.5);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleAnalyzeClick = () => {
        // [Debug 1] 버튼이 클릭되었는지 확인
        console.log("✅ [Debug 1] '분석 시작하기' 버튼 클릭됨!");

        if (!selectedFile) {
            alert('분석할 이력서 파일을 선택해주세요.');
            return;
        }

        const analysisData = {
            file: selectedFile,
            settings: { chunkSize, chunkOverlap, temperature }
        };

        // [Debug 2] 부모 컴포넌트로 데이터를 보내기 직전인지 확인
        console.log("✅ [Debug 2] onAnalyzeProp 호출 직전. 전달할 데이터:", analysisData);

        // 부모 컴포넌트로부터 받은 onAnalyzeProp 함수를 호출
        onAnalyzeProp(analysisData);
    };

    // ... (나머지 JSX 코드는 동일)
    return (
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex-grow flex flex-col">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">1. 이력서 파일 업로드</h2>
                    <label htmlFor="resume-upload" className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">클릭하여 업로드</span> 또는 드래그</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOCX, TXT</p>
                        </div>
                        <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                    </label>
                    {selectedFile && (
                        <div className="mt-4 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{selectedFile.name}</span>
                            </div>
                            <button onClick={handleRemoveFile} className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"><X size={16} /></button>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex justify-between items-center w-full text-left">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center"><Settings size={18} className="mr-2"/>고급 설정</h3>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>
                    {showAdvanced && (
                        <div className="mt-4 space-y-4 animate-fade-in">
                            <div>
                                <label htmlFor="chunkSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">청크 사이즈: <span className="font-bold text-blue-600 dark:text-blue-400">{chunkSize}</span></label>
                                <input id="chunkSize" type="range" min="200" max="2000" step="100" value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="chunkOverlap" className="block text-sm font-medium text-gray-700 dark:text-gray-300">청크 중첩: <span className="font-bold text-blue-600 dark:text-blue-400">{chunkOverlap}</span></label>
                                <input id="chunkOverlap" type="range" min="0" max="500" step="50" value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600" />
                            </div>
                             <div>
                                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI 창의성 (Temperature): <span className="font-bold text-blue-600 dark:text-blue-400">{temperature}</span></label>
                                <input id="temperature" type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6">
                    <button
                        onClick={handleAnalyzeClick}
                        disabled={isLoading || !selectedFile}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : '분석 시작하기'}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default ResumeUploadSection;
