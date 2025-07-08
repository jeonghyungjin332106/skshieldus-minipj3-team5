// src/pages/DashboardPage.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-md dark:bg-gray-700">
        <h1 className="text-4xl font-extrabold mb-6 text-center dark:text-gray-50">
          환영합니다, <span className="text-blue-600">{user?.name || user?.id || '사용자'}</span>님!
        </h1>
        <p className="text-xl text-gray-700 mb-10 text-center dark:text-gray-300">
          AI 커리어 상담 챗봇이 당신의 성공적인 취업을 돕습니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* 1. 이력서 분석 바로가기 (기존과 동일) */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1 dark:bg-gray-800 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                <svg className="w-7 h-7 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L14.414 5A2 2 0 0115 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                이력서 분석 바로가기
              </h2>
              <p className="text-gray-600 mb-4 dark:text-gray-300">
                AI가 당신의 이력서를 분석하고 핵심 역량 및 추천 직무를 제시해 드립니다.
              </p>
            </div>
            <Link to="/resume-analysis" className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 inline-block text-center mt-auto">
              이력서 분석 시작하기
            </Link>
          </div>

          {/* 2. 면접 예상 질문 (기존과 동일) */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1 dark:bg-gray-800 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                <svg className="w-7 h-7 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-4a1 1 0 00-.894.553L7.382 10H4a1 1 0 100 2h3.382l-.894 1.447A1 1 0 0010 16h.01a1 1 0 00.992-.883l.775-4.132 1.447 1.447a1 1 0 001.414-1.414l-2.293-2.293a1 1 0 00-1.414 0L10 6z" clipRule="evenodd"></path></svg>
                면접 예상 질문
              </h2>
              <p className="text-gray-600 mb-4 dark:text-gray-300">
                AI가 회사, 이력서, 면접 유형에 맞춰 예상 질문을 생성해 드립니다.
              </p>
            </div>
            <Link to="/interview-questions" className="bg-purple-500 text-white px-5 py-2 rounded-md hover:bg-purple-600 transition-colors duration-300 inline-block text-center mt-auto">
              질문 생성 시작하기
            </Link>
          </div>

          {/* --- 💡 3. '최근 분석 기록'을 별도 페이지로 연결하는 버튼으로 수정 --- */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-1 dark:bg-gray-800 flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                    <svg className="w-7 h-7 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                    최근 분석 기록
                </h2>
                <p className="text-gray-600 mb-4 dark:text-gray-300">
                    이전 대화 내용을 확인하고 분석을 이어서 진행할 수 있습니다.
                </p>
            </div>
            <Link to="/history" className="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-600 transition-colors duration-300 inline-block text-center mt-auto">
                기록 전체 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;