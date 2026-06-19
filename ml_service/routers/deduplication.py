from fastapi import APIRouter, HTTPException
from ml_service.models.schemas import DeduplicationRequest, DeduplicationResponse
from ml_service.services.deduplication_service import deduplicate_questions

router = APIRouter()


@router.post("/check", response_model=DeduplicationResponse)
async def check_duplicates(request: DeduplicationRequest):
    """
    Detects paraphrased duplicate questions in a batch.

    Called by Node backend at:  POST http://ml_service:8080/deduplication/check

    Body:
    {
      "questions": [
        { "id": "1", "question_text": "What is the SI unit of force?", "topic": "Physics" },
        { "id": "2", "question_text": "Name the standard unit of measuring force.", "topic": "Physics" }
      ],
      "use_llm": true,
      "similarity_threshold": 0.85,
      "borderline_low": 0.60
    }
    """
    if not request.questions:
        raise HTTPException(status_code=422, detail="questions list must not be empty.")

    if len(request.questions) > 500:
        raise HTTPException(
            status_code=400,
            detail="Maximum 500 questions per request. Split into batches.",
        )

    result = await deduplicate_questions(
        questions=request.questions,
        use_llm=request.use_llm,
        similarity_threshold=request.similarity_threshold,
        borderline_low=request.borderline_low,
    )
    return result
