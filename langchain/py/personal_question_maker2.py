"""
LangGraph 기반 대화형 개인 맞춤형 면접 질문 생성기
personal_question_maker.py의 모든 기능을 대화형으로 구현
"""

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

# 기존 imports (personal_question_maker.py에서)
import pdfplumber
import docx
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============ 상태 정의 ============
class InterviewGeneratorState(TypedDict):
    """LangGraph 상태 관리 - 모든 개인 프로필 정보 포함"""
    messages: Annotated[List[BaseMessage], operator.add]
    
    # 기본 정보
    company_name: str
    position: str
    career_level: str
    website_url: str
    
    # 개인 프로필 정보 (PersonalProfile과 동일)
    education_level: str
    major: str
    gpa: str
    certificates: str
    language_skills: str
    tech_stack: str
    personality_type: str
    project_scale: str
    leadership_experience: str
    domain_experience: str
    portfolio_links: str
    blog_activity: str
    sns_activity: str
    open_source: str
    awards: str
    competitions: str
    publications: str
    application_source: str
    priority_values: str
    career_goal: str
    work_style: str
    
    # 면접 설정
    interview_type: str
    difficulty_level: str
    question_count: int
    
    # 문서 및 생성 결과
    resume_content: str
    company_website_info: str
    generated_questions: str
    generated_files: List[str]
    
    # 진행 상태
    current_step: str
    collected_fields: List[str]
    is_complete: bool
    error_message: str


# ============ 기존 클래스들 (personal_question_maker.py에서) ============
class DocumentProcessor:
    """문서 처리 클래스 - 기존과 동일"""
    
    @staticmethod
    def extract_pdf_text(file_path: str) -> str:
        """PDF 파일에서 텍스트 추출 (pdfplumber 사용)"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        
                        # 테이블이 있는 경우 테이블 내용도 추출
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                if row:  # None이 아닌 행만 처리
                                    row_text = " | ".join([cell or "" for cell in row])
                                    text += row_text + "\n"
            
            if not text.strip():
                raise ValueError("PDF에서 텍스트를 추출할 수 없습니다.")
                
            return text
        except Exception as e:
            raise Exception(f"PDF 파일 처리 오류: {str(e)}")
    
    @staticmethod
    def extract_docx_text(file_path: str) -> str:
        """DOCX 파일에서 텍스트 추출"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"DOCX 파일 처리 오류: {str(e)}")
    
    @staticmethod
    def extract_text_from_uploaded_file(file_path: str) -> str:
        """업로드된 파일에서 텍스트 추출"""
        if not file_path or not os.path.exists(file_path):
            raise ValueError(f"파일을 찾을 수 없습니다: {file_path}")
        
        file_path = os.path.normpath(file_path)
        _, file_extension = os.path.splitext(file_path)
        file_extension = file_extension.lower()
        
        try:
            if file_extension == '.pdf':
                text = DocumentProcessor.extract_pdf_text(file_path)
            elif file_extension == '.docx':
                text = DocumentProcessor.extract_docx_text(file_path)
            elif file_extension == '.txt':
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            else:
                raise ValueError(f"지원되지 않는 파일 형식: {file_extension}")
            
            if not text.strip():
                raise ValueError("파일에서 텍스트를 추출할 수 없습니다.")
            
            logger.info(f"✅ 텍스트 추출 완료: {len(text)} 문자")
            return text
            
        except Exception as e:
            logger.error(f"❌ 파일 처리 중 오류: {str(e)}")
            raise e


class SimpleWebCrawler:
    """웹 크롤러 - 기존과 동일"""
    
    @staticmethod
    def crawl_company_basic_info(website_url: str) -> str:
        """회사 웹사이트에서 기본 정보 크롤링"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(website_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 스크립트, 스타일 태그 제거
            for script in soup(["script", "style"]):
                script.extract()
            
            text = soup.get_text()
            
            # 텍스트 정리
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # 길이 제한 (토큰 절약)
            return text[:5000] if len(text) > 5000 else text
            
        except Exception as e:
            return f"웹사이트 크롤링 실패: {str(e)}"


# ============ LangGraph 도구 정의 ============
@tool
def collect_basic_info(company_name: str, position: str, website_url: str = "") -> Dict[str, Any]:
    """회사명, 지원 직무, 웹사이트 정보를 수집합니다."""
    logger.info(f"기본 정보 수집: {company_name}, {position}")
    
    result = {
        "company_name": company_name.strip(),
        "position": position.strip(),
        "website_url": website_url.strip() if website_url else "",
        "status": "success",
        "message": f"✅ {company_name} {position} 지원 정보가 저장되었습니다!"
    }
    
    # 웹사이트 크롤링 시도
    if website_url.strip():
        try:
            company_info = SimpleWebCrawler.crawl_company_basic_info(website_url)
            result["company_website_info"] = company_info
            result["message"] += f"\n🌐 회사 웹사이트 정보도 수집했습니다."
        except Exception as e:
            result["company_website_info"] = ""
            result["message"] += f"\n⚠️ 웹사이트 정보 수집 실패: {str(e)}"
    
    return result

@tool
def process_resume_file(file_path: str) -> Dict[str, Any]:
    """이력서 파일을 처리하고 상세 정보를 추출합니다."""
    logger.info(f"이력서 파일 처리: {file_path}")
    
    try:
        # 파일에서 텍스트 추출
        resume_content = DocumentProcessor.extract_text_from_uploaded_file(file_path)
        
        # AI로 상세 분석
        api_key = os.getenv("OPENAI_API_KEY")
        llm = ChatOpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0.1)
        
        analysis_prompt = f"""
다음 이력서 내용에서 상세한 개인 프로필 정보를 추출해주세요.

이력서 내용:
{resume_content[:4000]}

다음 JSON 형식으로만 응답해주세요:
{{
    "career_level": "신입/경력 중 하나",
    "education_level": "고등학교/전문학사/학사/석사/박사 중 하나",
    "major": "전공명 또는 빈 문자열",
    "gpa": "학점 정보 또는 빈 문자열",
    "certificates": "자격증들 또는 빈 문자열",
    "language_skills": "어학 능력 또는 빈 문자열",
    "tech_stack": "기술 스택들 또는 빈 문자열",
    "personality_type": "성격 특성 또는 빈 문자열",
    "project_scale": "개인 프로젝트/소규모 팀(2-5명)/중규모 팀(6-15명)/대규모 팀(16명+) 중 하나",
    "leadership_experience": "없음/부분적 리더 역할/팀 리더/프로젝트 매니저 중 하나",
    "portfolio_links": "포트폴리오 링크들 또는 빈 문자열",
    "blog_activity": "블로그 활동 또는 빈 문자열",
    "sns_activity": "SNS 활동 또는 빈 문자열",
    "open_source": "오픈소스 기여 또는 빈 문자열",
    "awards": "수상 경력 또는 빈 문자열",
    "competitions": "대회 참여 또는 빈 문자열",
    "publications": "발표/출간 경력 또는 빈 문자열"
}}

찾는 기준:
- 명시적으로 기재된 정보만 추출
- 없는 정보는 빈 문자열로 설정
- 추측하지 말고 확실한 정보만 기재
"""
        
        response = llm.invoke([HumanMessage(content=analysis_prompt)])
        result_text = response.content.strip()
        
        # JSON 파싱
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
        
        profile_data = json.loads(result_text)
        profile_data["resume_content"] = resume_content
        profile_data["status"] = "success"
        profile_data["message"] = "📋 이력서 분석이 완료되었습니다! 추출된 정보를 확인해주세요."
        
        return profile_data
        
    except Exception as e:
        logger.error(f"이력서 처리 오류: {str(e)}")
        return {
            "status": "error",
            "message": f"❌ 이력서 처리 중 오류가 발생했습니다: {str(e)}",
            "resume_content": ""
        }

@tool
def suggest_interview_settings(position: str, career_level: str = "", tech_stack: str = "") -> Dict[str, Any]:
    """직무와 경력에 따라 최적의 면접 설정을 추천합니다."""
    logger.info(f"면접 설정 추천: {position}, {career_level}")
    
    position_lower = position.lower()
    
    # 직무별 면접 유형 매핑 (기존과 동일)
    job_mapping = {
        "개발직": ["개발", "프론트", "백엔드", "풀스택", "developer", "frontend", "backend", "엔지니어", "react", "vue", "python", "java"],
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
    
    # 면접 유형별 추천
    recommendations = {
        "개발직": {"type": "기술면접", "description": "기술 역량과 문제해결 능력 중심"},
        "기획직": {"type": "종합면접", "description": "논리적 사고와 커뮤니케이션 중심"},
        "마케팅직": {"type": "인성면접", "description": "창의성과 시장 이해도 중심"},
        "디자인직": {"type": "기술면접", "description": "포트폴리오와 창작 과정 중심"},
        "데이터직": {"type": "기술면접", "description": "분석 능력과 통계 지식 중심"},
        "영업직": {"type": "인성면접", "description": "설득력과 고객 지향성 중심"},
        "인사직": {"type": "인성면접", "description": "소통 능력과 조직 이해도 중심"},
        "재무직": {"type": "기술면접", "description": "전문 지식과 분석 능력 중심"},
        "일반직": {"type": "종합면접", "description": "전반적인 역량과 조직 적합성 중심"}
    }
    
    recommendation = recommendations.get(detected_type, recommendations["일반직"])
    
    # 경력별 난이도 추천
    if any(keyword in career_level.lower() for keyword in ["신입", "new", "junior", "졸업"]):
        difficulty = "초급"
        question_count = 12
    elif any(keyword in career_level.lower() for keyword in ["시니어", "senior", "리드", "팀장", "매니저"]):
        difficulty = "고급"
        question_count = 18
    else:
        difficulty = "중급"
        question_count = 15
    
    return {
        "job_type": detected_type,
        "recommended_interview_type": recommendation["type"],
        "recommended_difficulty": difficulty,
        "recommended_question_count": question_count,
        "description": recommendation["description"],
        "status": "success",
        "message": f"🎯 {detected_type}에 최적화된 {recommendation['type']} ({difficulty}, {question_count}개)를 추천합니다!"
    }

@tool
def collect_additional_info(field_name: str, field_value: str) -> Dict[str, Any]:
    """추가 개인 정보를 수집합니다."""
    logger.info(f"추가 정보 수집: {field_name} = {field_value}")
    
    field_mapping = {
        "career_goal": "커리어 목표",
        "priority_values": "우선순위 가치",
        "work_style": "선호 업무 스타일",
        "application_source": "지원 경로",
        "domain_experience": "해당 도메인 경험"
    }
    
    field_display = field_mapping.get(field_name, field_name)
    
    return {
        "field_name": field_name,
        "field_value": field_value.strip(),
        "status": "success",
        "message": f"✅ {field_display} 정보가 저장되었습니다!"
    }

@tool
def set_interview_preferences(interview_type: str, difficulty_level: str, question_count: int) -> Dict[str, Any]:
    """최종 면접 설정을 확정합니다."""
    logger.info(f"면접 설정 확정: {interview_type}, {difficulty_level}, {question_count}")
    
    # 입력값 정규화
    interview_types = {
        "기술": "기술면접", "기술면접": "기술면접", "tech": "기술면접",
        "인성": "인성면접", "인성면접": "인성면접", "personality": "인성면접",
        "임원": "임원면접", "임원면접": "임원면접", "executive": "임원면접",
        "종합": "종합면접", "종합면접": "종합면접", "comprehensive": "종합면접"
    }
    
    difficulties = {
        "초급": "초급", "쉬운": "초급", "easy": "초급", "기초": "초급",
        "중급": "중급", "보통": "중급", "medium": "중급", "일반": "중급",
        "고급": "고급", "어려운": "고급", "hard": "고급", "높은": "고급"
    }
    
    normalized_type = interview_types.get(interview_type.lower(), "종합면접")
    normalized_difficulty = difficulties.get(difficulty_level.lower(), "중급")
    
    # 질문 개수 검증
    if question_count < 5:
        question_count = 5
    elif question_count > 30:
        question_count = 30
    
    return {
        "interview_type": normalized_type,
        "difficulty_level": normalized_difficulty,
        "question_count": question_count,
        "status": "success",
        "message": f"⚙️ 면접 설정이 확정되었습니다: {normalized_type} ({normalized_difficulty}, {question_count}개)"
    }

@tool
def generate_personalized_questions(state_json: str) -> Dict[str, Any]:
    """개인 맞춤형 면접 질문을 생성합니다."""
    logger.info("개인 맞춤형 질문 생성 시작")
    
    try:
        state_data = json.loads(state_json)
        
        api_key = os.getenv("OPENAI_API_KEY")
        llm = ChatOpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0.7, max_tokens=4000)
        
        # 기존 personal_question_maker.py의 상세한 프롬프트 사용
        prompt = f"""
당신은 {state_data.get('company_name', '회사')}의 전문 면접관입니다. 
다음 지원자의 상세 프로필을 바탕으로 매우 개인화된 면접 질문을 생성해야 합니다.

[지원자 기본 정보]
- 회사: {state_data.get('company_name', '')}
- 직무: {state_data.get('position', '')}
- 경력구분: {state_data.get('career_level', '')}

[지원자 상세 프로필]
- 학력: {state_data.get('education_level', '')}
- 전공: {state_data.get('major', '')}
- 학점: {state_data.get('gpa', '')}
- 자격증: {state_data.get('certificates', '')}
- 어학능력: {state_data.get('language_skills', '')}
- 기술스택: {state_data.get('tech_stack', '')}
- 성격유형: {state_data.get('personality_type', '')}
- 프로젝트규모: {state_data.get('project_scale', '')}
- 리더십경험: {state_data.get('leadership_experience', '')}
- 포트폴리오: {state_data.get('portfolio_links', '')}
- 블로그활동: {state_data.get('blog_activity', '')}
- SNS활동: {state_data.get('sns_activity', '')}
- 오픈소스기여: {state_data.get('open_source', '')}
- 수상경력: {state_data.get('awards', '')}
- 대회참여: {state_data.get('competitions', '')}
- 발표출간: {state_data.get('publications', '')}
- 커리어목표: {state_data.get('career_goal', '')}
- 업무스타일: {state_data.get('work_style', '')}

[면접 설정]
- 면접유형: {state_data.get('interview_type', '종합면접')}
- 난이도: {state_data.get('difficulty_level', '중급')}
- 질문개수: {state_data.get('question_count', 15)}개

[회사 웹사이트 정보]
{state_data.get('company_website_info', '정보 없음')}

위 정보를 최대한 활용하여 다음과 같이 매우 구체적이고 개인화된 질문을 생성해주세요:

### 질문 생성 원칙
1. **개인화**: 지원자의 구체적인 경험과 정보를 질문에 포함
2. **유형 특화**: {state_data.get('interview_type', '종합면접')}의 핵심 평가 요소에 집중
3. **난이도 조절**: {state_data.get('difficulty_level', '중급')} 수준에 맞는 질문 복잡도
4. **회사 맞춤**: 회사 정보를 활용한 맞춤형 질문

### 질문 형식
각 질문마다 다음 정보를 포함:

**질문 [번호]: [질문 내용]**
- *평가 의도: 무엇을 평가하려는 질문인지*
- *개인화 포인트: 어떤 개인 정보를 활용했는지*
- *예상 답변 시간: 3-5분*

---

주의사항:
- 빈 정보("")는 사용하지 말고, 있는 정보만 활용
- 각 질문에 구체적인 개인 정보를 포함시켜 개인화된 느낌이 나도록 구성
- "귀하의 GitHub에서 확인한 XX 프로젝트를 보니...", "우리 회사의 YY 가치관에 대해..." 등의 방식 활용

총 {state_data.get('question_count', 15)}개의 매우 개인적이고 면접 유형에 특화된 질문을 생성해주세요.
"""
        
        response = llm.invoke([HumanMessage(content=prompt)])
        questions = response.content
        
        # 면접 유형별 맞춤 팁 추가
        interview_type = state_data.get('interview_type', '종합면접')
        position = state_data.get('position', '')
        
        # 기존 personal_question_maker.py의 상세한 팁 로직 사용
        tips = generate_interview_tips(interview_type, position)
        
        full_content = f"""# 🎯 {state_data.get('company_name', '회사')} - {state_data.get('position', '직무')} 개인 맞춤형 {interview_type}

## 📋 개인 프로필 요약
- **학력**: {state_data.get('education_level', '')} ({state_data.get('major', '')})
- **경력구분**: {state_data.get('career_level', '')}
- **핵심 역량**: {state_data.get('tech_stack', '')}
- **성격 특성**: {state_data.get('personality_type', '')}
- **커리어 목표**: {state_data.get('career_goal', '')}

## ⚙️ 면접 설정
- **면접 유형**: {interview_type}
- **난이도**: {state_data.get('difficulty_level', '중급')}
- **질문 개수**: {state_data.get('question_count', 15)}개

---

{questions}

---

{tips}

**당신만의 독특한 스토리와 {interview_type}에 특화된 준비로 면접관을 감동시키세요! 🌟**
"""
        
        return {
            "questions": full_content,
            "status": "success",
            "message": "🎯 개인 맞춤형 면접 질문이 생성되었습니다!"
        }
        
    except Exception as e:
        logger.error(f"질문 생성 오류: {str(e)}")
        return {
            "questions": f"질문 생성 중 오류가 발생했습니다: {str(e)}",
            "status": "error",
            "message": f"❌ 질문 생성 중 오류: {str(e)}"
        }

@tool
def save_questions_to_file(questions: str, company_name: str, position: str, interview_type: str) -> Dict[str, Any]:
    """생성된 질문을 파일로 저장합니다."""
    logger.info("파일 저장 시작")
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{interview_type}_{company_name}_{position}_{timestamp}.txt"
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-한글").strip()
        
        temp_dir = Path("temp_downloads")
        temp_dir.mkdir(exist_ok=True)
        
        file_path = temp_dir / safe_filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(questions)
        
        return {
            "file_path": str(file_path),
            "status": "success",
            "message": f"💾 파일이 저장되었습니다: {safe_filename}"
        }
        
    except Exception as e:
        logger.error(f"파일 저장 오류: {str(e)}")
        return {
            "file_path": "",
            "status": "error",
            "message": f"❌ 파일 저장 중 오류: {str(e)}"
        }


# ============ 유틸리티 함수 ============
def generate_interview_tips(interview_type: str, position: str) -> str:
    """면접 유형별 맞춤 팁 생성 (기존 personal_question_maker.py에서)"""
    
    tips = f"""## 💡 {interview_type} 맞춤 준비 팁

### 🎯 {interview_type} 핵심 포인트"""
    
    if interview_type == "기술면접":
        tips += """
1. **기술 기초 지식**: CS 전공 지식과 실무 경험을 연결해서 설명
2. **코딩 역량**: 알고리즘과 자료구조, 실제 구현 경험 정리
3. **시스템 설계**: 확장성, 성능, 보안을 고려한 아키텍처 설계 경험
4. **기술 트렌드**: 최신 기술에 대한 관심과 학습 의지 어필
5. **문제 해결**: 복잡한 기술적 문제를 해결한 구체적 사례 준비"""
    
    elif interview_type == "인성면접":
        tips += """
1. **가치관 정립**: 개인의 핵심 가치와 회사 문화의 일치점 강조
2. **팀워크 경험**: 협업 과정에서의 갈등 해결과 소통 방식 사례
3. **성장 마인드**: 실패 경험과 그를 통한 학습, 성장 스토리
4. **조직 적응력**: 다양한 환경에서의 적응 경험과 유연성
5. **소통 능력**: 다양한 이해관계자와의 효과적 소통 경험"""
    
    elif interview_type == "임원면접":
        tips += """
1. **리더십 철학**: 개인의 리더십 스타일과 팀 관리 경험
2. **전략적 사고**: 비즈니스 관점에서의 문제 인식과 해결 방안
3. **의사결정**: 어려운 상황에서의 판단 기준과 책임감
4. **조직 기여**: 회사 성장에 기여할 수 있는 구체적 방안
5. **장기 비전**: 개인과 조직의 미래 발전 방향에 대한 생각"""
    
    else:  # 종합면접
        tips += """
1. **종합적 역량**: 기술, 인성, 리더십의 균형잡힌 발전 과정
2. **회사 이해**: 회사의 비전, 가치, 문화에 대한 깊은 이해
3. **성장 스토리**: 지속적인 학습과 발전을 보여주는 일관된 스토리
4. **적응력**: 변화하는 환경에서의 유연성과 혁신 마인드
5. **기여 방안**: 회사와 팀에 기여할 수 있는 차별화된 가치 제안"""
    
    tips += f"""

### 🌟 개인 맞춤 포인트
- **GitHub/포트폴리오**: 주요 프로젝트의 기술적 도전과 해결 과정
- **블로그/기술 글**: 작성한 내용의 배경과 인사이트
- **수상/성과**: 성취 과정에서의 문제 해결 능력과 팀워크
- **오픈소스**: 커뮤니티 기여 경험과 협업 능력
- **회사 문화**: 수집된 회사 정보를 바탕으로 한 문화 적합성"""
    
    return tips


# ============ LangGraph 노드 정의 ============
def conversation_router(state: InterviewGeneratorState) -> InterviewGeneratorState:
    """대화 라우터 - 한 번에 하나의 도구만 실행"""
    
    last_message = state["messages"][-1] if state["messages"] else None
    if not last_message or not hasattr(last_message, 'content'):
        return state
    
    user_input = last_message.content.lower()
    
    # 현재 상태 정보 수집
    company_name = state.get("company_name", "")
    position = state.get("position", "")
    resume_analyzed = bool(state.get("resume_content", ""))
    interview_settings = bool(state.get("interview_type", ""))
    questions_generated = bool(state.get("generated_questions", ""))
    files_saved = bool(state.get("generated_files", []))
    
    # 추천된 설정이 있는지 확인
    has_recommendations = bool(state.get("recommended_interview_type", ""))
    
    api_key = os.getenv("OPENAI_API_KEY")
    tools = [
        collect_basic_info,
        process_resume_file,
        suggest_interview_settings,
        collect_additional_info,
        set_interview_preferences,
        generate_personalized_questions,
        save_questions_to_file
    ]
    
    llm_with_tools = ChatOpenAI(
        api_key=api_key,
        model="gpt-4o-mini",
        temperature=0.3
    ).bind_tools(tools)
    
    # 상황별 다음 액션 결정
    if not company_name or not position:
        next_action = "회사명과 직무 정보가 필요합니다. collect_basic_info를 사용하세요."
    elif not resume_analyzed:
        next_action = "이력서 분석이 필요합니다. 이력서 업로드를 요청하세요."
    elif not has_recommendations:
        next_action = "면접 설정 추천이 필요합니다. suggest_interview_settings를 사용하세요."
    elif not interview_settings:
        next_action = "추천된 설정을 확정해야 합니다. set_interview_preferences를 사용하세요."
    elif not questions_generated:
        next_action = "질문 생성이 필요합니다. generate_personalized_questions를 사용하세요."
    elif not files_saved:
        next_action = "파일 저장이 필요합니다. save_questions_to_file를 사용하세요."
    else:
        next_action = "모든 단계가 완료되었습니다. 완료 메시지만 출력하세요."
    
    # 단순화된 시스템 메시지
    system_prompt = f"""
당신은 면접 준비 도우미입니다. 단계별로 하나씩 진행합니다.

현재 상태:
- 회사/직무: {company_name} {position} {'✅' if company_name and position else '❌'}
- 이력서 분석: {'✅' if resume_analyzed else '❌'}
- 추천 완료: {'✅' if has_recommendations else '❌'}
- 설정 확정: {'✅' if interview_settings else '❌'}
- 질문 생성: {'✅' if questions_generated else '❌'}
- 파일 저장: {'✅' if files_saved else '❌'}

다음 액션: {next_action}

사용자가 "질문 만들어줘", "질문 생성", "생성해줘" 등의 요청을 하면:
- 설정이 확정되지 않았다면 → set_interview_preferences로 추천된 설정을 먼저 확정
- 설정이 확정되었다면 → generate_personalized_questions로 질문 생성

추천된 설정 정보:
- 면접 유형: {state.get('recommended_interview_type', '')}
- 난이도: {state.get('recommended_difficulty', '')}  
- 질문 개수: {state.get('recommended_question_count', 15)}

**한 번에 하나의 도구만 사용하세요!**
"""
    
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    try:
        response = llm_with_tools.invoke(messages)
        return {
            **state,
            "messages": [response],
        }
    except Exception as e:
        logger.error(f"대화 라우터 오류: {str(e)}")
        error_response = AIMessage(content=f"죄송합니다. 오류가 발생했습니다: {str(e)}")
        return {
            **state,
            "messages": [error_response],
            "error_message": str(e)
        }

def tools_executor(state: InterviewGeneratorState) -> InterviewGeneratorState:
    """도구 실행 노드"""
    
    last_message = state["messages"][-1]
    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        return state
    
    tools = [
        collect_basic_info,
        process_resume_file,
        suggest_interview_settings,
        collect_additional_info,
        set_interview_preferences,
        generate_personalized_questions,
        save_questions_to_file
    ]
    
    tool_node = ToolNode(tools)
    tool_messages = tool_node.invoke({"messages": [last_message]})
    
    # 상태 업데이트
    updated_state = state.copy()
    
    for message in tool_messages["messages"]:
        if hasattr(message, 'name') and hasattr(message, 'content'):
            tool_name = message.name
            
            try:
                content = json.loads(message.content) if message.content.startswith('{') else {"result": message.content}
            except:
                content = {"result": message.content}
            
            # 도구별 상태 업데이트
            if tool_name == "collect_basic_info" and content.get("status") == "success":
                updated_state["company_name"] = content.get("company_name", "")
                updated_state["position"] = content.get("position", "")
                updated_state["website_url"] = content.get("website_url", "")
                updated_state["company_website_info"] = content.get("company_website_info", "")
                updated_state["collected_fields"] = updated_state.get("collected_fields", []) + ["basic_info"]
                
            elif tool_name == "process_resume_file" and content.get("status") == "success":
                # 이력서에서 추출한 모든 정보 업데이트
                resume_fields = [
                    "career_level", "education_level", "major", "gpa", "certificates",
                    "language_skills", "tech_stack", "personality_type", "project_scale",
                    "leadership_experience", "portfolio_links", "blog_activity",
                    "sns_activity", "open_source", "awards", "competitions", "publications"
                ]
                
                for field in resume_fields:
                    if field in content:
                        updated_state[field] = content[field]
                
                updated_state["resume_content"] = content.get("resume_content", "")
                updated_state["collected_fields"] = updated_state.get("collected_fields", []) + ["resume_analysis"]
                
            elif tool_name == "suggest_interview_settings" and content.get("status") == "success":
                # 추천 설정을 임시 저장 (사용자 확인 후 확정)
                updated_state["recommended_interview_type"] = content.get("recommended_interview_type", "")
                updated_state["recommended_difficulty"] = content.get("recommended_difficulty", "")
                updated_state["recommended_question_count"] = content.get("recommended_question_count", 15)
                updated_state["collected_fields"] = updated_state.get("collected_fields", []) + ["settings_recommended"]
                
            elif tool_name == "collect_additional_info" and content.get("status") == "success":
                field_name = content.get("field_name", "")
                field_value = content.get("field_value", "")
                if field_name and field_value:
                    updated_state[field_name] = field_value
                
            elif tool_name == "set_interview_preferences" and content.get("status") == "success":
                updated_state["interview_type"] = content.get("interview_type", "")
                updated_state["difficulty_level"] = content.get("difficulty_level", "")
                updated_state["question_count"] = content.get("question_count", 15)
                updated_state["collected_fields"] = updated_state.get("collected_fields", []) + ["interview_settings"]
                
            elif tool_name == "generate_personalized_questions" and content.get("status") == "success":
                updated_state["generated_questions"] = content.get("questions", "")
                updated_state["collected_fields"] = updated_state.get("collected_fields", []) + ["questions_generated"]
                
            elif tool_name == "save_questions_to_file" and content.get("status") == "success":
                file_path = content.get("file_path", "")
                if file_path:
                    updated_state["generated_files"] = updated_state.get("generated_files", []) + [file_path]
                    updated_state["is_complete"] = True
    
    updated_state["messages"] = tool_messages["messages"]
    return updated_state

def should_continue(state: InterviewGeneratorState) -> str:
    """다음 노드 결정"""
    
    if not state.get("messages"):
        return END
    
    last_message = state["messages"][-1]
    
    # 도구 호출이 있으면 도구 실행
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"
    
    # 완료되었으면 종료
    if state.get("is_complete", False):
        return END
    
    # 에러가 있으면 종료
    if state.get("error_message"):
        return END
    
    # 기본적으로는 종료 (무한루프 방지)
    return END


# ============ LangGraph 워크플로우 ============
def create_enhanced_workflow() -> StateGraph:
    """강화된 LangGraph 워크플로우 생성 - 무한루프 방지"""
    
    workflow = StateGraph(InterviewGeneratorState)
    
    # 노드 추가
    workflow.add_node("conversation", conversation_router)
    workflow.add_node("tools", tools_executor)
    
    # 엣지 추가 - 무한루프 완전 차단
    workflow.add_edge(START, "conversation")
    workflow.add_conditional_edges(
        "conversation",
        should_continue,
        {"tools": "tools", END: END}
    )
    # tools 실행 후 바로 종료 - 대화 노드로 돌아가지 않음
    workflow.add_edge("tools", END)
    
    return workflow.compile(debug=False)


# ============ 메인 인터페이스 클래스 ============
class EnhancedLangGraphInterviewGenerator:
    """강화된 LangGraph 기반 면접 질문 생성기"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 환경 변수를 설정해주세요.")
        
        self.workflow = create_enhanced_workflow()
        self.reset_conversation()
    
    def reset_conversation(self):
        """대화 초기화"""
        self.state = {
            "messages": [],
            "company_name": "",
            "position": "",
            "career_level": "",
            "website_url": "",
            "education_level": "",
            "major": "",
            "gpa": "",
            "certificates": "",
            "language_skills": "",
            "tech_stack": "",
            "personality_type": "",
            "project_scale": "",
            "leadership_experience": "",
            "domain_experience": "",
            "portfolio_links": "",
            "blog_activity": "",
            "sns_activity": "",
            "open_source": "",
            "awards": "",
            "competitions": "",
            "publications": "",
            "application_source": "",
            "priority_values": "",
            "career_goal": "",
            "work_style": "",
            "interview_type": "",
            "difficulty_level": "",
            "question_count": 15,
            "resume_content": "",
            "company_website_info": "",
            "generated_questions": "",
            "generated_files": [],
            "current_step": "start",
            "collected_fields": [],
            "is_complete": False,
            "error_message": ""
        }
    
    def process_file_upload(self, file_path: str) -> Dict[str, Any]:
        """파일 업로드 처리 - 상태 업데이트 포함"""
        if not file_path:
            return {"status": "error", "message": "파일이 없습니다."}
        
        try:
            # process_resume_file 도구를 직접 호출
            result = process_resume_file.invoke({"file_path": file_path})
            
            if isinstance(result, dict) and result.get("status") == "success":
                # 상태 업데이트
                resume_fields = [
                    "career_level", "education_level", "major", "gpa", "certificates",
                    "language_skills", "tech_stack", "personality_type", "project_scale",
                    "leadership_experience", "portfolio_links", "blog_activity",
                    "sns_activity", "open_source", "awards", "competitions", "publications"
                ]
                
                for field in resume_fields:
                    if field in result and result[field]:
                        self.state[field] = result[field]
                
                self.state["resume_content"] = result.get("resume_content", "")
                self.state["collected_fields"] = self.state.get("collected_fields", []) + ["resume_analysis"]
                
                # 추출된 정보를 포함한 상세 메시지 생성
                extracted_info = []
                if result.get("career_level"): extracted_info.append(f"경력: {result['career_level']}")
                if result.get("education_level"): extracted_info.append(f"학력: {result['education_level']}")
                if result.get("major"): extracted_info.append(f"전공: {result['major']}")
                if result.get("tech_stack"): extracted_info.append(f"기술스택: {result['tech_stack']}")
                if result.get("project_scale"): extracted_info.append(f"프로젝트 규모: {result['project_scale']}")
                
                info_text = "\n".join([f"- {info}" for info in extracted_info])
                
                return {
                    "status": "success",
                    "message": f"📋 이력서 분석이 완료되었습니다!\n\n**추출된 정보:**\n{info_text}",
                    "extracted_info": extracted_info
                }
            else:
                return {
                    "status": "error", 
                    "message": result.get("message", "❌ 이력서 처리 실패")
                }
                
        except Exception as e:
            logger.error(f"파일 처리 오류: {str(e)}")
            return {
                "status": "error",
                "message": f"❌ 파일 처리 중 오류: {str(e)}"
            }
    
    def chat(self, message: str, history: List, files=None) -> tuple:
        """메인 채팅 처리"""
        try:
            logger.info(f"채팅 처리: {message}")
            
            # 이미 완료된 상태면 완료 메시지만 반환
            if self.state.get("is_complete", False):
                complete_msg = "🎉 모든 단계가 완료되었습니다! 위의 다운로드 버튼을 클릭해서 면접 질문을 다운로드하세요."
                history.append([message, complete_msg])
                return history, ""
            
            # 파일 업로드 처리
            file_processing_result = None
            if files:
                file_path = files.name if hasattr(files, 'name') else str(files)
                file_processing_result = self.process_file_upload(file_path)
                
                if file_processing_result["status"] == "success":
                    # 파일 처리 성공 시 분석된 정보를 메시지에 포함
                    message += f"\n\n[이력서 분석 완료]\n{file_processing_result['message']}"
                else:
                    # 파일 처리 실패 시 에러 메시지 추가
                    message += f"\n\n[파일 처리 실패]\n{file_processing_result['message']}"
            
            # 초기화 명령어 체크
            if any(cmd in message.lower() for cmd in ["처음부터", "초기화", "리셋", "다시"]):
                self.reset_conversation()
                welcome_msg = """안녕하세요! 개인 맞춤형 면접 질문 생성기입니다 🎯

저는 당신의 상세한 프로필을 바탕으로 완전히 개인화된 면접 질문을 생성해드립니다.

**🚀 준비된 기능들:**
- 📋 20+ 개인 프로필 필드 자동 분석
- 🌐 회사 웹사이트 정보 수집
- 🎯 직무별 면접 유형 자동 추천  
- ⚙️ 난이도 및 질문 개수 맞춤 설정
- 💡 면접 유형별 준비 팁 제공

어떤 회사에 지원하시나요? 회사명과 지원 직무를 알려주세요!"""
                history.append([message, welcome_msg])
                return history, ""
            
            # 사용자 메시지 생성 - 현재 상태 정보 포함
            user_content = message
            if file_processing_result and file_processing_result["status"] == "success":
                # 추출된 정보가 있으면 컨텍스트에 추가
                extracted = file_processing_result.get("extracted_info", [])
                if extracted:
                    user_content += f"\n\n[현재 파악된 정보: {', '.join(extracted)}]"
            
            human_message = HumanMessage(content=user_content)
            self.state["messages"] = [human_message]
            
            # 워크플로우 실행 - recursion_limit 증가
            config = {"recursion_limit": 5}  # 줄여서 빠른 종료
            result = self.workflow.invoke(self.state, config=config)
            
            # 상태 업데이트
            self.state.update(result)
            
            # 응답 메시지 추출
            response_content = "처리 중입니다..."
            if result.get("messages"):
                last_message = result["messages"][-1]
                if hasattr(last_message, 'content') and last_message.content:
                    response_content = last_message.content
                    
                    # 도구 실행 결과 추가
                    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                        tool_info = self._format_tool_results(result.get("messages", []))
                        if tool_info:
                            response_content += f"\n\n{tool_info}"
            
            # 히스토리 업데이트
            history.append([message, response_content])
            
            return history, ""
            
        except Exception as e:
            logger.error(f"채팅 처리 오류: {str(e)}")
            error_msg = f"죄송합니다. 오류가 발생했습니다: {str(e)}\n다시 시도해주세요."
            history.append([message, error_msg])
            return history, ""
    
    def _format_tool_results(self, messages: List) -> str:
        """도구 실행 결과 포맷팅"""
        results = []
        
        for message in messages:
            if hasattr(message, 'name') and hasattr(message, 'content'):
                try:
                    content = json.loads(message.content) if message.content.startswith('{') else {}
                    if content.get("message"):
                        results.append(content["message"])
                except:
                    pass
        
        return "\n".join(results) if results else ""
    
    def get_current_status(self) -> Dict:
        """현재 상태 정보"""
        collected = self.state.get("collected_fields", [])
        progress = len(collected) / 6 * 100  # 총 6단계
        
        return {
            "progress": f"{progress:.0f}%",
            "company_name": self.state.get("company_name", ""),
            "position": self.state.get("position", ""),
            "resume_analyzed": bool(self.state.get("resume_content")),
            "interview_settings": bool(self.state.get("interview_type")),
            "questions_generated": bool(self.state.get("generated_questions")),
            "is_complete": self.state.get("is_complete", False),
            "collected_fields": collected
        }
    
    def get_download_files(self) -> List[str]:
        """다운로드 파일 목록"""
        return self.state.get("generated_files", [])
    
    def create_interface(self):
        """Gradio 인터페이스 생성"""
        
        with gr.Blocks(
            title="LangGraph 기반 개인 맞춤형 면접 질문 생성기",
            theme=gr.themes.Soft(),
            css="""
            .status-panel { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin: 10px 0;
            }
            .chat-container { 
                max-height: 600px;
                overflow-y: auto;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
            }
            .feature-box {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                margin: 10px 0;
            }
            """
        ) as demo:
            
            gr.Markdown("""
            # 🎯 LangGraph 기반 개인 맞춤형 면접 질문 생성기
            
            **personal_question_maker.py의 모든 기능을 대화형으로 구현**
            
            ✨ **Enhanced Features:**
            - 🤖 **자연스러운 대화**: 단계별 정보 수집과 맞춤 안내
            - 📋 **상세 프로필 분석**: 20+ 개인 정보 필드 자동 추출
            - 🎯 **스마트 추천**: 직무별 면접 유형 및 난이도 자동 추천
            - 🌐 **회사 정보 수집**: 웹사이트 크롤링으로 맞춤 질문 생성
            - 🔄 **상태 기반 워크플로우**: 진행 상황 실시간 추적
            - 💡 **면접 팁 제공**: 유형별/직무별 상세 준비 가이드
            """)
            
            with gr.Row():
                with gr.Column(scale=2):
                    # 메인 채팅 인터페이스
                    chatbot = gr.Chatbot(
                        value=[[None, """안녕하세요! 개인 맞춤형 면접 질문 생성기입니다 🎯

저는 당신의 상세한 프로필을 바탕으로 완전히 개인화된 면접 질문을 생성해드립니다.

**🚀 준비된 기능들:**
- 📋 20+ 개인 프로필 필드 자동 분석
- 🌐 회사 웹사이트 정보 수집
- 🎯 직무별 면접 유형 자동 추천  
- ⚙️ 난이도 및 질문 개수 맞춤 설정
- 💡 면접 유형별 준비 팁 제공

어떤 회사에 지원하시나요? 회사명과 지원 직무를 알려주세요!"""]],
                        label="🎯 면접 준비 대화",
                        height=500,
                        elem_classes=["chat-container"]
                    )
                    
                    with gr.Row():
                        msg = gr.Textbox(
                            label="💬 메시지",
                            placeholder="자연스럽게 대화하세요... (예: 카카오 프론트엔드 개발자로 지원합니다)",
                            scale=3
                        )
                        file_upload = gr.File(
                            label="📁 이력서 업로드",
                            file_types=[".pdf", ".docx", ".txt"],
                            scale=1
                        )
                    
                    with gr.Row():
                        send_btn = gr.Button("📤 전송", variant="primary", scale=2)
                        clear_btn = gr.Button("🔄 새로 시작", scale=1)
                
                with gr.Column(scale=1):
                    # 진행 상황 패널
                    gr.Markdown("### 📊 진행 상황", elem_classes=["status-panel"])
                    
                    status_display = gr.JSON(
                        label="현재 상태",
                        value={
                            "progress": "0%",
                            "company_name": "미입력",
                            "position": "미입력", 
                            "resume_analyzed": False,
                            "interview_settings": False,
                            "questions_generated": False,
                            "is_complete": False
                        }
                    )
                    
                    # 다운로드 섹션
                    gr.Markdown("### 📥 결과 다운로드")
                    download_btn = gr.DownloadButton(
                        "📄 면접 질문 다운로드",
                        visible=False,
                        variant="secondary"
                    )
                    
                    download_status = gr.Markdown(
                        "**진행 단계:**\n1. ✅ 기본 정보 입력\n2. ⏳ 이력서 분석\n3. ⏳ 설정 확정\n4. ⏳ 질문 생성\n5. ⏳ 파일 저장",
                        elem_classes=["feature-box"]
                    )
            
            # 기능 설명
            with gr.Accordion("🔧 상세 기능 안내", open=False):
                gr.Markdown("""
                ### 🎯 수집되는 개인 프로필 정보
                
                **📚 학력 정보**
                - 최종 학력, 전공, 학점
                
                **🏆 역량 정보**  
                - 자격증, 어학 능력, 기술 스택, 성격 유형
                
                **💼 경험 정보**
                - 프로젝트 규모, 리더십 경험, 도메인 경험
                
                **🌐 온라인 활동**
                - 포트폴리오 링크, 블로그 활동, SNS 활동, 오픈소스 기여
                
                **🏅 성과 기록**
                - 수상 경력, 대회 참여, 발표/출간 경력
                
                **🎯 지원 동기**
                - 지원 경로, 우선순위 가치, 커리어 목표, 업무 스타일
                
                ### 🤖 스마트 추천 시스템
                
                **직무별 면접 유형 자동 추천:**
                - 🖥️ **개발직** → 기술면접 (기술 역량 중심)
                - 📋 **기획직** → 종합면접 (논리적 사고 중심)
                - 📈 **마케팅직** → 인성면접 (창의성 중심)
                - 🎨 **디자인직** → 기술면접 (포트폴리오 중심)
                - 📊 **데이터직** → 기술면접 (분석 능력 중심)
                
                **경력별 난이도 자동 조정:**
                - 👨‍🎓 **신입** → 초급 난이도, 10-12개 질문
                - 👩‍💼 **경력** → 중급 난이도, 15-18개 질문  
                - 👨‍💼 **시니어** → 고급 난이도, 18-22개 질문
                
                ### 📋 질문 생성 특징
                
                - **🎯 완전 개인화**: 이력서 내용을 구체적으로 언급
                - **🏢 회사 맞춤**: 웹사이트에서 수집한 회사 문화 반영
                - **⚙️ 유형별 특화**: 면접 유형에 따른 평가 요소 집중
                - **📊 난이도 조절**: 경력과 직무에 맞는 질문 복잡도
                - **💡 준비 팁**: 각 질문별 평가 의도와 답변 가이드
                
                ### 🌟 personal_question_maker.py 대비 개선점
                
                1. **🤖 자연스러운 대화**: 복잡한 UI 대신 편리한 채팅
                2. **🔄 지능적 워크플로우**: 단계별 자동 진행 및 안내
                3. **📊 실시간 상태 확인**: 진행 상황과 수집된 정보 시각화
                4. **🛠️ 스마트 도구 선택**: 상황에 맞는 도구 자동 실행
                5. **🎯 개인화 강화**: 더 풍부한 프로필 데이터 활용
                """)
            
            # 사용 예시
            with gr.Accordion("💬 대화 예시", open=False):
                gr.Markdown("""
                ### 🗣️ 실제 대화 흐름 예시
                
                **👤 사용자**: "안녕하세요! 네이버 프론트엔드 개발자로 지원하는데 기술면접 준비하고 싶어요"
                
                **🤖 AI**: "네이버 프론트엔드 개발자 지원을 축하드립니다! 🎉 기술면접 준비를 도와드리겠습니다.
                
                네이버 웹사이트도 확인해서 회사 정보를 반영하겠습니다. 이력서 파일을 업로드해주시거나, 간단한 경력사항을 먼저 알려주세요."
                
                **👤 사용자**: [이력서 PDF 업로드]
                
                **🤖 AI**: "📋 이력서 분석이 완료되었습니다!
                
                **추출된 정보:**
                - 경력: React 3년 경험 경력직
                - 기술스택: React, TypeScript, Next.js, AWS
                - 프로젝트: 대규모 팀 프로젝트 경험
                - 포트폴리오: GitHub 활발한 활동
                
                개발직에 최적화된 **기술면접 (중급, 15개)** 를 추천합니다. 이 설정으로 진행하시겠어요?"
                
                **👤 사용자**: "네, 좋습니다!"
                
                **🤖 AI**: "⚙️ 면접 설정이 확정되었습니다!
                
                추가로 커리어 목표나 선호하는 업무 스타일을 알려주시면 더 개인화된 질문을 만들 수 있어요. 바로 질문 생성을 원하시면 '질문 생성해주세요'라고 말씀해주세요."
                
                **👤 사용자**: "사용자 경험을 중시하고 팀과 협업을 좋아해요. 5년 후엔 프론트엔드 리드가 되고 싶습니다."
                
                **🤖 AI**: "✅ 추가 정보가 저장되었습니다!
                
                🎯 **개인 맞춤형 면접 질문이 생성되었습니다!**
                
                **질문 미리보기:**
                1. 귀하의 GitHub을 보니 TypeScript 마이그레이션 프로젝트가 인상적입니다. 기존 JavaScript 코드베이스를 TypeScript로 전환하면서 겪은 주요 도전과제와 해결 방법을 설명해주세요.
                
                2. 네이버의 사용자 중심 서비스 철학에 대해 어떻게 생각하시며, 프론트엔드 개발자로서 사용자 경험 향상을 위해 어떤 기술적 고려사항이 중요하다고 보시나요?
                
                (총 15개 질문과 상세한 준비 팁이 포함된 파일을 다운로드하세요!)
                
                💾 파일이 저장되었습니다: 기술면접_네이버_프론트엔드개발자_20241208_143022.txt"
                
                ### 🎯 핵심 특징
                
                1. **🔄 단계별 자동 진행**: 사용자가 복잡한 설정을 몰라도 AI가 알아서 진행
                2. **📋 지능적 정보 추출**: 이력서에서 20+ 필드 자동 분석
                3. **🎯 스마트 추천**: 직무와 경력에 맞는 최적 설정 제안
                4. **💬 자연스러운 대화**: 마치 전문 컨설턴트와 대화하는 느낌
                5. **🌐 회사 맞춤**: 실제 회사 웹사이트 정보 반영
                6. **💡 상세한 가이드**: 각 질문별 평가 의도와 준비 팁
                """)
            
            # 이벤트 핸들러
            def send_message(message, history, files):
                new_history, _ = self.chat(message, history, files)
                status = self.get_current_status()
                
                # 다운로드 파일 확인
                download_files = self.get_download_files()
                download_file = download_files[0] if download_files else None
                
                # 진행 상황 메시지 업데이트
                steps = [
                    "1. ✅ 기본 정보 입력" if status["company_name"] else "1. ⏳ 기본 정보 입력",
                    "2. ✅ 이력서 분석" if status["resume_analyzed"] else "2. ⏳ 이력서 분석", 
                    "3. ✅ 설정 확정" if status["interview_settings"] else "3. ⏳ 설정 확정",
                    "4. ✅ 질문 생성" if status["questions_generated"] else "4. ⏳ 질문 생성",
                    "5. ✅ 완료!" if status["is_complete"] else "5. ⏳ 파일 저장"
                ]
                
                progress_msg = f"**진행률: {status['progress']}**\n\n" + "\n".join(steps)
                
                if status["is_complete"]:
                    progress_msg += "\n\n🎉 **모든 단계가 완료되었습니다!**\n📥 위 버튼으로 파일을 다운로드하세요."
                
                return (
                    new_history, "", status,
                    gr.update(value=download_file, visible=bool(download_file)),
                    progress_msg
                )
            
            def clear_chat():
                self.reset_conversation()
                return (
                    [[None, """안녕하세요! 개인 맞춤형 면접 질문 생성기입니다 🎯

저는 당신의 상세한 프로필을 바탕으로 완전히 개인화된 면접 질문을 생성해드립니다.

**🚀 준비된 기능들:**
- 📋 20+ 개인 프로필 필드 자동 분석
- 🌐 회사 웹사이트 정보 수집
- 🎯 직무별 면접 유형 자동 추천  
- ⚙️ 난이도 및 질문 개수 맞춤 설정
- 💡 면접 유형별 준비 팁 제공

어떤 회사에 지원하시나요? 회사명과 지원 직무를 알려주세요!"""]],
                    "",
                    {
                        "progress": "0%",
                        "company_name": "미입력",
                        "position": "미입력",
                        "resume_analyzed": False,
                        "interview_settings": False,
                        "questions_generated": False,
                        "is_complete": False
                    },
                    gr.update(visible=False),
                    "**진행률: 0%**\n\n1. ⏳ 기본 정보 입력\n2. ⏳ 이력서 분석\n3. ⏳ 설정 확정\n4. ⏳ 질문 생성\n5. ⏳ 파일 저장"
                )
            
            # 이벤트 연결
            send_btn.click(
                send_message,
                [msg, chatbot, file_upload],
                [chatbot, msg, status_display, download_btn, download_status]
            )
            
            msg.submit(
                send_message,
                [msg, chatbot, file_upload],
                [chatbot, msg, status_display, download_btn, download_status]
            )
            
            clear_btn.click(
                clear_chat,
                outputs=[chatbot, msg, status_display, download_btn, download_status]
            )
            
            # 하단 정보
            gr.Markdown("""
            ---
            ### 🚀 LangGraph 워크플로우 아키텍처
            
            ```
            👤 사용자 입력 → 🤖 대화 라우터 → 🛠️ 도구 실행 → 📊 상태 업데이트 → 💬 응답 생성
                    ↓             ↓              ↓             ↓              ↓
                메시지 분석    적절한 도구 선택   정보 수집/처리   프로필 업데이트   다음 단계 안내
            ```
            
            **📋 사용 가능한 도구들:**
            - `collect_basic_info`: 회사명, 직무, 웹사이트 수집
            - `process_resume_file`: 이력서 파일 분석 및 정보 추출
            - `suggest_interview_settings`: 직무별 최적 설정 추천
            - `collect_additional_info`: 추가 개인 정보 수집
            - `set_interview_preferences`: 최종 면접 설정 확정
            - `generate_personalized_questions`: 개인 맞춤형 질문 생성
            - `save_questions_to_file`: 결과 파일 저장
            
            **🎯 기존 대비 주요 개선사항:**
            1. **복잡한 5탭 UI → 간단한 채팅 인터페이스**
            2. **수동 정보 입력 → 자동 분석 및 추천**
            3. **정적 설정 → 동적 워크플로우 관리**
            4. **단계별 수동 진행 → AI 가이드 자동 진행**
            5. **기본 개인화 → 심화 개인화 (20+ 필드)**
            
            💡 **Tip**: 자연스럽게 대화하세요! AI가 알아서 필요한 정보를 수집하고 최적의 질문을 생성합니다.
            """)
        
        return demo


def main():
    """메인 실행 함수"""
    try:
        print("🚀 LangGraph 기반 개인 맞춤형 면접 질문 생성기 시작...")
        
        # 환경 설정 확인
        if not os.getenv("OPENAI_API_KEY"):
            print("❌ OPENAI_API_KEY 환경 변수를 설정해주세요.")
            print("   .env 파일에 OPENAI_API_KEY=your_api_key_here 추가")
            return
        
        # 필요한 라이브러리 확인
        try:
            from langgraph.graph import StateGraph
            from langchain_openai import ChatOpenAI
        except ImportError as e:
            print(f"❌ 필수 라이브러리 누락: {str(e)}")
            print("pip install langgraph langchain-openai pdfplumber python-docx requests beautifulsoup4 를 실행해주세요.")
            return
        
        # 다운로드 디렉토리 생성
        temp_dir = Path("temp_downloads")
        temp_dir.mkdir(exist_ok=True)
        print(f"📁 다운로드 디렉토리: {temp_dir.absolute()}")
        
        # 인터페이스 생성 및 실행
        print("🔄 강화된 LangGraph 워크플로우 초기화 중...")
        generator = EnhancedLangGraphInterviewGenerator()
        demo = generator.create_interface()
        
        print("🌐 서버 시작 중...")
        print("💡 브라우저에서 http://127.0.0.1:7860 을 열어주세요.")
        
        demo.launch(
            share=False,
            debug=True,
            server_name="127.0.0.1",
            server_port=7860,
            show_error=True
        )
        
    except ImportError as e:
        print(f"❌ 라이브러리 누락: {str(e)}")
        print("다음 명령어로 필요한 라이브러리를 설치해주세요:")
        print("pip install langgraph langchain-openai pdfplumber python-docx requests beautifulsoup4 python-dotenv gradio")
    except ValueError as e:
        print(f"❌ 설정 오류: {str(e)}")
    except Exception as e:
        print(f"❌ 시작 오류: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()