// src/pages/UserGuidePage.jsx
import React from 'react';

function UserGuidePage() {
  return (
    // 페이지 전체 배경색 및 기본 텍스트 색상
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* 가이드 내용 컨테이너 배경 및 그림자 */}
      <div className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-md dark:bg-gray-700">
        {/* 제목 텍스트 색상 및 하단 보더 색상 */}
        <h1 className="text-4xl font-extrabold mb-8 text-center border-b pb-4 dark:text-gray-50 dark:border-gray-600">
          AI 커리어 챗봇 사용 가이드
        </h1>

        {/* 개요 섹션 */}
        <section className="mb-10">
          {/* 소제목 텍스트 색상 및 왼쪽 보더 색상 */}
          <h2 className="text-3xl font-bold text-blue-600 mb-4 border-l-4 border-blue-500 pl-3 dark:text-blue-400 dark:border-blue-700">
            챗봇 소개 및 사용 목적
          </h2>
          {/* 단락 텍스트 색상 */}
          <p className="text-lg text-gray-700 leading-relaxed mb-4 dark:text-gray-300">
            AI 커리어 챗봇은 생성형 AI 기술을 활용하여 구직자 및 이직자분들의 성공적인 취업을 돕기 위해 개발되었습니다. 이력서 분석부터 면접 준비까지, 당신의 커리어 여정에 필요한 맞춤형 가이드를 제공합니다.
          </p>
          {/* 리스트 아이템 텍스트 색상 */}
          <ul className="list-disc list-inside text-gray-700 space-y-2 dark:text-gray-300">
            <li><strong>시간 절약:</strong> 이력서 분석 및 면접 준비 시간을 단축합니다.</li>
            <li><strong>맞춤형 가이드:</strong> 당신의 데이터에 기반한 개인화된 조언을 제공합니다.</li>
            <li><strong>자신감 향상:</strong> 충분한 준비를 통해 면접에 대한 자신감을 높여줍니다.</li>
          </ul>
        </section>

        {/* 주요 기능별 안내 섹션 */}
        <section className="mb-10">
          {/* 소제목 텍스트 색상 및 왼쪽 보더 색상 */}
          <h2 className="text-3xl font-bold text-green-600 mb-4 border-l-4 border-green-500 pl-3 dark:text-green-400 dark:border-green-700">
            주요 기능 및 사용 방법
          </h2>

          {/* 1. 회원가입 및 로그인 카드 */}
          {/* 카드 배경 및 그림자 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-sm dark:bg-gray-800">
            {/* 제목 텍스트 색상 */}
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center dark:text-gray-100">
              <span className="text-green-500 text-3xl mr-2">1.</span> 회원가입 및 로그인
            </h3>
            {/* 단락 텍스트 색상 */}
            <p className="text-gray-700 leading-relaxed dark:text-gray-300">
              서비스 이용을 위해 회원가입 및 로그인이 필요합니다. 간단한 아이디와 비밀번호로 계정을 생성하고, 로그인하여 모든 기능을 이용해 보세요.
            </p>
            {/* 리스트 아이템 텍스트 색상 */}
            <ul className="list-disc list-inside text-gray-700 mt-2 ml-4 dark:text-gray-300">
              <li><strong>회원가입:</strong> 로그인 페이지 하단의 '회원가입' 링크 클릭 → 아이디, 비밀번호 입력 후 가입.</li>
              <li><strong>로그인:</strong> 로그인 페이지에서 등록한 아이디, 비밀번호 입력 → '로그인' 버튼 클릭.</li>
            </ul>
          </div>

          {/* 2. 대시보드 카드 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-sm dark:bg-gray-800">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center dark:text-gray-100">
              <span className="text-green-500 text-3xl mr-2">2.</span> 대시보드
            </h3>
            <p className="text-gray-700 leading-relaxed dark:text-gray-300">
              로그인 후 처음 만나는 페이지입니다. AI 커리어 챗봇의 주요 기능으로 바로 이동할 수 있는 링크를 제공합니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 ml-4 dark:text-gray-300">
              <li><strong>이력서 분석 바로가기:</strong> AI 이력서 분석 페이지로 이동합니다.</li>
              <li><strong>면접 예상 질문:</strong> AI 면접 예상 질문 생성 페이지로 이동합니다.</li>
              <li><strong>최근 분석 기록:</strong> (추후 업데이트 예정)</li>
            </ul>
          </div>

          {/* 3. 이력서 분석 카드 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-sm dark:bg-gray-800">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center dark:text-gray-100">
              <span className="text-green-500 text-3xl mr-2">3.</span> 이력서 분석
            </h3>
            <p className="text-gray-700 leading-relaxed dark:text-gray-300">
              당신의 이력서를 업로드하거나 텍스트로 입력하여 AI의 심층 분석을 받아볼 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 ml-4 dark:text-gray-300">
              <li><strong>파일 업로드:</strong> PDF 또는 Word(doc, docx) 형식의 이력서 파일을 첨부합니다.</li>
              <li><strong>텍스트 입력:</strong> 이력서 내용을 직접 텍스트로 붙여넣어 분석할 수 있습니다.</li>
              <li><strong>분석 결과:</strong> 이력서 요약, 핵심 역량, 추천 직무 및 관련 기술 등 맞춤형 분석 결과를 제공합니다.</li>
            </ul>
          </div>

          {/* 4. 면접 예상 질문 카드 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-sm dark:bg-gray-800">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center dark:text-gray-100">
              <span className="text-green-500 text-3xl mr-2">4.</span> 면접 예상 질문
            </h3>
            <p className="text-gray-700 leading-relaxed dark:text-gray-300">
              AI가 지원 회사, 면접 유형, 이력서 내용에 맞춰 예상 면접 질문을 생성해 드립니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 ml-4 dark:text-gray-300">
              <li><strong>질문 생성:</strong> 회사 이름, 면접 유형(종합/기술/인성)을 선택하고, 필요시 이력서 파일을 첨부합니다.</li>
              <li><strong>질문 복사:</strong> 생성된 질문을 클릭 한 번으로 복사하여 편리하게 활용할 수 있습니다.</li>
              <li><strong>답변 입력/피드백:</strong> (추후 업데이트 예정) 각 질문에 답변을 입력하고 AI 피드백을 받을 수 있습니다.</li>
            </ul>
          </div>

        </section>

        {/* 문의 및 도움말 섹션 */}
        <section className="mb-6">
          {/* 소제목 텍스트 색상 및 왼쪽 보더 색상 */}
          <h2 className="text-3xl font-bold text-indigo-600 mb-4 border-l-4 border-indigo-500 pl-3 dark:text-indigo-400 dark:border-indigo-700">
            문의 및 도움말
          </h2>
          {/* 단락 텍스트 색상 */}
          <p className="text-gray-700 leading-relaxed dark:text-gray-300">
            챗봇 사용 중 궁금한 점이나 문제가 발생하면 언제든지 문의해 주세요. (추후 문의 채널 제공 예정)
          </p>
        </section>

        {/* 하단 메시지 텍스트 색상 */}
        <p className="text-center text-gray-500 text-sm mt-10 dark:text-gray-400">
          AI 커리어 챗봇과 함께 당신의 꿈을 향해 나아가세요!
        </p>
      </div>
    </div>
  );
}

export default UserGuidePage;