# Multi-stage build로 용량 최적화
FROM python:3.12-slim as builder

# 빌드 의존성만 설치
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    gcc \
    g++ \
    libpoppler-cpp-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 빌드
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --user -r requirements.txt

# --- 최종 실행 이미지 ---
FROM python:3.12-slim

# 런타임에 필요한 최소한의 시스템 패키지만 설치
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    curl \
    poppler-utils \
    libpoppler-cpp0v5 \
    libmagic1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 단계에서 설치된 Python 패키지 복사
COPY --from=builder /root/.local /root/.local

# 권한 수정 (중요!)
RUN chmod -R 755 /root/.local

# 애플리케이션 코드 복사
COPY . /app/

# py 폴더의 Python 파일을 작업 디렉토리로 복사
RUN cp /app/py/*.py /app/ || true

# uploads 디렉토리 생성 및 권한 설정
RUN mkdir -p uploads && chmod 755 uploads

# 환경 변수 설정
ENV PYTHONPATH=/app:/root/.local
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/root/.local/bin:$PATH

# 포트 노출
EXPOSE 5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/docs || exit 1

# 비root 사용자는 권한 문제로 인해 일단 주석 처리
# RUN groupadd -r appuser && useradd -r -g appuser appuser && \
#     chown -R appuser:appuser /app && \
#     chown -R appuser:appuser /root/.local
# USER appuser

# 애플리케이션 실행
CMD ["uvicorn", "backend_api_js:app", "--host", "0.0.0.0", "--port", "5000"]