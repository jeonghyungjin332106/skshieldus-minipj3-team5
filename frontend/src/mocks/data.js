// src/mocks/data.js

export const MOCK_CONVERSATIONS = [
  {
    _id: "conv_resume_1",
    title: "백엔드 개발자 이력서 분석",
    createdAt: "2025-07-08T13:30:00Z",
    summary: {
      questions: ["제 이력서의 강점과 약점은 무엇인가요?", "어떤 부분을 보강하면 더 좋을까요?"],
      answerDirections: ["프로젝트 경험이 풍부한 점이 강점입니다.", "사용한 기술 스택에 대한 더 깊은 설명이 필요합니다."]
    },
    chatHistory: [
      { role: "user", content: "백엔드 개발자 직무로 지원하려고 하는데, 제 이력서 분석 좀 해주세요." },
      { role: "assistant", content: "네, 알겠습니다. 이력서를 바탕으로 강점과 약점을 분석해 드릴게요. 잠시만 기다려주세요." }
    ],
    aiSettings: { chunkSize: 1000, chunkOverlap: 200, creativity: 0.5 }
  },
  {
    _id: "conv_interview_1",
    title: "카카오 기술 면접 준비",
    createdAt: "2025-07-08T11:15:00Z",
    summary: {
      questions: ["네트워크 기본 질문을 알려주세요.", "CS 지식 관련 예상 질문 목록입니다."],
      answerDirections: ["OSI 7계층, TCP/IP 모델", "프로세스와 스레드의 차이"]
    },
    chatHistory: [
      { role: "user", content: "카카오 기술 면접을 준비중입니다. 네트워크 관련 예상 질문 알려주세요." },
      { role: "assistant", content: "좋습니다. 첫 번째 질문입니다: OSI 7계층과 TCP/IP 모델의 차이점에 대해 설명해보세요." }
    ],
    aiSettings: { chunkSize: 800, chunkOverlap: 100, creativity: 0.2 }
  },
    {
    _id: "conv_career_1",
    title: "비전공자 데이터 분석가 되기",
    createdAt: "2025-07-07T16:45:00Z",
    summary: {
      questions: ["어떤 스킬부터 공부해야 하나요?", "관련 자격증이 있을까요?"],
      answerDirections: ["SQL과 Python을 가장 먼저 학습하는 것을 추천합니다.", "ADsP, SQLD 자격증이 도움이 될 수 있습니다."]
    },
    chatHistory: [
      { role: "user", content: "비전공자인데 데이터 분석가로 커리어를 시작하고 싶어요. 뭐부터 공부해야 할까요?" },
      { role: "assistant", content: "훌륭한 목표네요! 데이터 분석의 기초는 통계와 프로그래밍입니다. 먼저 SQL과 Python을 학습하시는 것을 추천합니다." }
    ],
    aiSettings: { chunkSize: 500, chunkOverlap: 50, creativity: 0.8 }
  }
];