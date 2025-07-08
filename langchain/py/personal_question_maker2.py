
import os
import json
import logging
from typing import Dict, List, Optional, Any, Annotated, TypedDict
from dataclasses import dataclass, asdict
import gradio as gr
from datetime import datetime
from pathlib import Path

# LangGraph & LangChain imports
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import operator

# 기존 imports
import pdfplumber
import docx
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============ 상태 정의 ============
class InterviewGeneratorState(TypedDict):
    """LangGraph 상태 관리"""
    messages: Annotated[List[BaseMessage], operator.add]
    company_name: str
    position: str
    interview_type: str
    difficulty_level: str
    question_count: int
    user_profile: Dict[str, Any]
    resume_content: str
    generated_questions: str
    generated_files: List[str]
    current_step: str
    is_complete: bool
    error_message: str


# ============ Pydantic 모델 ============
class CompanyInfo(BaseModel):
    """회사 정보"""
    company_name: str = Field(description="지원할 회사명")
    position: str = Field(description="지원 직무/포지션")

class InterviewSettings(BaseModel):
    """면접 설정"""
    interview_type: str = Field(description="면접 유형 (기술면접/인성면접/임원면접/종합면접)")
    difficulty_level: str = Field(description="난이도 (초급/중급/고급)")
    question_count: int = Field(description="질문 개수", ge=5, le=30)


# ============ 도구 정의 ============
@tool
def collect_company_info(company_name: str, position: str) -> Dict[str, str]:
    """회사명과 지원 직무 정보를 수집합니다."""
    logger.info(f"회사 정보 수집: {company_name}, {position}")
    return {
        "company_name": company_name,
        "position": position,
        "status": "success"
    }

@tool
def determine_job_type(position: str) -> Dict[str, str]:
    """직무 유형을 분석하여 적합한 면접 유형을 추천합니다."""
    logger.info(f"직무 유형 분석: {position}")
    
    position_lower = position.lower()
    
    # 직무별 면접 유형 매핑
    job_mapping = {
        "개발직": ["개발", "프론트", "백엔드", "풀스택", "developer", "frontend", "backend", "엔지니어"],
        "기획직": ["기획", "pm", "planning", "product", "manager", "전략"],
        "마케팅직": ["마케팅", "marketing", "브랜드", "brand", "광고", "홍보"],
        "디자인직": ["디자인", "design", "ui", "ux", "designer", "시각"],
        "데이터직": ["데이터", "data", "analyst", "scientist", "ai", "ml", "분석"],
        "영업직": ["영업", "sales", "세일즈", "고객", "비즈니스"],
        "인사직": ["인사", "hr", "채용", "교육", "조직"],
        "재무직": ["재무", "회계", "finance", "경리", "투자"]
    }
    
    detected_type = "일반직"
    for job_type, keywords in job_mapping.items():
        if any(keyword in position_lower for keyword in keywords):
            detected_type = job_type
            break
    
    # 직무별 추천 면접 유형
    interview_recommendations = {
        "개발직": {
            "primary": "기술면접",
            "secondary": "종합면접",
            "description": "기술 역량과 문제 해결 능력 중심"
        },
        "기획직": {
            "primary": "종합면접", 
            "secondary": "인성면접",
            "description": "논리적 사고와 커뮤니케이션 중심"
        },
        "마케팅직": {
            "primary": "인성면접",
            "secondary": "종합면접", 
            "description": "창의성과 시장 이해도 중심"
        },
        "디자인직": {
            "primary": "기술면접",
            "secondary": "종합면접",
            "description": "포트폴리오와 창작 과정 중심"
        },
        "데이터직": {
            "primary": "기술면접",
            "secondary": "종합면접",
            "description": "분석 능력과 통계 지식 중심"
        },
        "영업직": {
            "primary": "인성면접",
            "secondary": "종합면접",
            "description": "설득력과 고객 지향성 중심"
        },
        "인사직": {
            "primary": "인성면접",
            "secondary": "종합면접",
            "description": "소통 능력과 조직 이해도 중심"
        },
        "재무직": {
            "primary": "기술면접",
            "secondary": "종합면접",
            "description": "전문 지식과 분석 능력 중심"
        },
        "일반직": {
            "primary": "종합면접",
            "secondary": "인성면접",
            "description": "전반적인 역량과 조직 적합성 중심"
        }
    }
    
    recommendation = interview_recommendations.get(detected_type, interview_recommendations["일반직"])
    
    return {
        "job_type": detected_type,
        "primary_interview": recommendation["primary"],
        "secondary_interview": recommendation["secondary"],
        "description": recommendation["description"],
        "status": "success"
    }

@tool  
def analyze_resume_content(resume_content: str) -> Dict[str, str]:
    """이력서 내용을 분석하여 주요 정보를 추출합니다."""
    logger.info("이력서 분석 시작")
    
    # 실제 LLM 분석 (간소화된 버전)
    api_key = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0.1)
    
    analysis_prompt = f"""
다음 이력서 내용을 분석하여 JSON 형식으로 정보를 추출해주세요:

{resume_content[:2000]}

다음 형식으로만 응답해주세요:
{{
    "career_level": "신입/경력",
    "education": "최종 학력",
    "major": "전공",
    "tech_stack": "기술 스택",
    "summary": "간단한 요약"
}}
"""
    
    try:
        response = llm.invoke([HumanMessage(content=analysis_prompt)])
        # JSON 파싱 시도
        result_text = response.content.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
        
        analysis = json.loads(result_text)
        analysis["status"] = "success"
        return analysis
    except Exception as e:
        logger.error(f"이력서 분석 오류: {str(e)}")
        return {
            "career_level": extract_career_level(resume_content),
            "education": "대학교 졸업",
            "major": "관련 전공",
            "tech_stack": extract_tech_keywords(resume_content),
            "summary": resume_content[:200] + "...",
            "status": "basic_analysis"
        }

@tool
def set_interview_preferences(interview_type: str, difficulty_level: str, question_count: int) -> Dict[str, Any]:
    """면접 설정을 저장합니다."""
    logger.info(f"면접 설정: {interview_type}, {difficulty_level}, {question_count}")
    
    # 입력값 정규화
    interview_type_mapping = {
        "기술": "기술면접", "기술면접": "기술면접", "tech": "기술면접", "technical": "기술면접",
        "인성": "인성면접", "인성면접": "인성면접", "personality": "인성면접", "문화": "인성면접",
        "임원": "임원면접", "임원면접": "임원면접", "executive": "임원면접", "경영진": "임원면접",
        "종합": "종합면접", "종합면접": "종합면접", "comprehensive": "종합면접", "전체": "종합면접", "일반": "종합면접"
    }
    
    difficulty_mapping = {
        "초급": "초급", "쉬운": "초급", "easy": "초급", "beginner": "초급", "입문": "초급", "기초": "초급",
        "중급": "중급", "보통": "중급", "medium": "중급", "intermediate": "중급", "일반": "중급",
        "고급": "고급", "어려운": "고급", "hard": "고급", "advanced": "고급", "높은": "고급", "어려": "고급"
    }
    
    # 정규화된 값 추출
    normalized_interview_type = interview_type_mapping.get(interview_type.lower(), "종합면접")
    normalized_difficulty = difficulty_mapping.get(difficulty_level.lower(), "중급")
    
    # 질문 개수 검증 및 조정
    if question_count < 5:
        question_count = 5
    elif question_count > 30:
        question_count = 30
    
    # 면접 유형별 추천 질문 개수
    recommended_counts = {
        "기술면접": {"초급": 12, "중급": 15, "고급": 18},
        "인성면접": {"초급": 10, "중급": 12, "고급": 15},
        "임원면접": {"초급": 8, "중급": 10, "고급": 12},
        "종합면접": {"초급": 15, "중급": 18, "고급": 22}
    }
    
    recommended_count = recommended_counts.get(normalized_interview_type, {}).get(normalized_difficulty, 15)
    
    return {
        "interview_type": normalized_interview_type,
        "difficulty_level": normalized_difficulty,
        "question_count": question_count,
        "recommended_count": recommended_count,
        "status": "success"
    }

@tool
def suggest_interview_settings(job_type: str, career_level: str = "", company_size: str = "") -> Dict[str, Any]:
    """직무와 경력에 따라 최적의 면접 설정을 추천합니다."""
    logger.info(f"면접 설정 추천: {job_type}, {career_level}, {company_size}")
    
    # 경력별 난이도 매핑
    career_difficulty_mapping = {
        "신입": "초급",
        "1년차": "초급", "2년차": "초급",
        "3년차": "중급", "4년차": "중급", "5년차": "중급",
        "6년차": "고급", "7년차": "고급", "8년차": "고급", "9년차": "고급", "10년차": "고급",
        "시니어": "고급", "리드": "고급", "매니저": "고급", "팀장": "고급"
    }
    
    # 기본 추천 설정
    suggestions = {
        "개발직": {
            "신입": {"type": "기술면접", "difficulty": "초급", "count": 12},
            "경력": {"type": "기술면접", "difficulty": "중급", "count": 15},
            "시니어": {"type": "종합면접", "difficulty": "고급", "count": 18}
        },
        "기획직": {
            "신입": {"type": "인성면접", "difficulty": "초급", "count": 10},
            "경력": {"type": "종합면접", "difficulty": "중급", "count": 15},
            "시니어": {"type": "임원면접", "difficulty": "고급", "count": 12}
        },
        "마케팅직": {
            "신입": {"type": "인성면접", "difficulty": "초급", "count": 10},
            "경력": {"type": "종합면접", "difficulty": "중급", "count": 15},
            "시니어": {"type": "임원면접", "difficulty": "고급", "count": 12}
        },
        "디자인직": {
            "신입": {"type": "기술면접", "difficulty": "초급", "count": 10},
            "경력": {"type": "기술면접", "difficulty": "중급", "count": 12},
            "시니어": {"type": "종합면접", "difficulty": "고급", "count": 15}
        }
    }
    
    # 경력 수준 결정
    if any(keyword in career_level.lower() for keyword in ["신입", "new", "junior", "졸업예정"]):
        career_category = "신입"
    elif any(keyword in career_level.lower() for keyword in ["시니어", "senior", "리드", "lead", "팀장", "매니저"]):
        career_category = "시니어"
    else:
        career_category = "경력"
    
    # 추천 설정 가져오기
    job_suggestions = suggestions.get(job_type, suggestions.get("개발직"))
    recommended = job_suggestions.get(career_category, job_suggestions["경력"])
    
    # 회사 규모에 따른 조정
    if "대기업" in company_size or "글로벌" in company_size:
        recommended["difficulty"] = "고급" if recommended["difficulty"] != "고급" else "고급"
        recommended["count"] += 3
    elif "스타트업" in company_size or "중소기업" in company_size:
        if recommended["type"] == "임원면접":
            recommended["type"] = "종합면접"
    
    return {
        "recommended_interview_type": recommended["type"],
        "recommended_difficulty": recommended["difficulty"],
        "recommended_count": min(recommended["count"], 30),
        "career_category": career_category,
        "reasoning": f"{job_type} {career_category}에게 최적화된 설정입니다.",
        "status": "success"
    }

@tool
def generate_interview_questions(
    company_name: str,
    position: str,
    interview_type: str,
    difficulty_level: str,
    question_count: int,
    user_profile_json: str
) -> Dict[str, str]:
    """개인 맞춤형 면접 질문을 생성합니다."""
    logger.info("면접 질문 생성 시작")
    
    try:
        user_profile = json.loads(user_profile_json) if user_profile_json else {}
    except:
        user_profile = {}
    
    api_key = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0.7)
    
    prompt = f"""
당신은 전문 면접관입니다. 다음 정보를 바탕으로 개인화된 {interview_type} 질문을 생성해주세요.

[지원자 정보]
- 회사: {company_name}
- 직무: {position}
- 경력: {user_profile.get('career_level', '정보 없음')}
- 학력: {user_profile.get('education', '정보 없음')}
- 전공: {user_profile.get('major', '정보 없음')}
- 기술스택: {user_profile.get('tech_stack', '정보 없음')}
- 면접유형: {interview_type}
- 난이도: {difficulty_level}
- 질문개수: {question_count}개

조건:
1. 개인화된 질문 (지원자의 배경 활용)
2. {position} 직무에 특화
3. {difficulty_level} 수준의 난이도
4. 실용적이고 현실적인 질문

각 질문마다 다음 형식으로 작성:

### 질문 [번호]: [질문 내용]
**질문 의도**: [평가 목적]
**답변 가이드**: [답변 방향]
**예상 시간**: [소요 시간]

---

총 {question_count}개의 질문을 생성해주세요.
"""
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        questions = response.content
        
        return {
            "questions": questions,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"질문 생성 오류: {str(e)}")
        return {
            "questions": f"질문 생성 중 오류가 발생했습니다: {str(e)}",
            "status": "error"
        }

@tool
def save_questions_to_file(questions: str, company_name: str, position: str) -> Dict[str, str]:
    """생성된 질문을 파일로 저장합니다."""
    logger.info("파일 저장 시작")
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"면접질문_{company_name}_{position}_{timestamp}.txt"
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._- ").strip()
        
        temp_dir = Path("temp_downloads")
        temp_dir.mkdir(exist_ok=True)
        
        file_path = temp_dir / safe_filename
        
        content = f"""
# {company_name} - {position} 면접 질문

생성 시간: {datetime.now().strftime("%Y년 %m월 %d일 %H시 %M분")}

{questions}

---
본 질문은 AI가 생성한 것으로, 실제 면접과 다를 수 있습니다.
"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {
            "file_path": str(file_path),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"파일 저장 오류: {str(e)}")
        return {
            "file_path": "",
            "status": "error",
            "error": str(e)
        }


# ============ 유틸리티 함수 ============
def extract_career_level(text: str) -> str:
    """경력 수준 추출"""
    text_lower = text.lower()
    if any(word in text_lower for word in ["신입", "new", "junior", "졸업"]):
        return "신입"
    elif any(word in text_lower for word in ["년", "year", "경력", "experience"]):
        return "경력"
    return "신입"

def extract_tech_keywords(text: str) -> str:
    """기술 키워드 추출"""
    tech_keywords = [
        "Python", "Java", "JavaScript", "React", "Vue", "Angular",
        "Spring", "Django", "Flask", "Node.js", "AWS", "Docker",
        "Kubernetes", "Git", "SQL", "MongoDB", "Redis", "TypeScript"
    ]
    
    found_techs = [tech for tech in tech_keywords if tech.lower() in text.lower()]
    return ", ".join(found_techs) if found_techs else "기본 기술 스택"

def process_uploaded_file(file_path: str) -> str:
    """파일 처리"""
    try:
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext == '.pdf':
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text
                
        elif ext == '.docx':
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
            return text
            
        elif ext == '.txt':
            encodings = ['utf-8', 'cp949', 'euc-kr']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        return f.read()
                except UnicodeDecodeError:
                    continue
            raise ValueError("인코딩을 인식할 수 없습니다")
            
        else:
            raise ValueError(f"지원되지 않는 파일 형식: {ext}")
            
    except Exception as e:
        raise Exception(f"파일 처리 오류: {str(e)}")


# ============ LangGraph 노드 정의 ============
def chatbot_node(state: InterviewGeneratorState) -> InterviewGeneratorState:
    """메인 챗봇 노드 - 도구 바인딩된 LLM"""
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    tools = [
        collect_company_info,
        determine_job_type,
        analyze_resume_content,
        suggest_interview_settings,
        set_interview_preferences,
        generate_interview_questions,
        save_questions_to_file
    ]
    
    llm_with_tools = ChatOpenAI(
        api_key=api_key,
        model="gpt-4o-mini",
        temperature=0.3
    ).bind_tools(tools)
    
    system_message = """
당신은 친근하고 전문적인 면접 준비 도우미입니다.
사용자와 자연스러운 대화를 통해 면접 질문을 생성해주세요.

수집할 정보:
1. 회사명과 지원 직무 (collect_company_info 사용)
2. 이력서/경력 정보 (analyze_resume_content 사용)
3. 면접 설정 (set_interview_preferences 사용)
4. 질문 생성 (generate_interview_questions 사용)
5. 파일 저장 (save_questions_to_file 사용)

사용자가 이해하기 쉽게 단계별로 안내하고, 적절한 도구를 사용해주세요.
한국어로 친근하게 대화해주세요.
"""
    
    messages = [SystemMessage(content=system_message)] + state["messages"]
    
    try:
        response = llm_with_tools.invoke(messages)
        return {
            **state,
            "messages": [response],
        }
    except Exception as e:
        logger.error(f"챗봇 노드 오류: {str(e)}")
        error_response = AIMessage(content=f"죄송합니다. 오류가 발생했습니다: {str(e)}")
        return {
            **state,
            "messages": [error_response],
            "error_message": str(e)
        }

def tools_node(state: InterviewGeneratorState) -> InterviewGeneratorState:
    """도구 실행 노드"""
    
    last_message = state["messages"][-1]
    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        return state
    
    tools = [
        collect_company_info,
        determine_job_type,
        analyze_resume_content,
        suggest_interview_settings,
        set_interview_preferences,
        generate_interview_questions,
        save_questions_to_file
    ]
    
    tool_node = ToolNode(tools)
    tool_messages = tool_node.invoke({"messages": [last_message]})
    
    # 도구 실행 결과를 상태에 반영
    updated_state = state.copy()
    
    for message in tool_messages["messages"]:
        if hasattr(message, 'name') and hasattr(message, 'content'):
            tool_name = message.name
            try:
                content = json.loads(message.content) if message.content.startswith('{') else {"result": message.content}
            except:
                content = {"result": message.content}
            
            # 도구별 상태 업데이트
            if tool_name == "collect_company_info" and content.get("status") == "success":
                updated_state["company_name"] = content.get("company_name", "")
                updated_state["position"] = content.get("position", "")
                
            elif tool_name == "determine_job_type" and content.get("status") == "success":
                if "user_profile" not in updated_state:
                    updated_state["user_profile"] = {}
                updated_state["user_profile"]["job_type"] = content.get("job_type", "")
                updated_state["user_profile"]["primary_interview"] = content.get("primary_interview", "")
                updated_state["user_profile"]["secondary_interview"] = content.get("secondary_interview", "")
                updated_state["user_profile"]["job_description"] = content.get("description", "")
                
            elif tool_name == "analyze_resume_content" and content.get("status") in ["success", "basic_analysis"]:
                if "user_profile" not in updated_state:
                    updated_state["user_profile"] = {}
                updated_state["user_profile"]["career_level"] = content.get("career_level", "")
                updated_state["user_profile"]["education"] = content.get("education", "")
                updated_state["user_profile"]["major"] = content.get("major", "")
                updated_state["user_profile"]["tech_stack"] = content.get("tech_stack", "")
                updated_state["user_profile"]["summary"] = content.get("summary", "")
                
            elif tool_name == "suggest_interview_settings" and content.get("status") == "success":
                if "user_profile" not in updated_state:
                    updated_state["user_profile"] = {}
                updated_state["user_profile"]["recommended_interview_type"] = content.get("recommended_interview_type", "")
                updated_state["user_profile"]["recommended_difficulty"] = content.get("recommended_difficulty", "")
                updated_state["user_profile"]["recommended_count"] = content.get("recommended_count", 15)
                updated_state["user_profile"]["career_category"] = content.get("career_category", "")
                updated_state["user_profile"]["reasoning"] = content.get("reasoning", "")
                
            elif tool_name == "set_interview_preferences" and content.get("status") == "success":
                updated_state["interview_type"] = content.get("interview_type", "")
                updated_state["difficulty_level"] = content.get("difficulty_level", "")
                updated_state["question_count"] = content.get("question_count", 15)
                
            elif tool_name == "generate_interview_questions":
                if content.get("status") == "success":
                    updated_state["generated_questions"] = content.get("questions", "")
                    updated_state["is_complete"] = True
                else:
                    updated_state["error_message"] = content.get("questions", "")
                    
            elif tool_name == "save_questions_to_file" and content.get("status") == "success":
                file_path = content.get("file_path", "")
                if file_path:
                    updated_state["generated_files"] = updated_state.get("generated_files", []) + [file_path]
    
    updated_state["messages"] = tool_messages["messages"]
    return updated_state

def should_continue(state: InterviewGeneratorState) -> str:
    """다음 노드 결정"""
    
    # 메시지가 없으면 종료
    if not state.get("messages"):
        return END
    
    last_message = state["messages"][-1]
    
    # 도구 호출이 있으면 도구 노드로
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"
    
    # 이미 완료되었으면 종료
    if state.get("is_complete", False):
        return END
    
    # 에러가 있으면 종료
    if state.get("error_message"):
        return END
    
    # 기본적으로는 종료 (무한루프 방지)
    return END


# ============ LangGraph 워크플로우 ============
def create_workflow() -> StateGraph:
    """LangGraph 워크플로우 생성"""
    
    workflow = StateGraph(InterviewGeneratorState)
    
    # 노드 추가
    workflow.add_node("chatbot", chatbot_node)
    workflow.add_node("tools", tools_node)
    
    # 엣지 추가 - 무한루프 방지
    workflow.add_edge(START, "chatbot")
    workflow.add_conditional_edges(
        "chatbot",
        should_continue,
        {"tools": "tools", END: END}  # "chatbot": "chatbot" 제거로 무한루프 방지
    )
    workflow.add_edge("tools", "chatbot")  # 도구 실행 후 한 번만 챗봇으로
    
    # recursion_limit 설정
    return workflow.compile(debug=False)


# ============ 메인 인터페이스 클래스 ============
class LangGraphInterviewGenerator:
    """LangGraph 기반 면접 질문 생성기"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 환경 변수를 설정해주세요.")
        
        self.workflow = create_workflow()
        self.reset_conversation()
    
    def reset_conversation(self):
        """대화 초기화"""
        self.state = {
            "messages": [],
            "company_name": "",
            "position": "",
            "interview_type": "",
            "difficulty_level": "",
            "question_count": 15,
            "user_profile": {},
            "resume_content": "",
            "generated_questions": "",
            "generated_files": [],
            "current_step": "start",
            "is_complete": False,
            "error_message": ""
        }
    
    def chat(self, message: str, history: List, files=None) -> tuple:
        """메인 채팅 처리"""
        try:
            logger.info(f"채팅 처리 시작: {message}")
            
            # 파일 처리
            if files:
                file_path = files.name if hasattr(files, 'name') else str(files)
                try:
                    resume_content = process_uploaded_file(file_path)
                    self.state["resume_content"] = resume_content
                    message += f"\n\n[이력서 업로드됨]\n{resume_content[:500]}..."
                    logger.info("파일 처리 완료")
                except Exception as e:
                    error_msg = f"파일 처리 오류: {str(e)}\n직접 입력해주세요."
                    history.append(["[파일 업로드 실패]", error_msg])
                    return history, ""
            
            # 초기화 명령어 체크
            if any(cmd in message.lower() for cmd in ["처음부터", "초기화", "리셋", "다시"]):
                self.reset_conversation()
                welcome_msg = "안녕하세요! 면접 준비를 도와드릴게요 😊\n\n어떤 회사에 지원하시나요?"
                history.append([message, welcome_msg])
                return history, ""
            
            # 사용자 메시지 추가
            human_message = HumanMessage(content=message)
            self.state["messages"] = [human_message]
            
            logger.info(f"워크플로우 실행 전 상태: {self.state.keys()}")
            
            # 워크플로우 실행 (recursion_limit 설정)
            config = {"recursion_limit": 10}  # 최대 10번 반복으로 제한
            result = self.workflow.invoke(self.state, config=config)
            
            # 상태 업데이트 - 여기가 핵심!
            self.state.update(result)
            logger.info(f"워크플로우 실행 후 상태: company={self.state.get('company_name')}, position={self.state.get('position')}")
            
            # 응답 메시지 추출
            response_content = ""
            if result.get("messages"):
                last_message = result["messages"][-1]
                if hasattr(last_message, 'content') and last_message.content:
                    response_content = last_message.content
                else:
                    response_content = "처리 중입니다..."
                
                # 도구 실행 결과 포맷팅
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    tool_info = self._format_tool_info(last_message.tool_calls)
                    if tool_info:
                        response_content += f"\n\n{tool_info}"
            else:
                response_content = "응답을 생성할 수 없습니다."
            
            # 히스토리 업데이트
            history.append([message, response_content])
            
            return history, ""
            
        except Exception as e:
            logger.error(f"채팅 처리 오류: {str(e)}")
            error_msg = f"죄송합니다. 오류가 발생했습니다: {str(e)}\n다시 시도해주세요."
            history.append([message, error_msg])
            return history, ""
    
    def _format_tool_info(self, tool_calls) -> str:
        """도구 호출 정보 포맷팅"""
        info_parts = []
        
        for tool_call in tool_calls:
            tool_name = tool_call.get("name", "")
            
            if tool_name == "collect_company_info":
                info_parts.append("✅ 회사 정보가 저장되었습니다!")
            elif tool_name == "determine_job_type":
                info_parts.append("🎯 직무 분석 완료! 최적의 면접 유형을 추천했습니다!")
            elif tool_name == "analyze_resume_content":
                info_parts.append("📋 이력서 분석이 완료되었습니다!")
            elif tool_name == "suggest_interview_settings":
                info_parts.append("💡 개인 맞춤형 면접 설정을 추천했습니다!")
            elif tool_name == "set_interview_preferences":
                info_parts.append("⚙️ 면접 설정이 확정되었습니다!")
            elif tool_name == "generate_interview_questions":
                info_parts.append("🎯 개인 맞춤형 면접 질문이 생성되었습니다!")
            elif tool_name == "save_questions_to_file":
                info_parts.append("💾 파일 저장이 완료되었습니다!")
        
        return "\n".join(info_parts) if info_parts else ""
    
    def get_download_files(self) -> List[str]:
        """다운로드 파일 목록"""
        return self.state.get("generated_files", [])
    
    def get_collected_info(self) -> Dict:
        """수집된 정보"""
        return {
            "company_name": self.state.get("company_name", ""),
            "position": self.state.get("position", ""),
            "interview_type": self.state.get("interview_type", ""),
            "difficulty_level": self.state.get("difficulty_level", ""),
            "question_count": self.state.get("question_count", 0),
            "user_profile": self.state.get("user_profile", {}),
            "is_complete": self.state.get("is_complete", False)
        }
    
    def create_interface(self):
        """Gradio 인터페이스 생성"""
        
        with gr.Blocks(
            title="LangGraph 면접 질문 생성기",
            theme=gr.themes.Soft(),
            css="""
            .chat-container { max-height: 600px; overflow-y: auto; }
            .info-panel { background-color: #f8f9fa; padding: 15px; border-radius: 8px; }
            """
        ) as demo:
            
            gr.Markdown("""
            # 🚀 LangGraph 기반 면접 질문 생성기
            
            **체계적인 워크플로우와 상태 관리로 더욱 안정적인 서비스**
            
            ✨ **LangGraph 특징:**
            - 🔄 **상태 기반 워크플로우**: 체계적인 대화 흐름 관리
            - 🛠️ **도구 자동 실행**: 필요에 따라 적절한 도구 선택
            - 🎯 **조건부 라우팅**: 상황에 맞는 다음 단계 결정
            - 💾 **상태 유지**: 대화 중 정보 누적 및 관리
            
            자연스럽게 대화하세요! 시스템이 알아서 처리합니다.
            """)
            
            with gr.Row():
                with gr.Column(scale=2):
                    # 채팅 인터페이스
                    chatbot = gr.Chatbot(
                        value=[[None, "안녕하세요! LangGraph 기반 면접 준비 도우미입니다 🤖\n\n어떤 회사에 지원하시나요?"]],
                        label="🎯 면접 준비 대화",
                        height=500,
                        elem_classes=["chat-container"]
                    )
                    
                    with gr.Row():
                        msg = gr.Textbox(
                            label="💬 메시지",
                            placeholder="자연스럽게 대화하세요... (예: 네이버 프론트엔드 개발자로 지원해요)",
                            scale=3
                        )
                        file_upload = gr.File(
                            label="📁 이력서",
                            file_types=[".pdf", ".docx", ".txt"],
                            scale=1
                        )
                    
                    with gr.Row():
                        send_btn = gr.Button("📤 전송", variant="primary", scale=2)
                        clear_btn = gr.Button("🔄 초기화", scale=1)
                
                with gr.Column(scale=1):
                    # 워크플로우 상태 표시
                    gr.Markdown("### 🔄 워크플로우 상태")
                    workflow_status = gr.JSON(
                        label="📊 수집된 정보",
                        value={},
                        elem_classes=["info-panel"]
                    )
                    
                    # 다운로드 섹션
                    gr.Markdown("### 📥 결과 다운로드")
                    download_btn = gr.DownloadButton(
                        "📄 면접 질문 다운로드",
                        visible=False,
                        variant="secondary"
                    )
                    
                    download_status = gr.Markdown(
                        "질문이 생성되면 다운로드 버튼이 나타납니다.",
                        elem_classes=["info-panel"]
                    )
            
            # LangGraph 워크플로우 다이어그램 (정보용)
            gr.Markdown("""
            ### 🧠 LangGraph 워크플로우
            
            ```
            START → 챗봇 노드 → 도구 실행 노드 → 챗봇 노드 → ... → END
                      ↓           ↓               ↑
                   도구 필요?    도구 실행        결과 반영
                      ↓           ↓               ↑
                   [회사정보]   [이력서분석]    [설정저장]
                   [질문생성]   [파일저장]      [완료확인]
            ```
            
            **노드별 역할:**
            - 🤖 **챗봇 노드**: 사용자와 대화, 도구 호출 결정
            - 🛠️ **도구 노드**: 정보 수집, 분석, 질문 생성, 파일 저장
            - 🔀 **조건부 라우팅**: 다음 단계 자동 결정
            """)
            
            # 이벤트 핸들러
            def send_message(message, history, files):
                new_history, _ = self.chat(message, history, files)
                collected_info = self.get_collected_info()
                
                # 다운로드 파일 확인
                download_files = self.get_download_files()
                download_file = download_files[0] if download_files else None
                
                # 상태 메시지 업데이트
                status_info = self.get_collected_info()
                if status_info.get("is_complete"):
                    status_msg = "✅ 면접 질문 생성 완료! 위 버튼으로 다운로드하세요."
                elif status_info.get("company_name") and status_info.get("position"):
                    status_msg = "🔄 정보 수집 중... 계속 대화해주세요."
                else:
                    status_msg = "질문이 생성되면 다운로드 버튼이 나타납니다."
                
                logger.info(f"UI 업데이트: collected_info={collected_info}")
                
                return (
                    new_history, "", collected_info,
                    gr.update(value=download_file, visible=bool(download_file)),
                    status_msg
                )
            
            def clear_chat():
                self.reset_conversation()
                return (
                    [[None, "안녕하세요! LangGraph 기반 면접 준비 도우미입니다 🤖\n\n어떤 회사에 지원하시나요?"]],
                    "", {},
                    gr.update(visible=False),
                    "질문이 생성되면 다운로드 버튼이 나타납니다."
                )
            
            # 이벤트 연결
            send_btn.click(
                send_message,
                [msg, chatbot, file_upload],
                [chatbot, msg, workflow_status, download_btn, download_status]
            )
            
            msg.submit(
                send_message,
                [msg, chatbot, file_upload],
                [chatbot, msg, workflow_status, download_btn, download_status]
            )
            
            clear_btn.click(
                clear_chat,
                outputs=[chatbot, msg, workflow_status, download_btn, download_status]
            )
            
            # 예제 대화 및 설명
            gr.Markdown("""
            ### 💡 사용 예시
            
            **🗣️ 자연스러운 대화 예시:**
            
            **사용자**: "안녕하세요! 카카오 프론트엔드 개발자로 지원하는데 기술면접 준비하고 싶어요"
            
            **AI**: "카카오 프론트엔드 개발자 지원을 위한 기술면접 준비를 도와드리겠습니다! 
                   이력서를 업로드해주시거나 간단한 경력사항을 알려주세요."
            
            **사용자**: [이력서 파일 업로드] 
            
            **AI**: "이력서 분석 완료! React 3년 경험자시군요. 
                   중급 수준으로 15개 질문을 생성하시겠어요?"
            
            **사용자**: "네, 좋습니다!"
            
            **AI**: "완료! 개인 맞춤형 면접 질문이 생성되었습니다. 다운로드하세요! ✅"
            
            ### 🎯 LangGraph의 장점
            
            1. **🔄 상태 관리**: 대화 중 정보를 체계적으로 누적
            2. **🤖 지능적 라우팅**: 상황에 맞는 다음 단계 자동 결정  
            3. **🛠️ 도구 자동 실행**: 필요할 때 적절한 도구 자동 선택
            4. **📊 투명성**: 현재 상태와 진행 상황을 명확히 표시
            5. **🔧 확장성**: 새로운 노드와 도구를 쉽게 추가 가능
            
            ### 🔧 지원하는 도구들
            
            - **collect_company_info**: 회사명과 직무 정보 수집
            - **determine_job_type**: 직무 분석 및 면접 유형 추천
            - **analyze_resume_content**: 이력서 내용 AI 분석  
            - **suggest_interview_settings**: 개인 맞춤형 설정 추천
            - **set_interview_preferences**: 최종 면접 설정 확정
            - **generate_interview_questions**: 개인 맞춤형 질문 생성
            - **save_questions_to_file**: 결과를 파일로 저장
            
            ### 🎯 스마트 추천 시스템
            
            **직무별 면접 유형 자동 추천:**
            - 🖥️ **개발직** → 기술면접 추천
            - 📋 **기획직** → 종합면접 추천  
            - 📈 **마케팅직** → 인성면접 추천
            - 🎨 **디자인직** → 기술면접 추천
            - 📊 **데이터직** → 기술면접 추천
            
            **경력별 난이도 자동 조정:**
            - 👨‍🎓 **신입** → 초급 난이도, 10-12개 질문
            - 👩‍💼 **경력** → 중급 난이도, 15-18개 질문
            - 👨‍💼 **시니어** → 고급 난이도, 18-22개 질문
            
            **회사 규모별 맞춤 조정:**
            - 🏢 **대기업** → 난이도 상향, 질문 수 증가
            - 🚀 **스타트업** → 실무 중심 조정
            
            ### 🚀 개선된 기능들
            
            - **스마트 파일 처리**: PDF, DOCX, TXT 자동 인식
            - **에러 복구**: 실패 시 대안 방법 자동 제시
            - **실시간 상태 표시**: 현재 진행 상황 시각화
            - **원클릭 다운로드**: 생성된 질문 즉시 저장
            """)
        
        return demo


def main():
    """메인 실행 함수"""
    try:
        print("🚀 LangGraph 기반 면접 질문 생성기 시작...")
        
        # 환경 설정 확인
        if not os.getenv("OPENAI_API_KEY"):
            print("❌ OPENAI_API_KEY 환경 변수를 설정해주세요.")
            print("   .env 파일에 OPENAI_API_KEY=your_api_key_here 추가")
            return
        
        # 임시 디렉토리 생성
        temp_dir = Path("temp_downloads")
        temp_dir.mkdir(exist_ok=True)
        print(f"📁 다운로드 디렉토리: {temp_dir.absolute()}")
        
        # LangGraph 워크플로우 인터페이스 생성
        print("🔄 LangGraph 워크플로우 초기화 중...")
        generator = LangGraphInterviewGenerator()
        demo = generator.create_interface()
        
        print("🌐 서버 시작 중...")
        demo.launch(
            share=False,
            debug=True,
            server_name="127.0.0.1",
            server_port=7860,
            show_error=True
        )
        
    except ImportError as e:
        print(f"❌ 라이브러리 누락: {str(e)}")
        print("pip install langgraph langchain-openai 를 실행해주세요.")
    except ValueError as e:
        print(f"❌ 설정 오류: {str(e)}")
    except Exception as e:
        print(f"❌ 시작 오류: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()