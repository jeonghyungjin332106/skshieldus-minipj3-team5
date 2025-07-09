import os
import json
import ast
import shutil
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse

# 문서 파싱
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import tempfile
# LLM
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

# 유사도
from sentence_transformers import CrossEncoder, SentenceTransformer, util

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

# 전역 코사인 유사도 모델 로딩
name_sim_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

app = FastAPI()

### 1. 이력서 파싱 (FastAPI 업로드 기반)
def parse_resume_from_upload(uploaded_file: UploadFile) -> str:
    ext = uploaded_file.filename.split(".")[-1].lower()

    # 안전한 임시 파일 경로 확보
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        shutil.copyfileobj(uploaded_file.file, tmp)
        file_path = tmp.name

    if ext == "pdf":
        loader = PyPDFLoader(file_path)
    elif ext == "docx":
        loader = Docx2txtLoader(file_path)
    else:
        raise ValueError("지원하지 않는 파일 형식입니다.")

    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    return "\n".join([doc.page_content for doc in texts])



### 2. 추천 직무 생성 (LLM 기반)
job_prompt_template = PromptTemplate(
    template="""
당신은 커리어 분석가입니다.

아래 이력서를 기반으로 사용자의 역량에 적합한 직무 3~5개를 추천하고,
각 직무에 대해 다음 정보를 JSON 리스트 형식으로 출력하세요:

1. title: 직무 이름
2. description: 직무 주요 역할 설명
3. required_skills: 필수 기술 또는 역량 (배열로)
4. reason: 이 이력서에서 이 직무를 추천한 이유

이력서:
---
{resume}
---
출력 형식:
[
  {{
    "title": "데이터 엔지니어",
    "description": "...",
    "required_skills": ["...", "..."],
    "reason": "..."
  }},
  ...
]
""",
    input_variables=["resume"]
)

def recommend_jobs_from_resume(resume_text: str) -> List[Dict]:
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)
    prompt = job_prompt_template.format(resume=resume_text)
    response = llm.invoke(prompt)
    print("=== GPT 응답 ===")
    print(response.content)
    try:
        return ast.literal_eval(response.content)
    except Exception as e:
        print("추천 직무 파싱 실패:", e)
        print(response.content)
        return []


### 3. 관심 직무 분석
interest_prompt_template = PromptTemplate(
    template="""
당신은 채용 전문가입니다.

아래 입력된 관심 직무에 대해, 이 직무를 수행하기 위해 반드시 필요한 기술 또는 역량을 5가지 이내로 추천해주세요. 각 항목은 다음 형식으로 제공하세요:

[
  {{
    "skill": "기술 또는 역량명",
    "reason": "왜 이 기술이 필요한지 설명"
  }},
  ...
]

관심 직무:
{interest_job}
""",
    input_variables=["interest_job"]
)

def analyze_interest_job(interest_job: str) -> List[Dict[str, str]]:
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)
    prompt = interest_prompt_template.format(interest_job=interest_job)
    response = llm.invoke(prompt)
    try:
        return ast.literal_eval(response.content)
    except Exception as e:
        print("관심 직무 파싱 실패:", e)
        print(response.content)
        return []


### 4. 유사도 계산
def compute_similarity_scores(interest_job: str, job_details: List[Dict]) -> List[Dict]:
    model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    pairs = [(interest_job, job["title"]) for job in job_details]
    scores = model.predict(pairs)

    return [
        {
            "title": job["title"],
            "score": float(score),
            "description": job["description"],
            "required_skills": job["required_skills"],
            "reason": job["reason"]
        }
        for job, score in zip(job_details, scores)
    ]


### 5. 관심 직무 유효성 판단 (LLM)
job_validity_prompt = PromptTemplate(
    template="""
아래 직무명이 실제 산업/사회에서 사용되는 일반적인 직업인지 판단해주세요.

직무명: {job}

출력: 
- 존재하는 일반적인 직무면 "존재함"
- 그렇지 않으면 "존재하지 않음"
""",
    input_variables=["job"]
)

def is_real_job(job_name: str) -> bool:
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    prompt = job_validity_prompt.format(job=job_name)
    response = llm.invoke(prompt).content.strip().lower()
    return "존재함" in response


### 6. Fallback + 코사인 유사도 판단
def is_valid_match(best_match: Dict, threshold: float, interest_job: str) -> bool:
    if not best_match:
        return False
    if best_match["score"] < threshold:
        return False

    emb1 = name_sim_model.encode(interest_job.strip().lower(), convert_to_tensor=True)
    emb2 = name_sim_model.encode(best_match["title"].strip().lower(), convert_to_tensor=True)
    name_sim = util.cos_sim(emb1, emb2).item()

    print(f"[디버그] 직무명 의미 유사도: {name_sim:.4f}")

    return name_sim >= 0.6


### 7. FastAPI 라우팅
@app.post("/analyze")
async def analyze_resume(
    file: UploadFile,
    interest_job: str = Form(...)
):
    try:
        if not is_real_job(interest_job):
            return JSONResponse(content={
                "recommended_jobs": [],
                "user_interest": interest_job,
                "interest_skills": [],
                "best_match": None,
                "commentary": f"'{interest_job}'은(는) 존재하지 않는 직무이거나 정보가 부족합니다."
            })

        resume_text = parse_resume_from_upload(file)
        job_details = recommend_jobs_from_resume(resume_text)
        interest_skills = analyze_interest_job(interest_job)
        similarity_scores = compute_similarity_scores(interest_job, job_details)
        filtered_scores = [job for job in similarity_scores if job["score"] >= 0.6]
        best_match = max(filtered_scores, key=lambda x: x["score"]) if filtered_scores else None

        if is_valid_match(best_match, threshold=0.7, interest_job=interest_job):
            commentary = f"'{interest_job}'와 가장 유사한 직무는 '{best_match['title']}'이며 유사도는 {best_match['score']:.2f}입니다."
            match_result = best_match["title"]
        else:
            commentary = f"'{interest_job}'와 유사한 직무가 명확히 나타나지 않았습니다."
            match_result = None

        return JSONResponse(content={
            "recommended_jobs": filtered_scores,
            "user_interest": interest_job,
            "interest_skills": interest_skills,
            "best_match": match_result,
            "commentary": commentary
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#uvicorn commit_ver:app --reload --host 0.0.0.0 --port 5000