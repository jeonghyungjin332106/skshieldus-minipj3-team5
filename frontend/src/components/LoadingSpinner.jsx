// src/components/LoadingSpinner.jsx
import React from 'react';

function LoadingSpinner({ size = 'md', color = 'blue' }) {
  // 스피너 크기 설정
  const spinnerSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  // 스피너 색상 설정 (prop으로 받은 색상을 Tailwind CSS 클래스로 매핑)
  const spinnerColor = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500',
    purple: 'border-purple-500',
  }[color];

  return (
    // 스피너를 중앙에 배치하기 위한 컨테이너
    <div className="flex justify-center items-center">
      {/* 스피너 자체의 스타일 */}
      <div
        // inline-block: 요소의 크기를 내용만큼만 차지하게 함
        // animate-spin: Tailwind CSS의 회전 애니메이션
        // rounded-full: 원형 모양
        // border-4: 테두리 두께 4px
        // border-solid: 테두리 스타일 실선
        // border-r-transparent: 오른쪽 테두리만 투명하게 하여 회전 애니메이션 효과를 냄
        // align-[-0.125em]: 텍스트 베이스라인 정렬 조정
        // motion-reduce:animate-[spin_1.5s_linear_infinite]: 애니메이션 축소 설정 (접근성)
        // ${spinnerSize}: prop에 따라 동적으로 크기 클래스 적용
        // ${spinnerColor}: prop에 따라 동적으로 색상 클래스 적용
        className={`inline-block animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${spinnerSize} ${spinnerColor}`}
        role="status" // 스크린 리더를 위한 역할
      >
        {/* 스크린 리더만을 위한 텍스트 (시각적으로 숨김) */}
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    </div>
  );
}

export default LoadingSpinner;