from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import PlainTextResponse
from pathlib import Path
import tempfile
import os
from dotenv import load_dotenv

# LangChain
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI

# 유사도
from sentence_transformers import CrossEncoder
from sklearn.metrics.pairwise import cosine_similarity

# ───── 설정 ─────
load_dotenv()
app = FastAPI()

chat_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)
rag_llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
embedding_model = OpenAIEmbeddings(model="text-embedding-ada-002")
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

TRANSLATION_CACHE = {}

def translate_job_to_english(job_korean: str) -> str:
    prompt = f'"{job_korean}"라는 한국어 직무명을 현실에서 사용되는 영어 직무명으로 자연스럽게 번역해줘. 분야는 제한하지 않고, 다양한 산업군에서 실제 쓰일 수 있는 직무명으로 작성해. 단어 수는 2~4개 이내로 해줘.'
    return chat_llm.predict(prompt).strip()

def normalize_position(position: str) -> str:
    clean = position.strip()
    if clean in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[clean]
    eng = translate_job_to_english(clean)
    TRANSLATION_CACHE[clean] = eng
    return eng

# ───── 텍스트 추출 ─────
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

def get_vectorstore(raw_text: str) -> FAISS:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents([Document(page_content=raw_text)])
    return FAISS.from_documents(docs, embedding_model)

# ───── GPT 프롬프트 ─────
recommend_template = PromptTemplate(
    input_variables=["resume_content"],
    template="""
당신은 커리어 분석 전문가입니다. 다음 이력서 내용을 기반으로,
지원자가 수행한 업무와 도구, 경험 등을 고려해 현실에 존재하는 직무 3가지를 추천하세요.
IT, 제조, 교육, 의료, 서비스 등 산업군에 제한을 두지 마세요.

형식:
1. [직무명] - [간단한 설명]
2. ...
3. ...
"""
)

def recommend_jobs(vectorstore: FAISS, k: int = 4) -> str:
    docs = vectorstore.similarity_search("지원자의 업무 경험을 기반으로 추천 직무를 추론해줘", k=k)
    context = "\n\n".join([d.page_content for d in docs])
    prompt = recommend_template.format(resume_content=context)
    return rag_llm.predict(prompt)

skill_template = PromptTemplate(
    input_variables=["position"],
    template="""
당신은 커리어 상담 전문가입니다.

직무명: "{position}"

이 직무는 일반적으로 어떤 업무를 수행하며, 이 업무를 성공적으로 수행하기 위해 필요한 핵심 기술 5가지를 아래 형식에 맞춰 작성하세요:

1. [기술명] - [간략한 설명 또는 사용 맥락]

조건:
- 산업군(IT, 제조, 교육, 의료 등)에 구애받지 않고 해당 직무에 적합한 기술을 제시하세요.
- 기술이 명확하지 않을 경우라도 일반적인 역량(예: 커뮤니케이션, 분석력, 도구 활용 능력 등)을 포함하세요.
- 무조건 5개 항목을 출력하세요.

출력은 한국어로 하세요.
"""
)

def get_position_skills(position: str) -> str:
    prompt = skill_template.format(position=position)
    print(f"[DEBUG] ▶ 기술 분석용 position: '{position}'")
    print("[DEBUG] ▶ 생성된 프롬프트:\n", prompt)
    return chat_llm.predict(prompt)

# ───── 유사도 계산 ─────
def cosine_score(job: str, position: str) -> float:
    job_vec = embedding_model.embed_query(job)
    pos_vec = embedding_model.embed_query(position)
    return float(cosine_similarity([job_vec], [pos_vec])[0][0])

def cross_encoder_score(job: str, position: str) -> float:
    return float(cross_encoder.predict([(job, position)])[0])

def hybrid_score(job: str, position: str) -> tuple[float, float, float, float]:
    ce = cross_encoder_score(job, position)
    cos = cosine_score(job, position)
    alpha = 0.7 if len(position) >= 8 or "엔지니어" in position or "개발자" in position else 0.5
    cos_scaled = cos * 10
    final_score = alpha * ce + (1 - alpha) * cos_scaled
    return final_score, ce, cos, alpha

# ───── FastAPI 엔드포인트 ─────
@app.post("/upload_and_analyze", response_class=PlainTextResponse)
async def upload_and_analyze(file: UploadFile = File(...), position: str = Form(...)):
    position = normalize_position(position)
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        resume_text = extract_text_from_file(tmp_path)
    except Exception as e:
        return f"파일 처리 중 오류: {str(e)}"

    vectorstore = get_vectorstore(resume_text)
    recommended = recommend_jobs(vectorstore, k=4).strip()
    rec_lines = [line.strip() for line in recommended.splitlines() if line.strip().startswith(('1', '2', '3'))]
    rec_jobs = [line.split(' ', 1)[1].split(' - ')[0].strip() for line in rec_lines]

    results = []
    best_score = -1.0
    for job in rec_jobs:
        score, ce, cos, alpha = hybrid_score(job, position)
        results.append((job, score, ce, cos, alpha))
        best_score = max(best_score, score)

    if best_score < 6.0:
        return f"추천 직무와 관심 직무('{position}') 간 관련도가 낮아 분석이 어렵습니다.\n최고 점수: {best_score:.2f}"

    skills = get_position_skills(position).strip()
    result = f"=== 관심 직무: {position} ===\n\n"
    result += "=== 추천 직무 및 유사도 점수 ===\n"
    for i, (job, score, ce, cos, alpha) in enumerate(results, 1):
        result += f"{i}. {job}\n"
        result += f"   - Hybrid: {score:.2f} | CrossEncoder: {ce:.2f} | Cosine: {cos:.2f} | α: {alpha:.2f}\n"

    result += "\n=== 관심 직무에 필요한 기술 ===\n" + skills
    return result