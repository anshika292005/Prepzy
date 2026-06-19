#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Prepzy — ML Service Integration Tests
#
#  Tests every endpoint with real curl requests.
#  Run after setup.sh or dev.sh is running.
#
#  Usage:
#    chmod +x scripts/test.sh
#    ./scripts/test.sh [--host http://localhost:8080]
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

HOST="${1:-http://localhost:8080}"
PASS=0; FAIL=0

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

pass() { echo -e "  ${GREEN}✓ PASS${RESET}  $*"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✗ FAIL${RESET}  $*"; FAIL=$((FAIL + 1)); }
info() { echo -e "\n${CYAN}${BOLD}▶ $*${RESET}"; }

assert_contains() {
  local label="$1"; local response="$2"; local expected="$3"
  if echo "$response" | grep -q "$expected"; then
    pass "$label"
  else
    fail "$label — expected '$expected' in response:"
    echo "    $response" | head -3
  fi
}

assert_http() {
  local label="$1"; local code="$2"; local expected="$3"
  if [ "$code" = "$expected" ]; then
    pass "$label (HTTP $code)"
  else
    fail "$label — expected HTTP $expected, got $code"
  fi
}

echo ""
echo -e "${BOLD}Prepzy ML Service — Integration Tests${RESET}"
echo -e "Target: ${CYAN}$HOST${RESET}"
echo ""

# ── Test 1: Health check ─────────────────────────────────────
info "Health Check"
RESP=$(curl -sf "$HOST/health" || echo '{"error":"unreachable"}')
assert_contains "service status is ok" "$RESP" '"ok"'

# ── Test 2: Analytics — full prediction pipeline ──────────────
info "Analytics: Full prediction pipeline"

ANALYTICS_PAYLOAD='{
  "user_id": "test-user-001",
  "topics": [
    {
      "topic": "Thermodynamics",
      "yearly_frequency": {"2020": 2, "2021": 3, "2022": 5, "2023": 4, "2024": 7}
    },
    {
      "topic": "Organic Chemistry",
      "yearly_frequency": {"2020": 4, "2021": 0, "2022": 4, "2023": 0, "2024": 4}
    },
    {
      "topic": "Newton Laws",
      "yearly_frequency": {"2021": 3, "2022": 3, "2023": 3, "2024": 3}
    },
    {
      "topic": "Electrochemistry",
      "yearly_frequency": {"2019": 5, "2020": 4, "2021": 3}
    }
  ],
  "skill_scores": [
    {"topic": "Thermodynamics", "skill_score": 1050},
    {"topic": "Organic Chemistry", "skill_score": 1350},
    {"topic": "Newton Laws", "skill_score": 1600},
    {"topic": "Electrochemistry", "skill_score": 900}
  ]
}'

RESP=$(curl -sf -X POST "$HOST/analytics/predict" \
  -H "Content-Type: application/json" \
  -d "$ANALYTICS_PAYLOAD")

assert_contains "predictions array present"  "$RESP" '"predictions"'
assert_contains "trends array present"       "$RESP" '"trends"'
assert_contains "stabilities array present"  "$RESP" '"stabilities"'
assert_contains "cyclic_topics present"      "$RESP" '"cyclic_topics"'
assert_contains "gap_analysis present"       "$RESP" '"gap_analysis"'
assert_contains "label present"              "$RESP" '"label"'
assert_contains "score breakdown present"    "$RESP" '"breakdown"'

# Check Thermodynamics is rising (slope should be positive)
THERMO_SLOPE=$(echo "$RESP" | python3 -c "
import json,sys
data=json.load(sys.stdin)
t=[t for t in data['trends'] if t['topic']=='Thermodynamics']
print(t[0]['direction'] if t else 'missing')
" 2>/dev/null || echo "unknown")

if [ "$THERMO_SLOPE" = "rising" ]; then
  pass "Thermodynamics correctly classified as 'rising' (consistent upward trend)"
else
  fail "Thermodynamics direction: expected 'rising', got '$THERMO_SLOPE'"
fi

# Check Newton Laws is stable (low std dev)
NEWTON_STABLE=$(echo "$RESP" | python3 -c "
import json,sys
data=json.load(sys.stdin)
s=[s for s in data['stabilities'] if s['topic']=='Newton Laws']
print(s[0]['is_stable'] if s else 'missing')
" 2>/dev/null || echo "unknown")

if [ "$NEWTON_STABLE" = "True" ]; then
  pass "Newton Laws correctly classified as stable (constant frequency)"
else
  fail "Newton Laws is_stable: expected True, got '$NEWTON_STABLE'"
fi

# ── Test 3: Deduplication ─────────────────────────────────────
info "Deduplication: Cosine similarity detection"

DEDUP_PAYLOAD='{
  "questions": [
    {"id": "q1", "question_text": "What is the SI unit of force?", "topic": "Physics"},
    {"id": "q2", "question_text": "Name the standard unit used to measure force in the SI system.", "topic": "Physics"},
    {"id": "q3", "question_text": "Explain the process of photosynthesis in plants.", "topic": "Biology"},
    {"id": "q4", "question_text": "Describe how plants produce food through photosynthesis.", "topic": "Biology"}
  ],
  "use_llm": false,
  "similarity_threshold": 0.50,
  "borderline_low": 0.30
}'

RESP=$(curl -sf -X POST "$HOST/deduplication/check" \
  -H "Content-Type: application/json" \
  -d "$DEDUP_PAYLOAD")

assert_contains "original_count present"   "$RESP" '"original_count"'
assert_contains "unique_count present"     "$RESP" '"unique_count"'
assert_contains "duplicate_pairs present"  "$RESP" '"duplicate_pairs"'
assert_contains "unique_questions present" "$RESP" '"unique_questions"'

ORIG=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['original_count'])" 2>/dev/null || echo "0")
if [ "$ORIG" = "4" ]; then
  pass "original_count = 4 ✓"
else
  fail "original_count: expected 4, got $ORIG"
fi

# ── Test 4: OCR Preprocessing ─────────────────────────────────
info "OCR: Image preprocessing"

# Create a minimal white PNG for testing (1×1 pixel, valid PNG header)
TEST_IMG=$(mktemp /tmp/prepzy_test_XXXXXX.png)

# Generate a tiny valid PNG with Python
python3 -c "
import struct, zlib

def make_png(w=50, h=50):
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)
    raw = b''.join(b'\x00' + b'\xff' * w for _ in range(h))
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

import sys
sys.stdout.buffer.write(make_png())
" > "$TEST_IMG"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/ocr/preprocess" \
  -F "file=@$TEST_IMG;type=image/png" \
  -F "max_width=200" \
  -F "run_deskew=false")

assert_http "OCR endpoint accepts valid PNG" "$HTTP_CODE" "200"

RESP=$(curl -sf -X POST "$HOST/ocr/preprocess" \
  -F "file=@$TEST_IMG;type=image/png" \
  -F "max_width=200" \
  -F "run_deskew=false" 2>/dev/null || echo '{}')

assert_contains "quality_before in response"           "$RESP" '"quality_before"'
assert_contains "preprocess_steps in response"         "$RESP" '"preprocess_steps"'
assert_contains "processed_image_base64 in response"   "$RESP" '"processed_image_base64"'

rm -f "$TEST_IMG"

# ── Test 5: Error handling ────────────────────────────────────
info "Error handling"

# Empty questions array
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/deduplication/check" \
  -H "Content-Type: application/json" \
  -d '{"questions": []}')
assert_http "Empty questions → 422" "$HTTP_CODE" "422"

# Too many questions
BIG_PAYLOAD=$(python3 -c "
import json
qs=[{'id':str(i),'question_text':f'Question {i}','topic':'Test'} for i in range(501)]
print(json.dumps({'questions':qs,'use_llm':False}))
")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/deduplication/check" \
  -H "Content-Type: application/json" \
  -d "$BIG_PAYLOAD")
assert_http "501 questions → 400" "$HTTP_CODE" "400"

# Invalid image type
TEST_TEXT=$(mktemp /tmp/prepzy_test_XXXXXX.txt)
echo "not an image" > "$TEST_TEXT"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/ocr/preprocess" \
  -F "file=@$TEST_TEXT;type=text/plain")
assert_http "Text file to OCR → 415" "$HTTP_CODE" "415"
rm -f "$TEST_TEXT"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════${RESET}"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" = "0" ]; then
  echo -e "${GREEN}${BOLD}  All $TOTAL tests passed ✓${RESET}"
else
  echo -e "${RED}${BOLD}  $FAIL / $TOTAL tests failed${RESET}"
fi
echo -e "${BOLD}═══════════════════════════════════${RESET}"
echo ""

[ "$FAIL" = "0" ] && exit 0 || exit 1
