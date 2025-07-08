// src/pages/ConversationHistoryPage.jsx
import React from 'react';
import ConversationList from '../components/ConversationList';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function ConversationHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center mb-6">
            <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-4 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                최근 대화 목록
            </h1>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-2 sm:p-4">
            <ConversationList />
        </div>
      </div>
    </div>
  );
}

export default ConversationHistoryPage;