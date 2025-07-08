// src/pages/ConversationHistoryPage.jsx
import React from 'react';
import ConversationList from '../components/ConversationList';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * 사용자 대화 기록을 표시하는 페이지 컴포넌트입니다.
 * ConversationList 컴포넌트를 렌더링하고 대시보드로 돌아가는 링크를 제공합니다.
 */
function ConversationHistoryPage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="flex items-center mb-6">
                    {/* 대시보드로 돌아가는 링크 */}
                    <Link
                        to="/dashboard"
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-4 transition-colors"
                        aria-label="대시보드로 돌아가기"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    {/* 페이지 제목 */}
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        최근 대화 목록
                    </h1>
                </div>

                {/* 대화 목록을 담는 컨테이너 */}
                <div
                    className="bg-white rounded-2xl shadow-lg border border-gray-200
                               dark:bg-gray-800 dark:border-gray-700 p-2 sm:p-4"
                >
                    <ConversationList />
                </div>
            </div>
        </div>
    );
}

export default ConversationHistoryPage;