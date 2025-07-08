// src/components/LoadingSpinner.jsx
import React from 'react';

/**
 * 시각적인 로딩 스피너를 표시하는 컴포넌트입니다.
 * 다양한 크기와 색상으로 커스터마이징할 수 있습니다.
 *
 * @param {object} props - LoadingSpinner 컴포넌트에 전달되는 props
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - 스피너의 크기 ('sm', 'md', 'lg', 'xl' 중 하나)
 * @param {'blue' | 'green' | 'red' | 'gray' | 'purple'} [props.color='blue'] - 스피너의 색상
 */
function LoadingSpinner({ size = 'md', color = 'blue' }) {
    // `size` prop에 따라 Tailwind CSS 크기 클래스를 매핑합니다.
    const spinnerSize = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    }[size];

    // `color` prop에 따라 Tailwind CSS 테두리 색상 클래스를 매핑합니다.
    const spinnerColor = {
        blue: 'border-blue-500',
        green: 'border-green-500',
        red: 'border-red-500',
        gray: 'border-gray-500',
        purple: 'border-purple-500',
    }[color];

    return (
        // 스피너를 컨테이너 내에서 중앙에 배치하기 위한 flexbox 레이아웃
        <div className="flex justify-center items-center">
            {/* 스피너의 실제 원형 요소 */}
            <div
                // `inline-block`: 요소가 내용만큼의 공간만 차지하도록 합니다.
                // `animate-spin`: Tailwind CSS의 사전 정의된 회전 애니메이션을 적용합니다.
                // `rounded-full`: 요소를 완전한 원형으로 만듭니다.
                // `border-4 border-solid`: 4px 두께의 실선 테두리를 설정합니다.
                // `border-r-transparent`: 오른쪽 테두리를 투명하게 하여 회전 시 시각적인 "움직임" 효과를 줍니다.
                // `align-[-0.125em]`: 텍스트 베이스라인에 대한 수직 정렬을 미세 조정합니다.
                // `motion-reduce:animate-[spin_1.5s_linear_infinite]`: 접근성을 위해, `prefers-reduced-motion` 설정 시 애니메이션 속도를 조절합니다.
                // `${spinnerSize}`: `size` prop에 따라 동적으로 계산된 크기 클래스를 적용합니다.
                // `${spinnerColor}`: `color` prop에 따라 동적으로 계산된 색상 클래스를 적용합니다.
                className={`inline-block animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${spinnerSize} ${spinnerColor}`}
                role="status" // 스크린 리더 사용자를 위해 요소의 목적을 '상태'로 정의합니다.
            >
                {/* 스크린 리더만을 위한 텍스트로, 시각적으로는 숨겨져 있습니다. */}
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    Loading...
                </span>
            </div>
        </div>
    );
}

export default LoadingSpinner;