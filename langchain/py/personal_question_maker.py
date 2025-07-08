"""
고도화된 개인 맞춤형 면접 질문 생성기
더 많은 개인 정보를 활용한 정밀한 질문 생성
+ 면접 유형별 질문 (기술/인성/임원)
+ 질문 난이도 조절
+ 질문 개수 조절
+ 전 직무 지원 (개발/비개발)
"""

import os
from typing import Optional, Tuple, List, Dict
from dataclasses import dataclass
import gradio as gr
from datetime import datetime

# 기존 imports 추가
import pdfplumber
import docx
import requests
from bs4 import BeautifulSoup
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()


class DocumentProcessor:
    """문서 처리 클래스"""
    
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
    def extract_text_from_uploaded_file(uploaded_file) -> str:
        """업로드된 파일에서 텍스트 추출"""
        if uploaded_file is None:
            raise ValueError("파일이 업로드되지 않았습니다.")
        
        # Gradio 파일 객체에서 경로 추출
        if hasattr(uploaded_file, 'name'):
            file_path = uploaded_file.name
        else:
            file_path = str(uploaded_file)
        
        # Windows 경로 정규화
        file_path = os.path.normpath(file_path)
        
        print(f"📄 처리할 파일: {file_path}")
        print(f"📂 파일 존재 여부: {os.path.exists(file_path)}")
        
        # 파일이 존재하지 않으면 에러
        if not os.path.exists(file_path):
            raise ValueError(f"업로드된 파일을 찾을 수 없습니다: {file_path}")
        
        # 파일 확장자로 처리 방법 결정
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
                raise ValueError(f"지원되지 않는 파일 형식: {file_extension}. PDF, DOCX, TXT만 지원됩니다.")
            
            if not text.strip():
                raise ValueError("파일에서 텍스트를 추출할 수 없습니다.")
            
            print(f"✅ 텍스트 추출 완료: {len(text)} 문자")
            return text
            
        except Exception as e:
            print(f"❌ 파일 처리 중 오류: {str(e)}")
            raise e


class SimpleWebCrawler:
    """간단한 웹 크롤러 (Selenium 대신 requests 기반)"""
    
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
            
            # 텍스트 추출
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


@dataclass
class PersonalProfile:
    """개인 프로필 정보"""
    # 기본 정보
    education_level: str = ""  # 학력 (고졸/전문학사/학사/석사/박사)
    major: str = ""  # 전공
    gpa: str = ""  # 학점
    
    # 역량 정보
    certificates: str = ""  # 자격증
    language_skills: str = ""  # 어학 능력
    tech_stack: str = ""  # 기술 스택
    personality_type: str = ""  # 성격 유형 (MBTI 등)
    
    # 경험 정보
    project_scale: str = ""  # 프로젝트 규모 (소규모/중규모/대규모)
    leadership_experience: str = ""  # 리더십 경험 (없음/부분/전체)
    domain_experience: str = ""  # 해당 도메인 경험
    
    # 포트폴리오 & 온라인 활동
    portfolio_links: str = ""  # 포트폴리오 링크 (GitHub, 개인 사이트 등)
    blog_activity: str = ""  # 블로그 활동 (기술 블로그, 학습 기록 등)
    sns_activity: str = ""  # SNS 활동 (LinkedIn, Twitter 등)
    open_source: str = ""  # 오픈소스 기여
    
    # 수상 및 성과
    awards: str = ""  # 수상 경력 (해커톤, 공모전, 논문 등)
    competitions: str = ""  # 대회 참여
    publications: str = ""  # 발표/출간 경력
    
    # 지원 동기
    application_source: str = ""  # 지원 경로
    priority_values: str = ""  # 우선순위 가치
    career_goal: str = ""  # 커리어 목표
    work_style: str = ""  # 선호 업무 스타일


@dataclass
class InterviewConfig:
    """면접 설정 정보"""
    interview_type: str = "종합면접"  # 면접 유형
    difficulty_level: str = "중급"   # 난이도
    question_count: int = 15         # 질문 개수


class EnhancedResumeAnalyzer:
    """강화된 이력서 분석기"""
    
    def __init__(self, api_key: str):
        self.llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.1,
            max_tokens=800
        )
    
    def extract_detailed_profile(self, resume_content: str) -> Dict:
        """이력서에서 상세 프로필 정보 추출"""
        template = """
다음 이력서 내용에서 상세한 개인 프로필 정보를 추출해주세요.

이력서 내용:
{resume_content}

다음 형식으로 응답해주세요:
회사명: [찾은 회사명 또는 "없음"]
직무: [찾은 직무명 또는 "없음"]
경력구분: [신입/경력/없음]
학력: [고졸/전문학사/학사/석사/박사 또는 "없음"]
전공: [전공명 또는 "없음"]
학점: [학점 정보 또는 "없음"]
자격증: [보유 자격증들 또는 "없음"]
어학능력: [토익, 토플 등 어학 점수 또는 "없음"]
기술스택: [사용 기술들 또는 "없음"]
프로젝트규모: [소규모/중규모/대규모 또는 "없음"]
리더십경험: [없음/부분/전체]
성격특성: [성격이나 강점 관련 키워드 또는 "없음"]
포트폴리오: [GitHub, 개인사이트, 포트폴리오 링크 또는 "없음"]
블로그활동: [기술블로그, 개발블로그, 학습기록 등 또는 "없음"]
SNS활동: [LinkedIn, Twitter, 개발커뮤니티 활동 등 또는 "없음"]
오픈소스: [GitHub 기여, 오픈소스 프로젝트 참여 등 또는 "없음"]
수상경력: [해커톤, 공모전, 논문, 특허 등 수상 내역 또는 "없음"]
대회참여: [프로그래밍 대회, 창업경진대회 등 또는 "없음"]
발표출간: [논문, 특허, 발표, 출간 경력 등 또는 "없음"]

찾는 기준:
- 명시적으로 기재된 정보만 추출
- URL, 링크, 주소가 있으면 정확히 기재
- 수상명, 대회명, 논문명 등은 구체적으로 기재
- 추측하지 말고 확실한 정보만 기재
- 없는 정보는 "없음"으로 표시
"""
        
        try:
            prompt = ChatPromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            
            result = chain.invoke({"resume_content": resume_content[:4000]})
            
            # 결과 파싱
            profile_data = {}
            mapping = {
                "회사명": "company",
                "직무": "position", 
                "경력구분": "career_level",
                "학력": "education_level",
                "전공": "major",
                "학점": "gpa",
                "자격증": "certificates",
                "어학능력": "language_skills",
                "기술스택": "tech_stack",
                "프로젝트규모": "project_scale",
                "리더십경험": "leadership_experience",
                "성격특성": "personality_type",
                "포트폴리오": "portfolio_links",
                "블로그활동": "blog_activity",
                "SNS활동": "sns_activity",
                "오픈소스": "open_source",
                "수상경력": "awards",
                "대회참여": "competitions",
                "발표출간": "publications"
            }
            
            for line in result.split('\n'):
                for korean, english in mapping.items():
                    if line.startswith(f'{korean}:'):
                        value = line.replace(f'{korean}:', '').strip()
                        profile_data[english] = value if value != "없음" else ""
            
            return profile_data
            
        except Exception as e:
            print(f"이력서 분석 오류: {str(e)}")
            return {}


class PersonalizedInterviewGenerator:
    """개인화된 면접 질문 생성기"""
    
    def __init__(self, api_key: str):
        self.llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=4000
        )
    
    def get_interview_type_prompt(self, interview_type: str, difficulty: str, question_count: int, position: str = "") -> str:
        """면접 유형별 프롬프트 생성 (직무별 세분화 포함)"""
        
        # 직무별 기술면접 세분화
        tech_interview_configs = {
            "프론트엔드": {
                "focus": "프론트엔드 기술 역량과 사용자 경험 구현 능력",
                "categories": [
                    "JavaScript & TypeScript 심화 지식",
                    "React/Vue/Angular 프레임워크 활용",
                    "브라우저 렌더링 및 성능 최적화",
                    "웹 표준, 접근성, SEO",
                    "번들링, 빌드 도구, 배포 전략"
                ]
            },
            "백엔드": {
                "focus": "서버 사이드 기술과 시스템 아키텍처 설계 능력",
                "categories": [
                    "서버 언어 및 프레임워크 활용",
                    "데이터베이스 설계 및 최적화",
                    "API 설계 및 마이크로서비스",
                    "서버 인프라 및 클라우드 아키텍처",
                    "보안, 성능, 확장성 고려사항"
                ]
            },
            "데이터": {
                "focus": "데이터 분석, 머신러닝, 데이터 엔지니어링 전문 기술",
                "categories": [
                    "데이터 분석 및 통계 지식",
                    "머신러닝 및 딥러닝 모델",
                    "데이터 파이프라인 및 ETL",
                    "빅데이터 처리 및 분산 시스템",
                    "데이터 시각화 및 비즈니스 인사이트"
                ]
            },
            "HR": {
                "focus": "인사 관리, 조직 문화, 인재 개발 전문성",
                "categories": [
                    "채용 및 인재 선발 전략",
                    "교육 훈련 및 인재 개발",
                    "성과 관리 및 보상 체계",
                    "조직 문화 및 구성원 관리",
                    "노무 관리 및 HR 트렌드"
                ]
            },
            "영업": {
                "focus": "고객 관계 구축, 매출 달성, 영업 전략 수립",
                "categories": [
                    "고객 발굴 및 관계 관리",
                    "제품/서비스 이해 및 제안",
                    "협상 및 계약 성사 능력",
                    "시장 분석 및 경쟁사 대응",
                    "매출 목표 달성 및 성과 관리"
                ]
            },
            "마케팅": {
                "focus": "브랜드 전략, 고객 분석, 통합 마케팅 커뮤니케이션",
                "categories": [
                    "브랜드 전략 및 포지셔닝",
                    "디지털 마케팅 및 채널 관리",
                    "고객 분석 및 타겟팅",
                    "캠페인 기획 및 실행",
                    "마케팅 성과 측정 및 최적화"
                ]
            },
            "기획": {
                "focus": "전략 수립, 프로젝트 관리, 비즈니스 분석",
                "categories": [
                    "사업 전략 및 기획 수립",
                    "시장 분석 및 사업성 검토",
                    "프로젝트 관리 및 실행",
                    "데이터 분석 및 의사결정 지원",
                    "이해관계자 관리 및 커뮤니케이션"
                ]
            },
            "디자인": {
                "focus": "시각적 표현, 사용자 경험, 크리에이티브 솔루션",
                "categories": [
                    "디자인 컨셉 및 아이디어 발상",
                    "UI/UX 설계 및 사용자 경험",
                    "브랜드 디자인 및 아이덴티티",
                    "디자인 도구 및 프로세스",
                    "트렌드 분석 및 크리에이티브 전략"
                ]
            }
        }
        
        # 일반 면접 유형 설정
        general_configs = {
            "인성면접": {
                "focus": "성격, 가치관, 팀워크 및 소통 능력",
                "categories": [
                    "성격 및 가치관 탐색",
                    "팀워크 및 협업 경험",
                    "갈등 해결 및 소통 능력",
                    "도전 정신 및 성장 마인드",
                    "회사 문화 적합성"
                ]
            },
            "임원면접": {
                "focus": "리더십, 전략적 사고, 회사 비전 이해",
                "categories": [
                    "리더십 및 관리 능력",
                    "전략적 사고 및 비즈니스 센스",
                    "회사 비전 및 미래 계획",
                    "의사결정 및 책임감",
                    "조직 기여 및 장기적 성장"
                ]
            },
            "종합면접": {
                "focus": "기술, 인성, 리더십을 종합적으로 평가",
                "categories": [
                    "기술적 역량 및 경험",
                    "인성 및 팀워크",
                    "성장 가능성 및 학습 능력",
                    "회사 적합성 및 문화 이해",
                    "미래 비전 및 목표"
                ]
            }
        }
        
        # 난이도 설정
        difficulty_config = {
            "초급": {
                "description": "기초적인 개념과 경험 위주",
                "complexity": "단순하고 명확한 질문",
                "examples": "기본 개념 설명, 간단한 경험 공유"
            },
            "중급": {
                "description": "실무 경험과 응용 능력 위주",
                "complexity": "구체적이고 실용적인 질문",
                "examples": "프로젝트 상세 설명, 문제 해결 과정"
            },
            "고급": {
                "description": "깊이 있는 사고와 전문성 위주",
                "complexity": "복합적이고 전략적인 질문",
                "examples": "아키텍처 설계, 비즈니스 전략, 리더십"
            }
        }
        
        # 면접 유형에 따른 설정 선택
        if interview_type == "기술면접":
            # 직무별 키워드 매칭
            position_lower = position.lower()
            if any(keyword in position_lower for keyword in ["프론트", "frontend", "fe", "react", "vue"]):
                config = tech_interview_configs["프론트엔드"]
            elif any(keyword in position_lower for keyword in ["백엔드", "backend", "be", "서버", "api"]):
                config = tech_interview_configs["백엔드"]
            elif any(keyword in position_lower for keyword in ["데이터", "data", "ml", "ai", "분석"]):
                config = tech_interview_configs["데이터"]
            elif any(keyword in position_lower for keyword in ["hr", "인사", "채용"]):
                config = tech_interview_configs["HR"]
            elif any(keyword in position_lower for keyword in ["영업", "sales", "세일즈"]):
                config = tech_interview_configs["영업"]
            elif any(keyword in position_lower for keyword in ["마케팅", "marketing", "브랜드"]):
                config = tech_interview_configs["마케팅"]
            elif any(keyword in position_lower for keyword in ["기획", "planning", "전략"]):
                config = tech_interview_configs["기획"]
            elif any(keyword in position_lower for keyword in ["디자인", "design", "ui", "ux"]):
                config = tech_interview_configs["디자인"]
            else:
                # 기본 기술면접
                config = {
                    "focus": "기술적 역량과 문제해결 능력",
                    "categories": [
                        "기술 기초 지식",
                        "실무 경험 및 프로젝트",
                        "문제 해결 능력",
                        "학습 능력 및 성장 마인드",
                        "기술 트렌드 이해"
                    ]
                }
        else:
            config = general_configs.get(interview_type, general_configs["종합면접"])
        
        diff_config = difficulty_config.get(difficulty, difficulty_config["중급"])
        
        return f"""
## 🎯 면접 유형: {interview_type}
**중점 평가 영역**: {config['focus']}
**난이도**: {difficulty} - {diff_config['description']}
**질문 개수**: {question_count}개

### 📋 질문 카테고리 분배
{chr(10).join([f"- {cat}" for cat in config['categories']])}

### 🎚️ 난이도 가이드라인
- **복잡도**: {diff_config['complexity']}
- **예시 유형**: {diff_config['examples']}

### 📊 질문 분배 가이드
총 {question_count}개 질문을 다음과 같이 분배하여 생성:
{chr(10).join([f"- {cat}: {question_count//len(config['categories'])}개 내외" for cat in config['categories']])}
"""
    
    def generate_personalized_questions(self, profile: PersonalProfile, 
                                      company_name: str, position: str, 
                                      career_level: str, resume_content: str,
                                      config: InterviewConfig,
                                      company_website_info: str = "") -> str:
        """개인 프로필 기반 맞춤형 질문 생성"""
        
        # 면접 유형별 설정 가져오기
        type_prompt = self.get_interview_type_prompt(
            config.interview_type, 
            config.difficulty_level, 
            config.question_count,
            position
        )
        
        template = """
당신은 {company_name}의 면접관입니다. 다음 지원자의 상세 프로필을 바탕으로 
매우 개인화된 면접 질문을 생성해야 합니다.

{type_config}

[지원자 기본 정보]
- 회사: {company_name}
- 직무: {position}
- 경력구분: {career_level}

[회사 웹사이트 정보]
{company_website_info}

[지원자 상세 프로필]
- 학력: {education_level}
- 전공: {major}
- 학점: {gpa}
- 자격증: {certificates}
- 어학능력: {language_skills}
- 기술스택: {tech_stack}
- 성격유형: {personality_type}
- 프로젝트규모: {project_scale}
- 리더십경험: {leadership_experience}
- 포트폴리오: {portfolio_links}
- 블로그활동: {blog_activity}
- SNS활동: {sns_activity}
- 오픈소스기여: {open_source}
- 수상경력: {awards}
- 대회참여: {competitions}
- 발표출간: {publications}
- 지원경로: {application_source}
- 우선순위: {priority_values}
- 커리어목표: {career_goal}
- 업무스타일: {work_style}

[이력서 내용]
{resume_content}

위 면접 유형 설정과 개인 프로필을 최대한 활용하여 다음과 같이 매우 구체적이고 개인화된 질문을 생성해주세요:

### 질문 생성 원칙
1. **개인화**: 지원자의 구체적인 경험과 정보를 질문에 포함
2. **유형 특화**: {interview_type} 면접의 핵심 평가 요소에 집중
3. **난이도 조절**: {difficulty_level} 수준에 맞는 질문 복잡도
4. **회사 맞춤**: 회사 정보를 활용한 맞춤형 질문
5. **균형 배분**: 각 카테고리별로 균등하게 분배

### 질문 형식
각 질문마다 다음 정보를 포함:
- **[카테고리명]** 질문 내용
- *예상 의도: 무엇을 평가하려는 질문인지*
- *개인화 포인트: 어떤 개인 정보를 활용했는지*

주의사항:
- 빈 정보("")는 사용하지 말고, 있는 정보만 활용
- 각 질문에 구체적인 개인 정보를 포함시켜 개인화된 느낌이 나도록 구성
- 회사 웹사이트 정보가 있다면 적극 활용하여 회사 맞춤형 질문 생성
- "귀하의 GitHub에서 확인한 XX 프로젝트를 보니...", "우리 회사의 YY 가치관에 대해..." 등의 방식 활용

총 {question_count}개의 매우 개인적이고 면접 유형에 특화된 질문을 생성해주세요.
"""

        try:
            prompt_template = ChatPromptTemplate.from_template(template)
            chain = prompt_template | self.llm | StrOutputParser()
            
            result = chain.invoke({
                "type_config": type_prompt,
                "interview_type": config.interview_type,
                "difficulty_level": config.difficulty_level,
                "question_count": config.question_count,
                "company_name": company_name,
                "position": position,
                "career_level": career_level,
                "company_website_info": company_website_info or "회사 웹사이트 정보 없음",
                "education_level": profile.education_level,
                "major": profile.major,
                "gpa": profile.gpa,
                "certificates": profile.certificates,
                "language_skills": profile.language_skills,
                "tech_stack": profile.tech_stack,
                "personality_type": profile.personality_type,
                "project_scale": profile.project_scale,
                "leadership_experience": profile.leadership_experience,
                "portfolio_links": profile.portfolio_links,
                "blog_activity": profile.blog_activity,
                "sns_activity": profile.sns_activity,
                "open_source": profile.open_source,
                "awards": profile.awards,
                "competitions": profile.competitions,
                "publications": profile.publications,
                "application_source": profile.application_source,
                "priority_values": profile.priority_values,
                "career_goal": profile.career_goal,
                "work_style": profile.work_style,
                "resume_content": resume_content
            })
            
            return result
            
        except Exception as e:
            raise Exception(f"개인화 질문 생성 오류: {str(e)}")


class EnhancedInterviewInterface:
    """강화된 면접 질문 생성 인터페이스"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 환경 변수를 설정해주세요.")
        
        self.analyzer = EnhancedResumeAnalyzer(self.api_key)
        self.generator = PersonalizedInterviewGenerator(self.api_key)
        self.crawler = SimpleWebCrawler()
    
    def create_enhanced_interface(self):
        """강화된 인터페이스 생성"""
        with gr.Blocks(title="개인 맞춤형 AI 면접 질문 생성기", theme=gr.themes.Soft()) as demo:
            gr.Markdown("""
            # 🎯 개인 맞춤형 AI 면접 질문 생성기
            
            개인의 상세 프로필을 바탕으로 완전히 개인화된 면접 질문을 생성합니다.
            ⭐ **NEW**: 면접 유형별 질문 / 난이도 조절 / 질문 개수 조절 / 전 직무 지원
            """)
            
            with gr.Tabs():
                # 탭 1: 자동 분석
                with gr.TabItem("📄 자동 분석"):
                    with gr.Row():
                        with gr.Column():
                            resume_file = gr.File(
                                label="이력서 업로드",
                                file_types=[".pdf", ".docx", ".txt"]
                            )
                            
                            analyze_btn = gr.Button("🔍 상세 분석하기", variant="primary")
                            
                            gr.Markdown("""
                            ### 💡 자동 분석 안내
                            - 이력서를 업로드하고 '상세 분석하기'를 클릭하세요
                            - 추출된 정보가 자동으로 다른 탭의 입력 필드에 채워집니다
                            - 추출되지 않은 정보는 직접 수정/추가할 수 있습니다
                            """)
                            
                        with gr.Column():
                            analysis_output = gr.JSON(
                                label="추출된 프로필 정보",
                                visible=False
                            )
                
                # 탭 2: 기본 정보 입력
                with gr.TabItem("✏️ 기본 정보 입력"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### 기본 정보")
                            company_name = gr.Textbox(label="🏢 회사명")
                            position = gr.Textbox(label="💼 지원 직무")
                            career_level = gr.Dropdown(
                                label="👔 경력 구분",
                                choices=["신입", "경력", "구분없음"],
                                value="구분없음"
                            )
                            
                            gr.Markdown("### 학력 정보")
                            education_level = gr.Dropdown(
                                label="🎓 최종 학력",
                                choices=["고등학교", "전문학사", "학사", "석사", "박사"],
                                value="학사"
                            )
                            major = gr.Textbox(label="📚 전공")
                            gpa = gr.Textbox(label="📊 학점 (선택)", placeholder="예: 3.8/4.5")
                            
                            gr.Markdown("### 회사 정보")
                            website_url = gr.Textbox(
                                label="🌐 회사 웹사이트 URL",
                                placeholder="https://www.company.com",
                                info="회사 인재상과 가치관 분석을 위해 입력하세요"
                            )
                            enable_crawling = gr.Checkbox(
                                label="웹사이트 크롤링 활성화",
                                value=True,
                                info="회사 웹사이트에서 인재상과 가치관 정보를 자동 수집합니다"
                            )
                            
                        with gr.Column():
                            gr.Markdown("### 역량 정보")
                            certificates = gr.Textbox(
                                label="🏆 자격증",
                                placeholder="예: 정보처리기사, AWS SAA, 토익 900점",
                                lines=2
                            )
                            tech_stack = gr.Textbox(
                                label="💻 기술 스택",
                                placeholder="예: Python, React, AWS, Docker",
                                lines=2
                            )
                            language_skills = gr.Textbox(
                                label="🌍 어학 능력",
                                placeholder="예: 토익 850점, 회화 가능"
                            )
                            personality_type = gr.Textbox(
                                label="🧠 성격 유형",
                                placeholder="예: ENFP, 적극적, 분석적"
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### 경험 정보")
                            project_scale = gr.Dropdown(
                                label="📈 주요 프로젝트 규모",
                                choices=["개인 프로젝트", "소규모 팀(2-5명)", "중규모 팀(6-15명)", "대규모 팀(16명+)"],
                                value="소규모 팀(2-5명)"
                            )
                            leadership_experience = gr.Dropdown(
                                label="👑 리더십 경험",
                                choices=["없음", "부분적 리더 역할", "팀 리더", "프로젝트 매니저"],
                                value="없음"
                            )
                            
                        with gr.Column():
                            gr.Markdown("### 지원 동기")
                            application_source = gr.Dropdown(
                                label="📢 지원 경로",
                                choices=["채용공고", "지인 추천", "헤드헌팅", "회사 관심", "기타"],
                                value="채용공고"
                            )
                            priority_values = gr.CheckboxGroup(
                                label="💎 우선순위 가치",
                                choices=["높은 연봉", "업무 성장", "워라밸", "회사 안정성", "기술 도전", "팀 분위기"],
                                value=["업무 성장"]
                            )
                            career_goal = gr.Textbox(
                                label="🎯 5년 후 목표",
                                placeholder="예: 시니어 개발자, 팀 리더, 기술 전문가"
                            )
                            work_style = gr.Dropdown(
                                label="⚙️ 선호 업무 스타일",
                                choices=["혼자 집중", "팀 협업", "리더십 발휘", "멘토링", "탐구적 연구"],
                                value="팀 협업"
                            )
                
                # 탭 3: 포트폴리오 & 온라인 활동
                with gr.TabItem("🌐 포트폴리오 & 온라인 활동"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### 포트폴리오 & 프로젝트")
                            portfolio_links = gr.Textbox(
                                label="🔗 포트폴리오 링크",
                                placeholder="GitHub: https://github.com/username\n개인사이트: https://mysite.com",
                                lines=3
                            )
                            blog_activity = gr.Textbox(
                                label="📝 블로그 활동",
                                placeholder="기술 블로그: https://blog.com\n주요 포스트: React 성능 최적화, AWS 배포 경험",
                                lines=3
                            )
                            open_source = gr.Textbox(
                                label="🔧 오픈소스 기여",
                                placeholder="React 라이브러리 버그 수정\nVue.js 공식 문서 번역 참여",
                                lines=2
                            )
                            
                        with gr.Column():
                            gr.Markdown("### SNS & 커뮤니티 활동")
                            sns_activity = gr.Textbox(
                                label="📱 SNS 활동",
                                placeholder="LinkedIn: 기술 아티클 공유\nTwitter: 개발 트렌드 토론 참여",
                                lines=3
                            )
                            
                            gr.Markdown("### 수상 & 성과")
                            awards = gr.Textbox(
                                label="🏆 수상 경력",
                                placeholder="2023 해커톤 우승\n대학 프로그래밍 경진대회 2위\n졸업 작품 최우수상",
                                lines=3
                            )
                            competitions = gr.Textbox(
                                label="🎯 대회 참여",
                                placeholder="삼성 SW 역량테스트 A급\nGoogle Code Jam 본선 진출",
                                lines=2
                            )
                            publications = gr.Textbox(
                                label="📚 발표/출간",
                                placeholder="학회 논문: 'AI 기반 추천 시스템'\n컨퍼런스 발표: 'React 최적화 기법'",
                                lines=2
                            )
                
                # 탭 4: 면접 설정
                with gr.TabItem("⚙️ 면접 설정"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### 🎯 면접 유형 선택")
                            interview_type = gr.Radio(
                                label="면접 유형",
                                choices=["기술면접", "인성면접", "임원면접", "종합면접"],
                                value="종합면접",
                                info="면접 유형에 따라 질문의 초점과 평가 기준이 달라집니다"
                            )
                            
                            gr.Markdown("""
                            #### 📋 면접 유형 설명
                            - **기술면접**: 직무별 전문 지식과 실무 능력 중심
                            - **인성면접**: 성격, 가치관, 팀워크, 소통 능력 중심  
                            - **임원면접**: 리더십, 전략적 사고, 비전, 의사결정 중심
                            - **종합면접**: 기술, 인성, 리더십을 종합적으로 평가
                            """)
                            
                        with gr.Column():
                            gr.Markdown("### 🎚️ 난이도 & 개수 설정")
                            difficulty_level = gr.Radio(
                                label="질문 난이도",
                                choices=["초급", "중급", "고급"],
                                value="중급",
                                info="지원자의 경력과 직무 수준에 맞는 난이도를 선택하세요"
                            )
                            
                            question_count = gr.Slider(
                                label="질문 개수",
                                minimum=5,
                                maximum=30,
                                value=15,
                                step=1,
                                info="생성할 질문의 개수를 선택하세요"
                            )
                            
                            gr.Markdown("""
                            #### 🎚️ 난이도 가이드
                            - **초급**: 기초 개념, 간단한 경험 위주
                            - **중급**: 실무 경험, 구체적 프로젝트 위주  
                            - **고급**: 깊이 있는 사고, 전문성, 전략적 질문
                            """)
                
                # 탭 5: 질문 생성
                with gr.TabItem("🚀 질문 생성"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### 🎯 설정 요약")
                            config_summary = gr.Markdown(
                                value="면접 설정을 선택하고 정보를 입력한 후 질문을 생성해주세요.",
                                elem_id="config_summary"
                            )
                        
                        with gr.Column():
                            generate_btn = gr.Button("🎯 개인 맞춤 질문 생성", variant="primary", size="lg")
                    
                    output = gr.Markdown(
                        value="위에서 정보를 입력한 후 질문을 생성해주세요.",
                        height=600
                    )
                    
                    download_info = gr.Textbox(
                        label="📁 파일 저장 정보",
                        visible=False,
                        interactive=False
                    )
            
            # 설정 요약 업데이트 함수
            def update_config_summary(interview_type, difficulty, question_count, company, position):
                summary = f"""
#### 현재 설정
- **회사**: {company or '입력 필요'}
- **직무**: {position or '입력 필요'}  
- **면접 유형**: {interview_type}
- **난이도**: {difficulty}
- **질문 개수**: {question_count}개

💡 설정을 변경하려면 위의 탭에서 수정하세요.
"""
                return summary
            
            # 이벤트 핸들러
            def analyze_resume_detailed(file):
                if file is None:
                    return (
                        gr.update(visible=False),  # analysis_output
                        "",  # company_name
                        "",  # position
                        "구분없음",  # career_level
                        "학사",  # education_level
                        "",  # major
                        "",  # gpa
                        "",  # certificates
                        "",  # tech_stack
                        "",  # language_skills
                        "",  # personality_type
                        "소규모 팀(2-5명)",  # project_scale
                        "없음",  # leadership_experience
                        "",  # portfolio_links
                        "",  # blog_activity
                        "",  # sns_activity
                        "",  # open_source
                        "",  # awards
                        "",  # competitions
                        ""   # publications
                    )
                
                try:
                    # 파일 내용 추출
                    content = DocumentProcessor.extract_text_from_uploaded_file(file)
                    
                    # 상세 분석
                    profile_data = self.analyzer.extract_detailed_profile(content)
                    
                    # 추출된 정보를 각 필드에 맞게 변환
                    def get_value(key, default=""):
                        return profile_data.get(key, "") or default
                    
                    # 경력구분 매핑
                    career_mapping = {
                        "신입": "신입",
                        "경력": "경력", 
                        "": "구분없음"
                    }
                    career_level = career_mapping.get(get_value("career_level"), "구분없음")
                    
                    # 학력 매핑
                    education_mapping = {
                        "고졸": "고등학교",
                        "전문학사": "전문학사",
                        "학사": "학사",
                        "석사": "석사", 
                        "박사": "박사",
                        "": "학사"
                    }
                    education_level = education_mapping.get(get_value("education_level"), "학사")
                    
                    # 프로젝트 규모 매핑
                    project_mapping = {
                        "소규모": "소규모 팀(2-5명)",
                        "중규모": "중규모 팀(6-15명)",
                        "대규모": "대규모 팀(16명+)",
                        "": "소규모 팀(2-5명)"
                    }
                    project_scale = project_mapping.get(get_value("project_scale"), "소규모 팀(2-5명)")
                    
                    # 리더십 경험 매핑
                    leadership_mapping = {
                        "없음": "없음",
                        "부분": "부분적 리더 역할",
                        "전체": "팀 리더",
                        "": "없음"
                    }
                    leadership_experience = leadership_mapping.get(get_value("leadership_experience"), "없음")
                    
                    return (
                        gr.update(value=profile_data, visible=True),  # analysis_output
                        get_value("company"),  # company_name
                        get_value("position"),  # position
                        career_level,  # career_level
                        education_level,  # education_level
                        get_value("major"),  # major
                        get_value("gpa"),  # gpa
                        get_value("certificates"),  # certificates
                        get_value("tech_stack"),  # tech_stack
                        get_value("language_skills"),  # language_skills
                        get_value("personality_type"),  # personality_type
                        project_scale,  # project_scale
                        leadership_experience,  # leadership_experience
                        get_value("portfolio_links"),  # portfolio_links
                        get_value("blog_activity"),  # blog_activity
                        get_value("sns_activity"),  # sns_activity
                        get_value("open_source"),  # open_source
                        get_value("awards"),  # awards
                        get_value("competitions"),  # competitions
                        get_value("publications")  # publications
                    )
                    
                except Exception as e:
                    error_output = gr.update(value={"error": str(e)}, visible=True)
                    # 에러 시 빈 값들 반환
                    empty_returns = [""] * 19
                    empty_returns[2] = "구분없음"  # career_level
                    empty_returns[3] = "학사"     # education_level
                    empty_returns[10] = "소규모 팀(2-5명)"  # project_scale
                    empty_returns[11] = "없음"    # leadership_experience
                    
                    return (error_output, *empty_returns)
            
            def generate_personalized_questions(company, position, career, education, major, gpa, 
                                               certs, tech, lang, personality, project, leadership,
                                               source, priorities, goal, style, website_url, enable_crawling,
                                               portfolio, blog, sns, opensource, awards, comps, pubs, 
                                               interview_type, difficulty, question_count, file):
                try:
                    if not company or not position:
                        return "❌ 회사명과 직무를 입력해주세요.", ""
                    
                    if file is None:
                        return "❌ 이력서 파일을 업로드해주세요.", ""
                    
                    # 이력서 내용 추출
                    resume_content = DocumentProcessor.extract_text_from_uploaded_file(file)
                    
                    # 회사 웹사이트 정보 수집
                    company_website_info = ""
                    if enable_crawling and website_url.strip():
                        print("🌐 회사 웹사이트 정보 수집 중...")
                        company_website_info = self.crawler.crawl_company_basic_info(website_url)
                    
                    # 개인 프로필 생성
                    profile = PersonalProfile(
                        education_level=education,
                        major=major,
                        gpa=gpa,
                        certificates=certs,
                        language_skills=lang,
                        tech_stack=tech,
                        personality_type=personality,
                        project_scale=project,
                        leadership_experience=leadership,
                        portfolio_links=portfolio,
                        blog_activity=blog,
                        sns_activity=sns,
                        open_source=opensource,
                        awards=awards,
                        competitions=comps,
                        publications=pubs,
                        application_source=source,
                        priority_values=", ".join(priorities) if priorities else "",
                        career_goal=goal,
                        work_style=style
                    )
                    
                    # 면접 설정 생성
                    config = InterviewConfig(
                        interview_type=interview_type,
                        difficulty_level=difficulty,
                        question_count=question_count
                    )
                    
                    # 개인화된 질문 생성 (회사 정보 포함)
                    questions = self.generator.generate_personalized_questions(
                        profile, company, position, career, resume_content, config, company_website_info
                    )
                    
                    # 프로필 하이라이트 생성
                    highlights = []
                    if portfolio: highlights.append(f"포트폴리오: {portfolio[:50]}...")
                    if blog: highlights.append(f"블로그: {blog[:30]}...")
                    if awards: highlights.append(f"수상: {awards[:40]}...")
                    if opensource: highlights.append(f"오픈소스: {opensource[:30]}...")
                    
                    # 면접 유형별 이모지 매핑
                    type_emoji = {
                        "기술면접": "💻",
                        "인성면접": "👥", 
                        "임원면접": "👔",
                        "종합면접": "🎯"
                    }
                    
                    # 결과 포맷팅
                    result = f"""# {type_emoji.get(interview_type, '🎯')} {company} - {position} 개인 맞춤형 {interview_type}

## 📋 개인 프로필 요약
- **학력**: {education} ({major})
- **경력구분**: {career}
- **핵심 역량**: {tech}
- **성격 특성**: {personality}
- **커리어 목표**: {goal}

## ⚙️ 면접 설정
- **면접 유형**: {interview_type}
- **난이도**: {difficulty}
- **질문 개수**: {question_count}개

## 🌟 주요 하이라이트
{chr(10).join(['- ' + h for h in highlights]) if highlights else '- 추가 정보 없음'}

## 🏢 회사 분석 정보
- **웹사이트 크롤링**: {'활성화' if enable_crawling and website_url else '비활성화'}
- **수집된 정보**: {'회사 인재상 및 가치관 정보 반영' if company_website_info and 'fail' not in company_website_info.lower() else '회사 정보 없음'}

---

{questions}

---

## 💡 {interview_type} 맞춤 준비 팁

### 🎯 {interview_type} 핵심 포인트"""
                    
                    # 면접 유형별 맞춤 팁 추가
                    if interview_type == "기술면접":
                        result += """
1. **기술 기초 지식**: CS 전공 지식과 실무 경험을 연결해서 설명
2. **코딩 역량**: 알고리즘과 자료구조, 실제 구현 경험 정리
3. **시스템 설계**: 확장성, 성능, 보안을 고려한 아키텍처 설계 경험
4. **기술 트렌드**: 최신 기술에 대한 관심과 학습 의지 어필
5. **문제 해결**: 복잡한 기술적 문제를 해결한 구체적 사례 준비"""
                    
                    elif interview_type == "인성면접":
                        result += """
1. **가치관 정립**: 개인의 핵심 가치와 회사 문화의 일치점 강조
2. **팀워크 경험**: 협업 과정에서의 갈등 해결과 소통 방식 사례
3. **성장 마인드**: 실패 경험과 그를 통한 학습, 성장 스토리
4. **조직 적응력**: 다양한 환경에서의 적응 경험과 유연성
5. **소통 능력**: 다양한 이해관계자와의 효과적 소통 경험"""
                    
                    elif interview_type == "임원면접":
                        result += """
1. **리더십 철학**: 개인의 리더십 스타일과 팀 관리 경험
2. **전략적 사고**: 비즈니스 관점에서의 문제 인식과 해결 방안
3. **의사결정**: 어려운 상황에서의 판단 기준과 책임감
4. **조직 기여**: 회사 성장에 기여할 수 있는 구체적 방안
5. **장기 비전**: 개인과 조직의 미래 발전 방향에 대한 생각"""
                    
                    # 직무별 맞춤 팁 추가
                    elif any(keyword in position.lower() for keyword in ["hr", "인사"]):
                        result += """
1. **채용 전문성**: 효과적인 인재 선발과 면접 기법, 평가 방법론
2. **조직 개발**: 조직 문화 진단과 개선, 구성원 만족도 향상
3. **교육 기획**: 체계적인 교육 프로그램 설계와 효과 측정
4. **성과 관리**: 공정한 평가 체계와 보상 제도 운영
5. **HR 트렌드**: 최신 HR 동향과 디지털 전환, 데이터 활용"""
                    
                    elif any(keyword in position.lower() for keyword in ["영업", "sales"]):
                        result += """
1. **고객 관계**: 신뢰 관계 구축과 장기적 파트너십 유지 전략
2. **제품 전문성**: 제품/서비스에 대한 깊은 이해와 차별화 포인트
3. **협상 스킬**: 효과적인 협상 전략과 윈-윈 결과 도출 경험
4. **시장 분석**: 고객 니즈 파악과 시장 트렌드 분석 능력
5. **목표 달성**: 매출 목표 달성 경험과 성과 개선 방법론"""
                    
                    elif any(keyword in position.lower() for keyword in ["마케팅", "marketing"]):
                        result += """
1. **브랜드 전략**: 브랜드 포지셔닝과 차별화 전략 수립 경험
2. **고객 분석**: 타겟 고객 세그먼트와 페르소나 기반 마케팅
3. **캠페인 기획**: 통합 마케팅 캠페인 기획과 실행, 성과 분석
4. **디지털 마케팅**: SNS, 검색광고, 콘텐츠 마케팅 활용 경험
5. **성과 측정**: ROI/ROAS 분석과 데이터 기반 최적화 방법"""
                    
                    elif any(keyword in position.lower() for keyword in ["기획", "planning"]):
                        result += """
1. **전략 수립**: 체계적인 사업 계획과 실행 로드맵 설계
2. **시장 분석**: 시장 조사와 경쟁 분석, 사업성 검토 능력
3. **프로젝트 관리**: 일정과 리소스 관리, 리스크 대응 경험
4. **데이터 분석**: 정량/정성 분석을 통한 의사결정 지원
5. **이해관계자 관리**: 다양한 부서와의 협업과 조율 능력"""
                    
                    elif any(keyword in position.lower() for keyword in ["디자인", "design"]):
                        result += """
1. **디자인 프로세스**: 체계적인 디자인 프로세스와 방법론 이해
2. **사용자 경험**: UX 리서치와 사용자 중심 디자인 설계
3. **브랜드 일관성**: 브랜드 아이덴티티 반영과 일관성 유지
4. **협업 능력**: 기획자, 개발자와의 효과적인 소통과 협업
5. **트렌드 감각**: 최신 디자인 트렌드와 기술 동향 파악"""
                    
                    elif any(keyword in position.lower() for keyword in ["재무", "finance"]):
                        result += """
1. **재무 분석**: 재무제표 분석과 기업 가치 평가 능력
2. **자금 관리**: 효율적인 자금 조달과 운용 전략 수립
3. **예산 관리**: 정확한 예산 편성과 실적 관리, 분석
4. **투자 분석**: 투자 의사결정과 수익성 분석 경험
5. **리스크 관리**: 재무 리스크 식별과 관리 방안 수립"""
                    
                    else:  # 종합면접
                        result += """
1. **종합적 역량**: 기술, 인성, 리더십의 균형잡힌 발전 과정
2. **회사 이해**: 회사의 비전, 가치, 문화에 대한 깊은 이해
3. **성장 스토리**: 지속적인 학습과 발전을 보여주는 일관된 스토리
4. **적응력**: 변화하는 환경에서의 유연성과 혁신 마인드
5. **기여 방안**: 회사와 팀에 기여할 수 있는 차별화된 가치 제안"""
                    
                    result += f"""

### 🌟 개인 맞춤 포인트
- **GitHub/포트폴리오**: 주요 프로젝트의 기술적 도전과 해결 과정
- **블로그/기술 글**: 작성한 내용의 배경과 인사이트
- **수상/성과**: 성취 과정에서의 문제 해결 능력과 팀워크
- **오픈소스**: 커뮤니티 기여 경험과 협업 능력
- **회사 문화**: 수집된 회사 정보를 바탕으로 한 문화 적합성

**당신만의 독특한 스토리와 {interview_type}에 특화된 준비로 면접관을 감동시키세요! 🌟**
"""
                    
                    # 파일 저장
                    data_dir = "data"
                    os.makedirs(data_dir, exist_ok=True)
                    
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{interview_type}_{company}_{position}_{difficulty}_{question_count}개_{timestamp}.txt"
                    file_path = os.path.join(data_dir, filename)
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(result)
                    
                    download_msg = f"✅ {interview_type} 질문이 저장되었습니다: {file_path}"
                    
                    return result, download_msg
                    
                except Exception as e:
                    return f"❌ 오류: {str(e)}", ""
            
            # 이벤트 연결
            analyze_btn.click(
                fn=analyze_resume_detailed,
                inputs=resume_file,
                outputs=[
                    analysis_output,
                    company_name, position, career_level, education_level, major, gpa,
                    certificates, tech_stack, language_skills, personality_type,
                    project_scale, leadership_experience,
                    portfolio_links, blog_activity, sns_activity, open_source,
                    awards, competitions, publications
                ]
            )
            
            # 설정 요약 업데이트
            for component in [interview_type, difficulty_level, question_count, company_name, position]:
                component.change(
                    fn=update_config_summary,
                    inputs=[interview_type, difficulty_level, question_count, company_name, position],
                    outputs=config_summary
                )
            
            generate_btn.click(
                fn=generate_personalized_questions,
                inputs=[
                    company_name, position, career_level, education_level, major, gpa,
                    certificates, tech_stack, language_skills, personality_type,
                    project_scale, leadership_experience, application_source, 
                    priority_values, career_goal, work_style, website_url, enable_crawling,
                    portfolio_links, blog_activity, sns_activity, open_source,
                    awards, competitions, publications,
                    interview_type, difficulty_level, question_count, resume_file
                ],
                outputs=[output, download_info]
            ).then(
                fn=lambda x: gr.update(visible=True) if x else gr.update(visible=False),
                inputs=download_info,
                outputs=download_info
            )
        
        return demo


def main():
    """메인 실행 함수"""
    try:
        print("🎯 개인 맞춤형 AI 면접 질문 생성기 시작...")
        
        interface = EnhancedInterviewInterface()
        demo = interface.create_enhanced_interface()
        
        demo.launch(
            share=False,
            debug=True,
            server_name="127.0.0.1",
            server_port=7860
        )
        
    except Exception as e:
        print(f"❌ 애플리케이션 시작 오류: {str(e)}")


if __name__ == "__main__":
    main()