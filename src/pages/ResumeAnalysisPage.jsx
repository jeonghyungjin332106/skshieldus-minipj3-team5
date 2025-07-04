// src/pages/ResumeAnalysisPage.jsx
import React from 'react'; // useState 제거
import { useDispatch, useSelector } from 'react-redux'; // useDispatch, useSelector 임포트
import ContentUpload from '../components/ContentUpload';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
// analysisSlice의 액션들 임포트
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';

function ResumeAnalysisPage() {
  const dispatch = useDispatch();
  // --- Redux 스토어에서 분석 상태 가져오기 ---
  const { results: analysisResults, isLoading: isAnalysisLoading, error: analysisError } = useSelector((state) => state.analysis);

  // 이력서 분석 데모 시작 함수 (Redux 액션 디스패치로 변경)
  const startDemoAnalysis = ({ file, text }) => {
    if (isAnalysisLoading) return;

    console.log("분석 요청 수신:", file ? file.name : (text ? "텍스트 입력" : "없음"));
    dispatch(startAnalysis()); // 분석 시작 액션 디스패치

    // 실제로는 여기에 백엔드 API 호출 로직이 들어갑니다.
    setTimeout(() => {
      // 3초 후 가상의 분석 결과 생성
      if (Math.random() > 0.1) { // 90% 성공, 10% 실패 시뮬레이션
        dispatch(analysisSuccess({ // 분석 성공 액션 디스패치
          summary: "이력서에 따르면, 소프트웨어 개발 분야에서 5년 이상의 경력을 보유하고 있으며, 특히 React와 Spring Boot 기반의 웹 애플리케이션 개발에 강점을 보입니다. 문제 해결 능력과 팀 협업 능력이 뛰어납니다." +
                   (file ? ` (파일: ${file.name} 분석)` : (text ? ` (텍스트: "${text.substring(0, 20)}..." 분석)` : "")),
          skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
          recommendations: "백엔드 개발자, 풀스택 개발자, 또는 자바 기반의 엔터프라이즈 솔루션 개발 직무에 적합합니다.",
          recommendedSkills: ["Kubernetes", "AWS Cloud", "Microservices Architecture"]
        }));
      } else {
        dispatch(analysisFailure("이력서 분석 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요.")); // 분석 실패 액션 디스패치
      }
    }, 3000);
  };

  // 분석 결과 초기화 함수 (Redux 액션 디스패치로 변경)
  const handleClearAnalysis = () => { // 함수 이름 변경 (clearAnalysis 액션과 충돌 방지)
    dispatch(clearAnalysis());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          이력서 분석
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 이력서 업로드 및 분석 UI 섹션 (ContentUpload 컴포넌트) */}
          <div className="md:col-span-1">
            <ContentUpload onAnalyze={startDemoAnalysis} isLoading={isAnalysisLoading} />
          </div>

          {/* 이력서 분석 결과 섹션 (AnalysisResultDisplay 컴포넌트) */}
          <div className="md:col-span-2">
            {analysisError && ( // 에러 메시지 표시
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">분석 오류:</strong>
                <span className="block sm:inline ml-2">{analysisError}</span>
              </div>
            )}
            <AnalysisResultDisplay
              analysisResults={analysisResults} // Redux에서 가져온 결과 사용
              isLoading={isAnalysisLoading}     // Redux에서 가져온 로딩 상태 사용
            />
            {/* 결과 초기화 버튼은 AnalysisResultDisplay 옆에 배치 */}
            {(analysisResults || analysisError) && ( // 결과 또는 에러가 있을 때만 초기화 버튼 표시
              <div className="mt-4 text-center">
                <button
                  onClick={handleClearAnalysis} // 변경된 함수 이름 사용
                  className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300"
                >
                  분석 결과 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>이 페이지에서 이력서를 업로드하고 AI 분석 결과를 받아볼 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalysisPage;