# AI 모듈 연동 명세서

## 1. 기술 스택

- **AI Framework**: LangChain 0.1.0+
- **API 서버**: LangServe + FastAPI
- **Vector DB**: FAISS
- **LLM**: OpenAI GPT-3.5-turbo
- **Embeddings**: text-embedding-3-small

## 2. 프로젝트 구조

```
ai-module/
├── src/
│   ├── api/           # FastAPI + LangServe 서버
│   │   ├── main.py   # 메인 서버
│   │   └── routes/   # API 라우트
│   ├── chains/        # LangChain 체인
│   │   ├── qa_chain.py
│   │   └── quiz_generator.py
│   ├── graphs/        # LangGraph 워크플로우
│   │   └── rag_graph.py
│   ├── core/          # 핵심 로직
│   │   ├── document_processor.py
│   │   ├── vector_store.py
│   │   └── embeddings_manager.py
│   └── utils/         # 유틸리티
├── data/             # 벡터 스토어 데이터
├── requirements.txt
└── Dockerfile
```

## 3. 환경 설정

```env
# .env
OPENAI_API_KEY=sk-your-openai-api-key
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=smart-learning-ai

DATABASE_URL=mysql://user:password@localhost:3306/smart_learning_db
VECTOR_STORE_PATH=./data/vector_store

# 서버 설정
HOST=0.0.0.0
PORT=8000
```

## 4. 주요 API

### 4.1 채팅 API
- **POST** `/qa/invoke` - 기본 QA 체인
- **POST** `/rag/invoke` - RAG 기반 답변
- **POST** `/chat/stream` - 스트리밍 응답

### 4.2 문서 처리 API
- **POST** `/upload-document` - 문서 업로드 및 벡터화
- **POST** `/process-document` - 기존 문서 재처리

### 4.3 퀴즈 생성 API
- **POST** `/generate-quiz` - 콘텐츠 기반 퀴즈 생성

## 5. RAG 시스템

### 5.1 문서 처리 파이프라인
1. **파일 로드**: PyPDFLoader, TextLoader, Docx2txtLoader
2. **텍스트 분할**: RecursiveCharacterTextSplitter (1000자, 200자 오버랩)
3. **임베딩 생성**: OpenAI text-embedding-3-small (1536 차원)
4. **벡터 저장**: FAISS IndexFlatL2

### 5.2 질의응답 과정
1. **질문 임베딩**: 사용자 질문을 벡터로 변환
2. **유사 문서 검색**: FAISS에서 top-k 유사 문서 검색
3. **컨텍스트 구성**: 검색된 문서들을 컨텍스트로 구성
4. **LLM 응답 생성**: GPT-3.5-turbo로 최종 답변 생성

## 6. 벡터 DB 설정

- **FAISS 인덱스**: IndexFlatL2 (L2 거리 기반 검색)
- **임베딩 모델**: text-embedding-3-small (1536 차원)
- **청크 크기**: 1000자 (한국어 기준)
- **오버랩**: 200자 (문맥 연결성 유지)

## 7. Backend 연동

### 7.1 HTTP 통신
```python
# Spring Boot → AI Module
POST http://ai-service:8000/qa/invoke
{
  "input": {
    "question": "Spring Boot의 특징은?",
    "content_id": 1
  }
}

# AI Module → Spring Boot 응답
{
  "output": {
    "answer": "Spring Boot는...",
    "confidence": 0.85,
    "sources": [...]
  }
}
```

### 7.2 에러 처리
- **타임아웃**: 30초 제한
- **재시도**: 최대 3회
- **Fallback**: "일시적 오류 발생" 메시지

## 8. 지원 파일 형식

| 형식 | 라이브러리 | 최대 크기 |
|------|-----------|----------|
| PDF | PyPDFLoader | 50MB |
| DOCX | Docx2txtLoader | 50MB |
| TXT | TextLoader | 50MB |

## 9. LangServe 체인 구현

### 9.1 QA 체인
```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 도움이 되는 AI 어시스턴트입니다..."),
    ("human", "{question}")
])

qa_chain = qa_prompt | ChatOpenAI() | StrOutputParser()
```

### 9.2 RAG 체인
```python
from langchain.chains import create_retrieval_chain

retriever = vector_store.as_retriever(search_kwargs={"k": 5})
rag_chain = create_retrieval_chain(retriever, qa_chain)
```

## 10. 테스트

### 10.1 단위 테스트
- 문서 처리 기능 테스트
- 벡터 검색 정확도 테스트
- API 엔드포인트 테스트

### 10.2 통합 테스트
- Backend-AI Module 통신 테스트
- 전체 RAG 파이프라인 테스트

## 11. 배포

### 11.1 Docker 설정
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY data/ ./data/

EXPOSE 8000
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 11.2 헬스체크
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vector_store_ready": vector_store is not None,
        "timestamp": datetime.now().isoformat()
    }
```