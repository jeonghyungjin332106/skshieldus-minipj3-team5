from pathlib import Path
from dotenv import load_dotenv
import os

# LangChain 모듈 임포트
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
# Cross-Encoder 임포트
from sentence_transformers import CrossEncoder

# 환경변수(OPENAI_API_KEY) 로드
load_dotenv()

# LLM 및 임베딩 초기화
chat_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
rag_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
embedding_model = OpenAIEmbeddings(model="text-embedding-ada-002")
# Cross-Encoder 모델 초기화
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# ─── 1. 이력서 텍스트 추출 ───────────────────────────
def extract_text_from_file(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
    elif suffix in (".docx", ".doc"):
        loader = Docx2txtLoader(str(file_path))
    else:
        raise ValueError("지원 파일 형식은 PDF 또는 DOCX 뿐입니다.")
    docs = loader.load()
    return "\n\n".join([d.page_content for d in docs])

# ─── 2. 벡터스토어 로드/생성 (Ephemeral 모드) ───────────────────────────
def get_vectorstore(raw_text: str) -> FAISS:
    """
    매번 새로 FAISS 인메모리 인덱스를 생성합니다.
    일회성 분석용으로 디스크에 저장하지 않습니다.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents([Document(page_content=raw_text)])
    # 인메모리로만 인덱스 생성
    vectorstore = FAISS.from_documents(docs, embedding_model)
    return vectorstore

# ─── 3. 통합 분석 프롬프트 & 호출 ─────────────────
# 추천 직무 3가지, 각 직무별 설명, 그리고 각 직무의 관련도를 계산한 뒤
# 관련도 기준 미만이면 "관련 직무 없음" 만 출력, 그렇지 않으면 추천과 기술을 함께 출력합니다.
analysis_template = PromptTemplate(
    input_variables=["resume_content", "position"],
    template="""
당신은 다양한 산업 분야의 커리어 분석 전문가입니다.
다음 이력서와 사용자가 입력한 관심 직무명({position})를 바탕으로,
아래 세 가지를 수행하세요.

—— 입력 데이터 ——
이력서 내용:
{resume_content}

관심 직무: {position}
—— 출력 형식 ——
1) 경험 기반 추천 직무 3가지 및 각 직무별 설명
2) 각 추천 직무가 "{position}"과 얼마나 관련 있는지 0.0~1.0 점수로 매기기
3) 관련도 점수가 모두 0.3 미만이면, "관련 직무 없음" 한 줄만 출력
   그렇지 않으면, 1), 2) 결과와 함께
   관심 직무({position})에 필요한 핵심 기술 5가지도 한 줄로 나열해 출력

(결과는 모두 한국어로 출력)
(IT분야가 아닐 수 있습니다. 문서 내용에 기반하여 작성해주세요.)
"""
)

def analyze_resume_and_position(
    raw_text: str,
    vectorstore: FAISS,
    position: str,
    k: int = 4
) -> str:
    # 벡터스토어를 통한 이력서 청크 생성
    docs = vectorstore.similarity_search("이력서를 기반으로 수행 가능한 직무를 추론해줘", k=k)
    # 이력서 청크 합치기
    context = "\n\n".join([d.page_content for d in docs])

    # 통합 프롬프트 호출
    prompt = analysis_template.format(
        resume_content=context,
        position=position
    )
    return rag_llm.predict(prompt)



# ───────────────── 관심 직무 기술 설명 ─────────────────────────
skill_template = PromptTemplate(
    input_variables=["position"],
    template="""
당신은 커리어 상담 전문가입니다.
관심 직무({position})에 필요한 핵심 기술 5가지를 하나씩 나열하고 각 기술에 대한 설명을 덧붙여 주세요.
position이 실존하지 않거나 관련 정보가 충분하지 않은 경우, '해당 직무에 대한 정보가 부족합니다.'라고 응답해주세요.
IT분야가 아닐 수 있습니다. 문서 내용에 기반하여 작성해주세요.
결과는 모두 한국어로 출력해 주세요.
"""
)

def get_position_skills(position: str) -> str:
    prompt = skill_template.format(position=position)
    return chat_llm.predict(prompt)

# ─── 5. Cross-Encoder relevance 계산 ─────────────────
def cross_encoder_score(job: str, position: str) -> float:
    # job: 추천 직무명, position: 관심 직무명
    return float(cross_encoder.predict([(job, position)])[0])

# ─── 6. 최종 분석 함수 ─────────────────────────────
recommend_template = PromptTemplate(
    input_variables=["resume_content"],
    template="""
당신은 커리어 분석 전문가입니다. 다음 이력서 내용을 기반으로, IT직무에 국한되지 않고
지원자가 실제 수행했던 경험, 사용했던 도구, 업무 영역 등을 분석해
지원자에게 적합한 추천 직무 3가지와 각 직무에 대한 설명을 출력하세요.
(직무명은 현실에서 존재하는 직군으로 명시하세요.)
(결과는 한국어로 출력하세요.)

이력서:
{resume_content}

출력 예시:
1. [직무명] - [간단한 설명]
2. [직무명] - [간단한 설명]
3. [직무명] - [간단한 설명]

(결과는 한국어로 출력)
"""
)

def recommend_jobs(vectorstore: FAISS, k: int = 4) -> str:
    docs = vectorstore.similarity_search("지원자가 수행한 업무 경험, 역량, 도구를 기반으로 추천 직무를 추론해줘", k=k)
    context = "\n\n".join([d.page_content for d in docs])
    prompt = recommend_template.format(resume_content=context)
    return rag_llm.predict(prompt)
def analyze_resume_and_position(
    raw_text: str,
    vectorstore: FAISS,
    position: str,
    k: int = 4,
    ce_threshold: float = 6.0
) -> str:
    # 추천 직무 생성
    recommended = recommend_jobs(vectorstore, k=k).strip()

    # 추천 직무 라인 파싱
    rec_lines = [line.strip() for line in recommended.splitlines() if line.strip().startswith(('1', '2', '3'))]
    rec_jobs = [line.split(' ', 1)[1].split(' - ')[0].strip() for line in rec_lines]

    # Cross-Encoder로 관련도 측정
    scores = [cross_encoder_score(job, position) for job in rec_jobs]
    best_score = max(scores) if scores else -float('inf')
    print(f"DEBUG ▶ Cross-Encoder best_score: {best_score:.4f}")

    # 관련도 임계치 미만이면 fallback 메시지 출력
    if best_score < ce_threshold:
        return "죄송합니다. 추천 직무와 관심 직무가 의미상 관련이 없어 분석이 어렵습니다."

    # 관련 있는 경우에만 기술 설명 포함
    skills = get_position_skills(position).strip()
    result = f"=== 관심 직무: {position} ===\n\n"
    result += "=== 추천 직무 ===\n" + "\n".join(rec_lines) + "\n\n"
    result += "=== 관심 직무 기술 ===\n" + skills
    return result


# ─── CLI 진입점 ─────────────────────────────────
if __name__ == "__main__":
    path = Path(input("이력서 파일 경로(.pdf/.docx): ").strip())
    resume = extract_text_from_file(path)
    vectorstore = get_vectorstore(resume)

    position = input("관심 직무를 입력하세요 (예: 프론트엔드 개발자): ").strip()
    output = analyze_resume_and_position(
        resume,
        vectorstore,
        position,
        k=4,
        ce_threshold=6.0  # 필요에 따라 조정
    )

    print("\n=== 분석 결과 ===\n")
    print(output)
