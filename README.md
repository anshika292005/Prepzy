# Prepzy

Prepzy is a Next.js learning interface backed by one unified Python FastAPI
application. Python owns authentication, OTP delivery, persistence, AI/RAG,
analytics, OCR, and handwritten-answer grading. TypeScript is restricted to
the browser and thin Next.js proxy routes.

## Architecture

```text
Browser
  |
  v
Next.js web (TypeScript/React)
  |
  v
FastAPI API (Python)
  |-- Firebase token verification and email OTP
  |-- MongoDB learning records
  |-- Redis cache and job state
  |-- Groq generation, explanations, OCR, and grading
  |-- OpenAI-compatible embeddings
  |-- ChromaDB note retrieval
  |-- scikit-learn/statsmodels analytics
  `-- OpenCV CLAHE preprocessing
```

Production traffic enters through Nginx. The API and data services are on an
internal Docker network.

## Local development

Add credentials to `.env.local`, then run:

```bash
chmod +x scripts/*.sh
./scripts/dev.sh
```

The web UI runs on the Next.js-selected port, normally `3000`. FastAPI runs at:

- API: <http://localhost:8080>
- OpenAPI: <http://localhost:8080/docs>
- Health: <http://localhost:8080/health>
- Metrics: <http://localhost:8080/metrics>

## Docker

```bash
./scripts/setup.sh
```

The production stack contains:

- `web`: Next.js UI
- `api`: FastAPI
- `worker`: Python background worker
- `mongodb`: durable learning records
- `redis`: caching and job state
- `chromadb`: vectors and semantic retrieval
- `nginx`: gateway and rate limiting

For development containers:

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  up --build
```

## Required environment variables

Copy `.env.example` to `.env` or `.env.local`.

Core AI:

```env
GROQ_API_KEY=
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
OPENAI_API_KEY=
```

Firebase browser configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase Admin:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Email OTP:

```env
OTP_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Prepzy <sender@example.com>"
```

Data services:

```env
MONGO_URI=mongodb://localhost:27017/prepzy
MONGO_DATABASE=prepzy
REDIS_URL=redis://localhost:6379/0
CHROMA_URL=http://localhost:8000
PYTHON_API_URL=http://localhost:8080
```

## API groups

- `/api/auth`: password/Google login OTP
- `/api/users`: student profiles
- `/api/sessions`: learning sessions
- `/api/responses`: question responses
- `/api/skill-scores`: Elo skill tracking
- `/api/submit-session`: atomic session submission
- `/api/mcq`: adaptive MCQ generation and weak-topic analysis
- `/api/explain`: explanations and follow-up tutoring
- `/api/study-plan`: personalized planning
- `/api/upload`: RAG note ingestion and topic management
- `/api/analytics`: dashboards and predictions
- `/analytics/predict`: direct statistical pipeline
- `/deduplication/check`: TF-IDF duplicate detection
- `/ocr/preprocess`: CLAHE preprocessing
- `/ocr/grade-answer`: Groq Vision partial-mark grading

## Tests and operations

```bash
./scripts/lint-all.sh
./scripts/test-all.sh
./scripts/test.sh http://localhost:8080
./scripts/migrate.sh
./scripts/backup.sh
```

The Python suite covers persistence fallbacks, ownership enforcement, Elo
scoring, RAG, guardrails, reranking, agents, cache, jobs, metrics, OCR, and API
contracts.

## Language composition

Run:

```bash
.venv-ml/bin/python -m backend.tools.language_report
```

The migration intentionally removes the duplicate Express backend. Python plus
Docker, Shell, YAML, and infrastructure configuration now accounts for more
than 60% of measured source lines while TypeScript remains focused on UI work.
