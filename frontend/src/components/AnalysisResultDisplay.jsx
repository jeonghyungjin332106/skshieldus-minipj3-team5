import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * 이력서 분석 결과를 표시하는 컴포넌트
 * 로딩, 에러, 결과 없음, 결과 있음 네 가지 상태에 따라 다른 UI를 렌더링합니다.
 * @param {object} props
 * @param {object | null} props.analysisResults - 분석 결과 데이터 객체
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {string | null} props.error - 에러 메시지
 */
function AnalysisResultDisplay({ analysisResults = null, isLoading = false, error }) {

  // 로딩 상태일 때의 UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-48 bg-white rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-100">
        <LoadingSpinner size="lg" color="blue" />
        <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">이력서를 분석 중입니다...</p>
      </div>
    );
  }

  // 에러가 발생했을 때의 UI
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-6 text-center text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800">
        <p className="text-lg font-semibold mb-2">분석 중 오류가 발생했습니다.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // 분석 결과가 아직 없을 때의 초기 UI
  if (!analysisResults) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center dark:bg-gray-700 dark:text-gray-100 h-full flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-50">이력서 분석 결과</h2>
        <p className="text-gray-600 leading-relaxed dark:text-gray-300">왼쪽 패널에서 이력서를 업로드하거나 직접 입력하여 분석을 시작하세요.</p>
        <p className="text-gray-500 text-sm mt-2 dark:text-gray-400">
          (PDF, Word 파일 또는 텍스트 직접 입력 가능)
        </p>
      </div>
    );
  }

  // 분석 결과가 정상적으로 있을 때의 UI
  return (
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">이력서 분석 결과</h2>

      {/* 이력서 요약 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center dark:text-gray-200">
          <svg className="w-5 h-5 text-indigo-500 mr-2 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L14.414 5A2 2 0 0115 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
          이력서 요약
        </h3>
        <p className="text-gray-600 leading-relaxed dark:text-gray-300">
          {analysisResults.summary || "분석된 요약 내용이 없습니다."}
        </p>
      </div>

      {/* 핵심 역량 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center dark:text-gray-200">
          <svg className="w-5 h-5 text-purple-500 mr-2 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zm3.707 8.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
          핵심 역량
        </h3>
        <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1 dark:text-gray-300">
          {analysisResults.skills?.length > 0 ? (
            analysisResults.skills.map((skill, index) => <li key={index}>{skill}</li>)
          ) : (
            <li>분석된 핵심 역량이 없습니다.</li>
          )}
        </ul>
      </div>

      {/* 추천 직무 및 관련 기술 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center dark:text-gray-200">
          <svg className="w-5 h-5 text-teal-500 mr-2 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
          추천 직무 및 관련 기술
        </h3>
        <p className="text-gray-600 mb-2 dark:text-gray-300">
          {analysisResults.recommendations || "추천 직무가 없습니다."}
        </p>
        <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1 dark:text-gray-300">
          {analysisResults.recommendedSkills?.length > 0 ? (
            analysisResults.recommendedSkills.map((recSkill, index) => <li key={index}>{recSkill}</li>)
          ) : (
            <li>추천 관련 기술이 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default AnalysisResultDisplay;