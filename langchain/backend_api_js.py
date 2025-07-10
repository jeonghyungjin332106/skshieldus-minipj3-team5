# backend_api.py

# 1. 환경 설정 및 라이브러리 임포트
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import json
import asyncio
import shutil # 파일 저장을 위한 shutil 임포트

# FastAPI 및 관련 모듈 임포트
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # 요청 바디 유효성 검사를 위한 Pydantic BaseModel

# LangChain 패키지
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # MessagesPlaceholder 추가
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredWordDocumentLoader # DOCX 로더 추가

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.output_parsers import JsonOutputParser
from langchain.tools import tool # @tool 데코레이터 사용을 위해 임포트
from langchain.agents import AgentExecutor, create_tool_calling_agent # AgentExecutor 관련 임포트
from langchain_core.messages import HumanMessage, AIMessage # 대화 기록용

# 'unstructured' 라이브러리 설치 안내 (DOCX 지원용)
try:
    from unstructured.partition.auto import partition
except ImportError:
    print("경고: 'unstructured' 라이브러리가 설치되지 않았습니다.")
    print("DOCX 파일 처리를 위해 'pip install unstructured'를 실행해주세요.")
    print("또한, 'unstructured[docx]' 설치가 필요할 수 있습니다.")


# 환경 변수에서 API 키 가져오기
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")

print(f"OPENAI_API_KEY 로드 완료: {OPENAI_API_KEY[:5]}...") # 보안을 위해 앞부분만 출력

# FastAPI 앱 초기화
app = FastAPI(
    title="AI Career Assistant API",
    description="이력서/자소서 분석 및 면접 준비를 돕는 AI 챗봇 API",
    version="1.0.0",
)

# CORS 미들웨어 추가 (모든 도메인 허용 - 개발용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실제 프로덕션에서는 특정 도메인으로 제한 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 측에서 사용자별 벡터 저장소 및 대화 기록을 관리하기 위한 딕셔너리
# 실제 프로덕션 환경에서는 데이터베이스(예: Firestore)를 사용하는 것이 좋습니다.
user_data_store = {} # {user_id: {'vectorstore': ..., 'file_path': ..., 'chat_history': []}}

# 파일 업로드 경로 설정
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.state.UPLOAD_FOLDER = UPLOAD_FOLDER # FastAPI 앱 상태에 저장

# 헬퍼 함수: 문서 로딩 및 벡터 저장소 생성
def _load_document_to_vector_store(file_path: str, chunk_size: int = 1000, chunk_overlap: int = 100):
    """
    문서 파일을 로드하고 텍스트를 분할하여 FAISS 벡터 저장소를 생성합니다.
    지원 형식: PDF, DOCX, TXT
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")

    print(f"문서 파일 로딩 중: {file_path}")

    file_extension = file_path.lower().split('.')[-1]

    if file_extension == "pdf":
        loader = PyPDFLoader(file_path)
    elif file_extension == "txt":
        loader = TextLoader(file_path)
    elif file_extension == "docx":
        try:
            loader = UnstructuredWordDocumentLoader(file_path)
        except ImportError:
            raise ValueError(
                "DOCX 파일 처리를 위해 'unstructured' 라이브러리가 필요합니다. "
                "설치하려면 'pip install unstructured' 및 'pip install unstructured[docx]'를 실행해주세요."
            )
    elif file_extension == "doc": # .doc 파일은 구형 형식으로 직접 지원하지 않음
        raise ValueError(
            "'.doc' 파일은 구형 형식으로 직접 지원되지 않습니다. "
            "파일을 '.docx' 또는 '.pdf'로 변환하여 업로드해주세요."
        )
    else:
        raise ValueError("지원되지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드해주세요.")

    documents = loader.load()

    if not documents:
        raise ValueError("파일에서 텍스트를 추출할 수 없습니다. 파일 내용을 확인해주세요.")

    print(f"총 {len(documents)}개 문서/페이지 로드됨")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    splits = text_splitter.split_documents(documents)
    print(f"총 {len(splits)}개 청크로 분할됨")

    embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY, model="text-embedding-3-small")
    print("FAISS 벡터 저장소 생성 중...")
    vectorstore = FAISS.from_documents(
        documents=splits,
        embedding=embeddings
    )
    print("벡터 저장소 생성 완료!")
    return vectorstore

# --- @tool 데코레이터가 붙은 함수들 (에이전트가 사용할 툴) ---
# 이 함수들은 AgentExecutor가 호출할 수 있도록 @tool 데코레이터를 사용합니다.

@tool
def recommend_job_and_skills_tool(input_json: str) -> str:
    """
    이력서 파일을 기반으로 지원자에게 가장 적합한 직무와 해당 직무에 필요한 핵심 역량을 추천합니다.
    입력은 JSON 문자열이어야 하며, 'file_path'(필수), 'temperature'(선택), 'num_recommendations'(선택) 키를 포함해야 합니다.
    결과는 JSON 문자열 형태로 반환됩니다.
    예시: recommend_job_and_skills_tool('{"file_path": "./uploads/예시 파일 (마케터).pdf", "temperature": 0.6, "num_recommendations": 2}')
    """
    try:
        params = json.loads(input_json)
        file_path = params.get('file_path')
        temperature = params.get('temperature', 0.5)
        num_recommendations = params.get('num_recommendations', 3)

        if not file_path:
            return json.dumps({"error": "file_path가 제공되지 않았습니다."}, ensure_ascii=False)
        if not os.path.exists(file_path):
            return json.dumps({"error": f"파일을 찾을 수 없습니다: {file_path}. 파일을 먼저 업로드해주세요."}, ensure_ascii=False)

        vectorstore = _load_document_to_vector_store(file_path)
        retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

        template = f"""
당신은 커리어 컨설턴트이며, 제공된 이력서 내용을 바탕으로 지원자에게 가장 적합한 직무와 해당 직무에 필요한 핵심 역량을 추천해야 합니다.
응답은 반드시 JSON 형식으로만 반환해야 합니다.

<이력서 내용>
{{context}}
</이력서 내용>

지침:
1.  이력서 내용을 면밀히 분석하여 지원자의 경험, 기술 스택, 강점, 관심사 등을 파악하세요.
2.  지원자의 역량과 경험에 가장 부합하는 {num_recommendations}개의 직무를 추천해주세요.
3.  각 추천 직무에 대해 해당 직무에서 성공하기 위해 필요한 핵심 역량(기술 및 소프트 스킬)을 3~5가지 나열해주세요.
4.  전반적인 커리어 개발을 위한 조언을 1~2문장으로 요약하여 추가해주세요.

응답 JSON 스키마:
{{{{
  "recommended_roles": [
    {{{{
      "role_name": "추천 직무명 1",
      "required_skills": ["필요 역량 1", "필요 역량 2", "필요 역량 3"]
    }}}},
    {{{{
      "role_name": "추천 직무명 2",
      "required_skills": ["필요 역량 A", "필요 역량 B", "필요 역량 C"]
    }}}}
  ],
  "overall_career_advice": "전반적인 커리어 개발 조언 요약"
}}}}

질문: 이 이력서를 가진 지원자에게 어떤 직무와 역량을 추천할까요?

답변:"""
        prompt = ChatPromptTemplate.from_template(template)
        model = ChatOpenAI(model='gpt-3.5-turbo', temperature=float(temperature), api_key=OPENAI_API_KEY)
        parser = JsonOutputParser()
        document_chain = create_stuff_documents_chain(model, prompt)
        rag_chain = create_retrieval_chain(retriever, document_chain)

        response = rag_chain.invoke({'input': "이력서 기반 직무 및 역량 추천을 해주세요."})
        parsed_response = parser.parse(response['answer'])
        return json.dumps(parsed_response, ensure_ascii=False, indent=2)

    except Exception as e:
        return json.dumps({"error": f"직무 및 역량 추천 중 오류 발생: {str(e)}"}, ensure_ascii=False)

@tool
def generate_interview_questions_tool(input_json: str) -> str:
    """
    이력서 파일을 기반으로 특정 회사, 면접 유형, 희망 직무에 맞는 면접 예상 질문 목록을 생성합니다.
    입력은 JSON 문자열이어야 하며, 'file_path'(필수), 'company_name'(선택), 'interview_type'(선택), 'desired_job_role'(선택), 'temperature'(선택) 키를 포함해야 합니다.
    결과는 JSON 문자열 형태로 반환됩니다.
    예시: generate_interview_questions_tool('{"file_path": "./uploads/예시 파일 (마케터).pdf", "company_name": "ABC 마케팅", "interview_type": "general", "desired_job_role": "디지털 마케터"}')
    """
    try:
        params = json.loads(input_json)
        file_path = params.get('file_path')
        company_name = params.get('company_name', "")
        interview_type = params.get('interview_type', "general")
        desired_job_role = params.get('desired_job_role', "")
        temperature = params.get('temperature', 0.7)

        if not file_path:
            return json.dumps({"error": "file_path가 제공되지 않았습니다."}, ensure_ascii=False)
        if not os.path.exists(file_path):
            return json.dumps({"error": f"파일을 찾을 수 없습니다: {file_path}. 파일을 먼저 업로드해주세요."}, ensure_ascii=False)

        vectorstore = _load_document_to_vector_store(file_path)
        retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

        type_instructions = {
            "general": "지원자의 전반적인 경험, 역량, 회사 적합성 등을 평가할 수 있는 종합적인 질문을 생성해주세요.",
            "technical": "지원자의 이력서에 언급된 기술 스택과 프로젝트 경험을 바탕으로 심도 있는 기술 면접 질문을 생성해주세요.",
            "behavioral": "지원자의 행동 양식, 문제 해결 능력, 팀워크, 리더십 등을 평가할 수 있는 인성 및 행동 기반 면접 질문을 생성해주세요."
        }
        instruction = type_instructions.get(interview_type, type_instructions["general"])

        company_instruction = f"면접 볼 회사가 '{company_name}'이라면, 해당 회사의 비전, 제품, 문화와 연관된 질문을 1~2개 포함해주세요." if company_name else ""
        job_role_instruction = ""
        if desired_job_role:
            job_role_instruction = f"지원자가 희망하는 직무는 '{desired_job_role}'입니다. 이 직무에 필요한 역량, 경험, 그리고 직무 관련 시나리오에 대한 질문을 1~2개 포함해주세요."
            if interview_type == "technical":
                job_role_instruction += f" 특히 '{desired_job_role}' 직무의 핵심 기술 스택과 관련된 심층 기술 질문을 포함해주세요."
            elif interview_type == "behavioral":
                job_role_instruction += f" 특히 '{desired_job_role}' 직무에서 발생할 수 있는 상황에 대한 행동 기반 질문을 포함해주세요."

        template = f"""
당신은 면접관이며, 제공된 이력서 내용을 바탕으로 지원자에게 면접 예상 질문을 생성해야 합니다.
다음 지침에 따라 질문을 생성하고, 각 질문에 대한 간략한 답변 가이드라인도 함께 제공해주세요.
응답은 반드시 JSON 형식으로만 반환해야 합니다.

<이력서 내용>
{{context}}
</이력서 내용>

지침:
1.  이력서 내용을 면밀히 분석하여 지원자의 경험, 기술 스택, 강점, 약점 등을 파악하세요.
2.  총 5~7개의 면접 질문을 생성해주세요.
3.  질문 유형: {instruction} {company_instruction} {job_role_instruction}
4.  각 질문에 대해 답변자가 어떤 점을 강조해야 하는지 1~2문장으로 간략한 '가이드라인'을 포함해주세요.
5.  전반적인 답변 가이드라인을 1~2문장으로 요약하여 추가해주세요.

응답 JSON 스키마:
{{{{
  "questions": [
    {{{{
      "question": "질문 내용 1",
      "guidance": "답변 가이드라인 1"
    }}}},
    {{{{
      "question": "질문 내용 2",
      "guidance": "답변 가이드라인 2"
    }}}}
  ],
  "overall_guidance": "전반적인 답변 가이드라인 요약"
}}}}

질문: 이 이력서를 가진 지원자에게 어떤 면접 질문을 할까요?

답변:"""
        prompt = ChatPromptTemplate.from_template(template)
        model = ChatOpenAI(model='gpt-3.5-turbo', temperature=float(temperature), api_key=OPENAI_API_KEY)
        parser = JsonOutputParser()
        document_chain = create_stuff_documents_chain(model, prompt)
        rag_chain = create_retrieval_chain(retriever, document_chain)

        response = rag_chain.invoke({'input': "면접 질문을 생성해주세요."})
        parsed_response = parser.parse(response['answer'])
        return json.dumps(parsed_response, ensure_ascii=False, indent=2)

    except Exception as e:
        return json.dumps({"error": f"면접 질문 생성 중 오류 발생: {str(e)}"}, ensure_ascii=False)

@tool
def get_interview_feedback_and_improved_answer_tool(input_json: str) -> str:
    """
    주어진 면접 질문과 사용자 답변에 대해 AI 피드백을 제공하고, 해당 피드백을 반영한 개선된 답변을 생성합니다.
    입력은 JSON 문자열이어야 하며, 'file_path'(필수), 'original_question'(필수), 'user_answer'(필수), 'company_name'(선택), 'job_role'(선택), 'temperature'(선택) 키를 포함해야 합니다.
    결과는 JSON 문자열 형태로 반환됩니다.
    예시: get_interview_feedback_and_improved_answer_tool('{"file_path": "./uploads/예시 파일 (마케터).pdf", "original_question": "자기소개 부탁드립니다.", "user_answer": "안녕하세요. 저는...", "company_name": "ABC 마케팅", "job_role": "디지털 마케터"}')
    """
    try:
        params = json.loads(input_json)
        file_path = params.get('file_path')
        original_question = params.get('original_question')
        user_answer = params.get('user_answer')
        company_name = params.get('company_name', "")
        job_role = params.get('job_role', "")
        temperature = params.get('temperature', 0.5)

        if not all([file_path, original_question, user_answer]):
            return json.dumps({"error": "file_path, original_question, user_answer는 필수입니다."}, ensure_ascii=False)
        if not os.path.exists(file_path):
            return json.dumps({"error": f"파일을 찾을 수 없습니다: {file_path}. 파일을 먼저 업로드해주세요."}, ensure_ascii=False)

        vectorstore = _load_document_to_vector_store(file_path)
        retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

        # 피드백 프롬프트
        feedback_context_info = ""
        if company_name and job_role:
            feedback_context_info = f"지원하는 회사는 '{company_name}'이고, 직무는 '{job_role}'입니다. 이 맥락에서 답변을 평가해주세요."
        elif company_name:
            feedback_context_info = f"지원하는 회사는 '{company_name}'입니다. 이 맥락에서 답변을 평가해주세요."
        elif job_role:
            feedback_context_info = f"지원하는 직무는 '{job_role}'입니다. 이 맥락에서 답변을 평가해주세요."

        feedback_template = f"""
당신은 면접관이자 커리어 코치입니다. 다음 질문과 지원자의 답변을 평가하고, 건설적인 피드백을 JSON 형식으로 제공해주세요.
평가 시 지원자의 이력서 내용도 참고하여 답변의 적합성과 깊이를 판단해주세요.

<이력서/자소서 내용>
{{context}}
</이력서/자소서 내용>

<원래 질문>
{original_question}
</원래 질문>

<지원자 답변>
{user_answer}
</지원자 답변>

지침:
1.  **overall_assessment**: 답변에 대한 전반적인 평가를 1-2문장으로 요약하세요.
2.  **strengths**: 답변의 주요 강점 2-3가지를 목록으로 제시하세요.
3.  **areas_for_improvement**: 답변에서 개선이 필요한 부분 2-3가지를 목록으로 제시하세요.
4.  **actionable_suggestions**: 각 개선점에 대해 구체적이고 실용적인 개선 제안 2-3가지를 목록으로 제시하세요.
5.  **score_out_of_5**: 답변에 대한 5점 만점 점수를 소수점 첫째 자리까지 매겨주세요. (예: 3.5)
6.  **next_steps_advice**: 향후 유사한 질문에 답변할 때 도움이 될 만한 전반적인 방향성 조언을 1~2문장으로 제공해주세요.
7.  {feedback_context_info}

응답 JSON 스키마:
{{{{
  "overall_assessment": "전반적인 답변에 대한 평가 요약",
  "strengths": [
    "강점 1",
    "강점 2"
  ],
  "areas_for_improvement": [
    "개선 필요 부분 1",
    "개선 필요 부분 2"
  ],
  "actionable_suggestions": [
    "구체적 제안 1",
    "구체적 제안 2"
  ],
  "score_out_of_5": 3.5,
  "next_steps_advice": "향후 답변 방향성 조언"
}}}}

질문: 이 답변에 대한 피드백을 제공해주세요.

답변:"""
        feedback_prompt = ChatPromptTemplate.from_template(feedback_template)
        model = ChatOpenAI(model='gpt-3.5-turbo', temperature=float(temperature), api_key=OPENAI_API_KEY)
        parser = JsonOutputParser()
        feedback_document_chain = create_stuff_documents_chain(model, feedback_prompt)
        feedback_rag_chain = create_retrieval_chain(retriever, feedback_document_chain)

        feedback_response = feedback_rag_chain.invoke({'input': "사용자 답변에 대한 피드백을 생성해주세요."})
        feedback_results = parser.parse(feedback_response['answer'])

        # 개선된 답변 생성 프롬프트
        actionable_suggestions = "\n".join([f"- {s}" for s in feedback_results.get('actionable_suggestions', [])])
        if not actionable_suggestions:
            actionable_suggestions = "제공된 피드백에 구체적인 개선 제안이 없습니다. 답변의 명확성, 간결성, 질문과의 연관성에 중점을 두어 개선해주세요."

        improved_context_info = ""
        if company_name and job_role:
            improved_context_info = f"지원하는 회사는 '{company_name}'이고, 직무는 '{job_role}'입니다. 이 맥락에서 답변을 개선해주세요."
        elif company_name:
            improved_context_info = f"지원하는 회사는 '{company_name}'입니다. 이 맥락에서 답변을 개선해주세요."
        elif job_role:
            improved_context_info = f"지원하는 직무는 '{job_role}'입니다. 이 맥락에서 답변을 개선해주세요."

        improved_answer_template = f"""
당신은 면접 답변 개선 전문가입니다. 다음 면접 질문, 지원자의 초기 답변, 그리고 해당 답변에 대한 AI 피드백을 참고하여,
가장 효과적이고 설득력 있는 답변으로 개선해주세요.

<이력서/자소서 내용>
{{context}}
</이력서/자소서 내용>

<원래 질문>
{original_question}
</원래 질문>

<지원자 답변>
{user_answer}
</지원자 답변>

<AI 피드백 (개선 제안 포함)>
{actionable_suggestions}
</AI 피드백 (개선 제안 포함)>

지침:
1.  AI 피드백의 '구체적인 개선 제안'을 최우선적으로 반영하여 답변을 수정하세요.
2.  원래 질문에 직접적으로 답변하고, 이력서 내용과 연관된 경험이나 역량을 효과적으로 강조하세요.
3.  답변은 명확하고 간결하며, 설득력 있게 작성되어야 합니다.
4.  불필요한 내용은 제거하고, 핵심 메시지를 전달하는 데 집중하세요.
5.  {improved_context_info}
6.  개선된 답변만 직접적으로 제공해주세요. 추가적인 설명이나 서론은 필요 없습니다.

개선된 답변:"""
        improved_answer_prompt = ChatPromptTemplate.from_template(improved_answer_template)
        improved_answer_document_chain = create_stuff_documents_chain(model, improved_answer_prompt)
        improved_answer_rag_chain = create_retrieval_chain(retriever, improved_answer_document_chain)

        improved_answer_response = improved_answer_rag_chain.invoke({'input': "개선된 면접 답변을 작성해주세요."})
        improved_answer_text = improved_answer_response['answer']

        # 피드백 결과와 개선된 답변을 하나의 JSON으로 묶어 반환
        full_result = {
            "feedback": feedback_results,
            "improved_answer": improved_answer_text
        }
        return json.dumps(full_result, ensure_ascii=False, indent=2)

    except Exception as e:
        return json.dumps({"error": f"면접 답변 피드백 및 개선된 답변 생성 중 오류 발생: {str(e)}"}, ensure_ascii=False)

# --- 에이전트 설정 및 초기화 ---
# 이 함수는 요청마다 AgentExecutor를 새로 생성하여 상태를 관리합니다.
def get_agent_executor(user_id: str, temperature: float = 0.0):
    """
    사용자 ID를 기반으로 AgentExecutor를 생성 또는 업데이트합니다.
    """
    # 사용자 데이터 스토어에서 해당 user_id의 데이터 가져오기
    user_data = user_data_store.get(user_id, {})
    
    # 현재 사용 중인 파일 경로
    effective_file_path = user_data.get('file_path', '없음') 

    # 에이전트가 사용할 툴 목록
    tools = [recommend_job_and_skills_tool, generate_interview_questions_tool, get_interview_feedback_and_improved_answer_tool]
    
    # 에이전트의 판단을 위한 LLM (낮은 temperature로 설정하여 일관성 유지)
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=temperature, api_key=OPENAI_API_KEY)

    # 프롬프트를 안전하게 구성 - JSON 예시 제거
    system_message = """
당신은 이력서/자소서 분석 및 면접 준비를 돕는 유능한 AI 어시스턴트입니다.
사용자의 요청에 따라 다음 툴들을 사용하여 작업을 수행할 수 있습니다.

현재 업로드된 파일: """ + effective_file_path + """

사용 가능한 기능:
1. 직무 및 역량 추천: 이력서를 분석하여 적합한 직무와 필요 역량을 추천합니다.
2. 면접 질문 생성: 회사, 직무, 면접 유형에 맞는 예상 질문을 생성합니다.
3. 면접 답변 피드백: 사용자의 답변을 분석하고 개선된 답변을 제안합니다.

중요 사항:
- 모든 기능은 현재 업로드된 파일을 자동으로 사용합니다.
- 사용자의 요청을 이해하고 적절한 툴을 선택하여 실행하세요.
- 결과를 친절하고 이해하기 쉽게 설명해주세요.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return agent_executor

# --- FastAPI 요청 모델 정의 ---
# 이제 ChatRequest만 사용합니다.
class ChatRequest(BaseModel):
    userId: str
    userMessage: str
    temperature: float = 0.0 # LLM의 창의성 수준 (에이전트 판단에 영향)

# --- FastAPI 엔드포인트 ---

@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    userId: str = Form("anonymous_user"),
    chunkSize: int = Form(1000),
    chunkOverlap: int = Form(200)
):
    """
    이력서 파일을 업로드하고 처리합니다.
    지원 형식: PDF, DOCX, TXT
    """
    if file.filename == '':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="파일 이름을 선택해주세요.")

    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ["pdf", "txt", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드해주세요."
        )
    if file_extension == "doc": # .doc 파일은 구형 형식으로 직접 지원하지 않음
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'.doc' 파일은 구형 형식으로 직접 지원되지 않습니다. 파일을 '.docx' 또는 '.pdf'로 변환하여 업로드해주세요."
        )

    file_path = os.path.join(app.state.UPLOAD_FOLDER, file.filename)
    
    # 파일 저장
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"파일 '{file.filename}' 저장 완료: {file_path}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"파일 저장 중 오류 발생: {str(e)}")

    try:
        vectorstore = _load_document_to_vector_store(file_path, chunkSize, chunkOverlap)
        # 사용자 데이터 스토어에 벡터 저장소와 파일 경로 저장
        if userId not in user_data_store:
            user_data_store[userId] = {'chat_history': []}
        user_data_store[userId]['vectorstore'] = vectorstore
        user_data_store[userId]['file_path'] = file_path
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": f"이력서 '{file.filename}'가 성공적으로 업로드 및 처리되었습니다.", "file_path": file_path}
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"파일 처리 중 오류 발생: {str(e)}")


@app.post("/api/chat/ask")
async def chat_with_ai(request_data: ChatRequest):
    """
    AI 챗봇과 대화하고 이력서 기반 답변을 받습니다.
    사용자 질문에 따라 적절한 툴을 사용하여 응답합니다.
    """
    user_id = request_data.userId
    user_message = request_data.userMessage
    temperature = request_data.temperature

    if not user_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="질문을 입력해주세요.")

    # 사용자 데이터 스토어에서 데이터 가져오기
    user_data = user_data_store.get(user_id)
    if not user_data or 'file_path' not in user_data:
        # 파일 경로가 없으면 업로드 요청
        return JSONResponse(
            status_code=status.HTTP_200_OK, # 200 OK로 반환하여 프론트엔드에서 메시지 처리
            content={"aiResponse": "어떤 파일로 작업을 진행할까요? 파일 경로를 먼저 알려주세요. (예: ./uploads/예시 파일 (마케터).pdf)"}
        )
    
    file_path = user_data['file_path']
    chat_history = user_data.get('chat_history', [])

    # LangChain AgentExecutor 생성
    # get_agent_executor 함수에 file_path와 temperature를 전달합니다.
    agent_executor = get_agent_executor(user_id, temperature)

    try:
        # AgentExecutor 실행 - await 제거!
        # AgentExecutor는 chat_history를 사용하여 대화 맥락을 유지합니다.
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history,
        })

        ai_response_text = result.get('output', '죄송합니다. 답변을 생성하는 데 실패했습니다.')
        
        # 대화 기록 업데이트 (서버 메모리에서 관리)
        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=ai_response_text))
        user_data_store[user_id]['chat_history'] = chat_history

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"aiResponse": ai_response_text}
        )

    except Exception as e:
        print(f"챗봇 처리 중 오류 발생: {e}")
        # 오류 발생 시에도 대화 기록에 추가하여 사용자에게 알립니다.
        error_message = f"요청 처리 중 오류가 발생했습니다: {str(e)}. 다시 시도해주세요."
        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=error_message))
        user_data_store[user_id]['chat_history'] = chat_history # 오류 메시지도 기록에 남김
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_message)


# FastAPI 애플리케이션을 실행하려면 터미널에서 다음 명령어를 실행하세요:
# uvicorn backend_api:app --reload --host 0.0.0.0 --port 5000
# --reload: 코드 변경 시 자동 재시작 (개발용)
# --host 0.0.0.0: 모든 네트워크 인터페이스에서 접근 허용
# --port 5000: 5000번 포트 사용