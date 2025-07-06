"""
면접 예상 질문 생성기 - 웹 인터페이스
Gradio를 활용한 파일 업로드 기반 면접 질문 생성 시스템
"""

import os
import tempfile
import shutil
from typing import Optional, Tuple, List
from dataclasses import dataclass
import pdfplumber
import docx
from datetime import datetime
import json
import re
from urllib.parse import urljoin, urlparse

# Web scraping
from bs4 import BeautifulSoup
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# LangChain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Gradio
import gradio as gr
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()


@dataclass
class CompanyInfo:
    """회사 정보 데이터 클래스"""
    name: str
    website_url: str = ""
    talent_philosophy: str = ""
    core_values: str = ""
    company_culture: str = ""
    vision_mission: str = ""


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


class ResumeAnalyzer:
    """이력서 분석기"""
    
    def __init__(self, api_key: str):
        """초기화"""
        self.llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.1,
            max_tokens=500
        )
    
    def extract_company_and_position(self, resume_content: str) -> dict:
        """이력서에서 지원 회사명과 직무 추출"""
        template = """
다음 이력서 내용에서 지원하려는 회사명과 직무를 찾아주세요.

이력서 내용:
{resume_content}

다음 형식으로 응답해주세요:
회사명: [찾은 회사명 또는 "없음"]
직무: [찾은 직무명 또는 "없음"]

찾는 기준:
- 회사명: "지원회사", "지원기업", "OO회사 지원", "OO 입사지원" 등의 표현 근처
- 직무: "지원직무", "희망직무", "지원분야", "포지션" 등의 표현 근처

명시적으로 기재되지 않은 경우 "없음"으로 응답해주세요.
"""
        
        try:
            prompt = ChatPromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            
            result = chain.invoke({"resume_content": resume_content[:3000]})  # 토큰 제한
            
            # 결과 파싱
            company = "없음"
            position = "없음"
            
            for line in result.split('\n'):
                if line.startswith('회사명:'):
                    company = line.replace('회사명:', '').strip()
                elif line.startswith('직무:'):
                    position = line.replace('직무:', '').strip()
            
            return {
                "company": company if company != "없음" else "",
                "position": position if position != "없음" else ""
            }
            
        except Exception as e:
            print(f"이력서 분석 오류: {str(e)}")
            return {"company": "", "position": ""}


class InterviewQuestionGenerator:
    """면접 질문 생성기"""
    
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        """초기화"""
        self.llm = ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=0.7,
            max_tokens=3000
        )
    
    def _create_prompt_template(self) -> ChatPromptTemplate:
        """프롬프트 템플릿 생성"""
        template = """
당신은 {company_name}의 면접관입니다. 지원자의 이력서와 회사 정보를 바탕으로 
적절한 면접 질문을 생성해야 합니다.

[지원 정보]
- 회사명: {company_name}
- 지원 직무: {position}
- 추가 요구사항: {prompt}

[회사 웹사이트 정보]
{company_website_info}

[지원자 이력서]
{resume_content}

위 정보를 바탕으로 다음 카테고리별로 면접 질문을 생성해주세요:

## 1. 기본 질문 (2-3개)
- 자기소개, 지원동기 등 기본적인 질문

## 2. 경험 기반 질문 (4-5개)
- 이력서의 경험을 바탕으로 한 구체적인 질문
- STAR 방법론을 활용할 수 있는 질문

## 3. 회사 적합성 질문 (3-4개)
- 회사 문화와 가치관에 대한 이해도 확인
- 회사 정보를 바탕으로 한 맞춤형 질문

## 4. 직무 역량 질문 (3-4개)
- 해당 직무에 필요한 전문 역량 확인
- 실무 상황을 가정한 문제 해결 질문

## 5. 상황 대응 질문 (2-3개)
- 갈등 상황, 팀워크, 리더십 등 상황별 대응 능력

각 질문에는 다음을 포함해주세요:
- **질문**: 명확하고 구체적인 질문 내용
- **의도**: 이 질문으로 무엇을 평가하고자 하는지
- **팁**: 면접관이 주의 깊게 들어야 할 답변 포인트

총 15-18개의 질문을 생성해주세요.
"""
        
        return ChatPromptTemplate.from_template(template)
    
    def generate_questions(self, company_name: str, position: str, prompt: str, 
                         resume_content: str, company_website_info: str = "") -> str:
        """면접 질문 생성"""
        try:
            prompt_template = self._create_prompt_template()
            chain = prompt_template | self.llm | StrOutputParser()
            
            result = chain.invoke({
                "company_name": company_name,
                "position": position,
                "prompt": prompt,
                "resume_content": resume_content,
                "company_website_info": company_website_info or "회사 웹사이트 정보 없음"
            })
            
            return result
            
        except Exception as e:
            raise Exception(f"질문 생성 오류: {str(e)}")


class InterviewQuestionInterface:
    """면접 질문 생성 웹 인터페이스"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 환경 변수를 설정해주세요.")
        
        self.generator = InterviewQuestionGenerator(self.api_key)
        self.crawler = SimpleWebCrawler()
        self.analyzer = ResumeAnalyzer(self.api_key)
    
    def analyze_resume(self, resume_file):
        """이력서 분석 및 회사명/직무 추출"""
        if resume_file is None:
            return "", "", "❌ 이력서 파일을 업로드해주세요."
        
        try:
            # 이력서 내용 추출
            resume_content = DocumentProcessor.extract_text_from_uploaded_file(resume_file)
            
            if not resume_content.strip():
                return "", "", "❌ 이력서에서 텍스트를 추출할 수 없습니다."
            
            # 회사명과 직무 자동 추출
            extracted_info = self.analyzer.extract_company_and_position(resume_content)
            
            company = extracted_info.get("company", "")
            position = extracted_info.get("position", "")
            
            # 분석 결과 메시지
            if company and position:
                message = f"✅ 자동 추출 완료!\n회사: {company}\n직무: {position}"
            elif company:
                message = f"⚠️ 회사명만 찾았습니다: {company}\n직무를 직접 입력해주세요."
            elif position:
                message = f"⚠️ 직무만 찾았습니다: {position}\n회사명을 직접 입력해주세요."
            else:
                message = "⚠️ 회사명과 직무를 찾을 수 없습니다.\n직접 입력해주세요."
            
            return company, position, message
            
        except Exception as e:
            error_msg = f"❌ 이력서 분석 오류: {str(e)}"
            return "", "", error_msg
    
    def process_and_generate(self, company_name: str, position: str, 
                           website_url: str, additional_prompt: str,
                           resume_file, enable_crawling: bool = True) -> str:
        """파일 처리 및 질문 생성"""
        try:
            # 입력 검증
            if not company_name.strip():
                return "❌ 회사명을 입력해주세요."
            
            if not position.strip():
                return "❌ 지원 직무를 입력해주세요."
            
            if resume_file is None:
                return "❌ 이력서 파일을 업로드해주세요."
            
            # 이력서 내용 추출
            print("📄 이력서 내용 추출 중...")
            resume_content = DocumentProcessor.extract_text_from_uploaded_file(resume_file)
            
            if not resume_content.strip():
                return "❌ 이력서에서 텍스트를 추출할 수 없습니다."
            
            # 회사 웹사이트 정보 수집
            company_website_info = ""
            if enable_crawling and website_url.strip():
                print("🌐 회사 웹사이트 정보 수집 중...")
                company_website_info = self.crawler.crawl_company_basic_info(website_url)
            
            # 질문 생성
            print("🤖 면접 질문 생성 중...")
            questions = self.generator.generate_questions(
                company_name=company_name,
                position=position,
                prompt=additional_prompt or "특별한 요구사항 없음",
                resume_content=resume_content,
                company_website_info=company_website_info
            )
            
            # 결과 포맷팅
            result = f"""# 🎯 {company_name} - {position} 면접 예상 질문

## 📋 생성 정보
- **회사명**: {company_name}
- **지원 직무**: {position}
- **생성 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **웹사이트 분석**: {'활성화' if enable_crawling and website_url else '비활성화'}

---

{questions}

---

## 💡 면접 준비 팁
1. **STAR 방법론 활용**: 상황(Situation), 과제(Task), 행동(Action), 결과(Result)로 답변 구조화
2. **구체적인 사례 준비**: 각 경험에 대한 구체적인 수치와 결과 준비
3. **회사 연구**: 회사의 최근 뉴스, 사업 방향, 문화 등 사전 조사
4. **질문 준비**: 면접관에게 할 역질문 2-3개 준비

**면접 화이팅! 🚀**
"""
            
            return result
            
        except Exception as e:
            error_msg = f"❌ 처리 중 오류가 발생했습니다: {str(e)}"
            print(error_msg)
            return error_msg
    
    def create_interface(self):
        """Gradio 인터페이스 생성"""
        with gr.Blocks(title="AI 면접 질문 생성기", theme=gr.themes.Soft()) as demo:
            gr.Markdown("""
            # 🎯 AI 면접 예상 질문 생성기
            
            이력서와 회사 정보를 바탕으로 맞춤형 면접 질문을 생성해드립니다.
            """)
            
            with gr.Row():
                with gr.Column(scale=1):
                    gr.Markdown("### 📄 이력서 업로드")
                    
                    resume_file = gr.File(
                        label="이력서 파일 업로드 (PDF, DOCX, TXT 지원)",
                        file_types=[".pdf", ".docx", ".txt"]
                    )
                    
                    analyze_btn = gr.Button(
                        "🔍 이력서 분석하기", 
                        variant="secondary",
                        size="sm"
                    )
                    
                    analysis_result = gr.Textbox(
                        label="분석 결과",
                        interactive=False,
                        lines=3,
                        visible=False
                    )
                    
                    gr.Markdown("### 📝 지원 정보")
                    
                    company_name = gr.Textbox(
                        label="🏢 회사명",
                        placeholder="예: 네이버, 삼성전자, 카카오... (이력서에서 자동 추출 가능)"
                    )
                    
                    position = gr.Textbox(
                        label="💼 지원 직무",
                        placeholder="예: 프론트엔드 개발자, 마케팅 매니저... (이력서에서 자동 추출 가능)"
                    )
                    
                    website_url = gr.Textbox(
                        label="🌐 회사 웹사이트 URL (선택사항)",
                        placeholder="https://www.company.com (회사 인재상 분석용)"
                    )
                    
                    additional_prompt = gr.Textbox(
                        label="📌 추가 요구사항 (선택사항)",
                        placeholder="예: 신입 개발자 면접, 리더십 경험 중시...",
                        lines=2
                    )
                    
                    with gr.Accordion("⚙️ 고급 설정", open=False):
                        enable_crawling = gr.Checkbox(
                            label="웹사이트 크롤링 활성화 (회사 웹사이트에서 추가 정보 수집)",
                            value=True
                        )
                    
                    generate_btn = gr.Button(
                        "🚀 면접 질문 생성하기", 
                        variant="primary",
                        size="lg"
                    )
                
                with gr.Column(scale=2):
                    gr.Markdown("### 📋 생성된 면접 질문")
                    
                    output = gr.Markdown(
                        value="왼쪽에서 정보를 입력하고 '면접 질문 생성하기' 버튼을 클릭하세요.",
                        height=600
                    )
            
            with gr.Accordion("💡 사용 가이드", open=False):
                gr.Markdown("""
                ### 📋 사용 순서
                1. **이력서 업로드**: PDF, DOCX, TXT 파일을 업로드하세요
                2. **이력서 분석**: '🔍 이력서 분석하기' 버튼으로 회사명/직무 자동 추출
                3. **정보 확인/수정**: 자동 추출된 정보를 확인하고 필요시 수정
                4. **질문 생성**: '🚀 면접 질문 생성하기' 버튼을 클릭
                
                ### 💡 자동 추출 기능
                - 이력서에서 "지원회사", "희망직무" 등의 정보를 자동으로 찾아줍니다
                - 추출되지 않은 정보는 직접 입력하시면 됩니다
                - 추출된 정보는 수정 가능합니다
                
                ### 입력 예시
                - **이력서 내용**: "삼성전자 프론트엔드 개발자 지원"
                - **자동 추출**: 회사명(삼성전자), 직무(프론트엔드 개발자)
                - **웹사이트**: https://www.samsung.com
                - **추가 요구사항**: 신입 개발자, React 경험 중시
                """)
            
            # 예시 섹션
            with gr.Accordion("📝 이력서 작성 팁", open=False):
                gr.Markdown("""
                ### 자동 추출을 위한 이력서 작성 팁
                
                **명시적으로 기재하면 더 정확합니다:**
                - ✅ "지원회사: 네이버"
                - ✅ "지원직무: 백엔드 개발자"
                - ✅ "희망포지션: 마케팅 매니저"
                
                **이런 표현들도 인식합니다:**
                - "OO회사 입사지원서"
                - "OO 지원동기"
                - "희망분야: 데이터 분석"
                - "지원분야: AI 엔지니어"
                """)
            
            # 기존 예시 섹션
            with gr.Accordion("🎯 생성 결과 예시", open=False):
                gr.Markdown("""
                ### 입력 예시
                - **회사명**: 네이버
                - **지원 직무**: 프론트엔드 개발자
                - **웹사이트**: https://www.navercorp.com
                - **추가 요구사항**: 신입 개발자, React 경험 중시
                - **이력서**: 본인의 이력서 파일 업로드
                
                ### 생성되는 질문 유형
                1. **기본 질문**: 자기소개, 지원동기
                2. **경험 기반**: 프로젝트 경험, 기술 스택
                3. **회사 적합성**: 네이버 문화, 가치관 부합도
                4. **직무 역량**: React 기술력, 프론트엔드 전문성
                5. **상황 대응**: 팀워크, 문제 해결 능력
                """)
            
            # 이벤트 연결
            
            # 이력서 분석 버튼
            analyze_btn.click(
                fn=self.analyze_resume,
                inputs=resume_file,
                outputs=[company_name, position, analysis_result]
            ).then(
                fn=lambda: gr.update(visible=True),
                outputs=analysis_result
            )
            
            # 질문 생성 버튼
            generate_btn.click(
                fn=self.process_and_generate,
                inputs=[
                    company_name, 
                    position, 
                    website_url, 
                    additional_prompt,
                    resume_file, 
                    enable_crawling
                ],
                outputs=output
            )
            
            # 파일 업로드 시 자동 분석 옵션
            def auto_analyze_on_upload(file):
                if file is not None:
                    return gr.update(visible=True), f"✅ 파일 업로드 완료: {file.name}\n🔍 '이력서 분석하기' 버튼을 클릭하세요."
                return gr.update(visible=False), ""
            
            resume_file.change(
                fn=auto_analyze_on_upload,
                inputs=resume_file,
                outputs=[analyze_btn, analysis_result]
            )
        
        return demo


def main():
    """메인 실행 함수"""
    try:
        print("🎯 AI 면접 질문 생성기 시작...")
        
        # 인터페이스 생성
        interface = InterviewQuestionInterface()
        demo = interface.create_interface()
        
        # 서버 실행
        demo.launch(
            share=False,
            debug=True,
            server_name="127.0.0.1",
            server_port=7860,
            show_api=False
        )
        
    except Exception as e:
        print(f"❌ 애플리케이션 시작 오류: {str(e)}")
        print("다음 사항을 확인해주세요:")
        print("1. OPENAI_API_KEY 환경 변수 설정")
        print("2. 필요한 패키지 설치: pip install -r requirements.txt")


if __name__ == "__main__":
    # 필요한 패키지 목록
    required_packages = [
        "gradio",
        "langchain-openai",
        "langchain-core", 
        "pdfplumber",
        "python-docx",
        "beautifulsoup4",
        "requests",
        "python-dotenv"
    ]
    
    print("📦 필요한 패키지:")
    print("pip install " + " ".join(required_packages))
    print("-" * 60)
    
    main()