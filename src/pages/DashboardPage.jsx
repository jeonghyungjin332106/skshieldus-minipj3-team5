// src/pages/DashboardPage.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // Link 임포트 추가

function DashboardPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          환영합니다, <span className="text-blue-600">{user?.name || user?.id || '사용자'}</span>님!
        </h1>
        <p className="text-xl text-gray-700 mb-10 text-center">
          AI 커리어 상담 챗봇이 당신의 성공적인 취업을 돕습니다.
        </p>

        {/* 대시보드 섹션 컨테이너 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* 1. 이력서 분석 바로가기 섹션 (새로 추가) */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-7 h-7 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L14.414 5A2 2 0 0115 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
              </svg>
              이력서 분석 바로가기
            </h2>
            <p className="text-gray-600 mb-4">
              AI가 당신의 이력서를 분석하고 핵심 역량 및 추천 직무를 제시해 드립니다.
            </p>
            <Link to="/resume-analysis" className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 inline-block">
              이력서 분석 시작하기
            </Link>
          </div>

          {/* 2. 최근 분석 기록 섹션 (기존 유지) */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-7 h-7 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 002-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
              </svg>
              최근 분석 기록
            </h2>
            <p className="text-gray-600 mb-4">최근 이력서 분석 및 상담 기록이 여기에 표시됩니다.</p>
            <ul className="space-y-2 text-gray-700">
              <li>최근 기록이 없습니다.</li>
            </ul>
          </div>

          {/* 3. 추천 질문 섹션 (기존 유지) */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-7 h-7 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L10 11.586l-2.293-2.293z"></path><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd"></path>
              </svg>
              면접 추천 질문
            </h2>
            <p className="text-gray-600 mb-4">당신에게 필요한 맞춤형 면접 질문을 추천해 드립니다.</p>
            <ul className="space-y-2 text-gray-700">
              <li>추천 질문이 없습니다.</li>
            </ul>
            <button className="mt-4 bg-purple-500 text-white px-5 py-2 rounded-md hover:bg-purple-600 transition-colors duration-300">
              전체 추천 질문 보기
            </button>
          </div>

        </div> {/* End of grid */}

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            다른 유용한 기능들을 곧 만나보실 수 있습니다!
          </p>
        </div>

      </div> {/* End of container */}
    </div>
  );
}

export default DashboardPage;