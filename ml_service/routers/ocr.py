import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from services.ocr_service import preprocess_image
from services.answer_grading_service import grade_handwritten_answer

router = APIRouter()
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_IMAGE_BYTES = 15 * 1024 * 1024


async def read_valid_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, TIFF.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large. Maximum size: 15MB.")
    if not image_bytes:
        raise HTTPException(status_code=422, detail="The uploaded image is empty.")
    return image_bytes


@router.post("/preprocess")
async def preprocess_exam_image(
    file: UploadFile = File(..., description="Exam paper image (JPEG, PNG, WebP)"),
    max_width: int = Form(default=2000),
    clip_limit: float = Form(default=3.0),
    tile_grid: int = Form(default=8),
    block_size: int = Form(default=15),
    sharpen: float = Form(default=0.5),
    run_deskew: bool = Form(default=True),
):
    """
    Preprocesses a scanned exam paper image using CLAHE + Adaptive Thresholding.

    Called by Node backend at: POST http://ml_service:8080/ocr/preprocess
    Accepts: multipart/form-data with the image file.

    Returns:
    {
      "quality_before": { "score": 38, "recommendation": "..." },
      "preprocess_steps": ["greyscale", "CLAHE ...", "adaptive threshold ..."],
      "original_size": { "width": 3508, "height": 4960 },
      "processed_size": { "width": 2000, "height": 2829 },
      "processed_image_base64": "<base64-encoded PNG>"
    }
    """
    image_bytes = await read_valid_image(file)

    try:
        result = preprocess_image(
            image_bytes=image_bytes,
            max_width=max_width,
            clip_limit=clip_limit,
            tile_grid=tile_grid,
            block_size=block_size,
            sharpen=sharpen,
            run_deskew=run_deskew,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Remove raw bytes (not JSON-serialisable), keep base64 string
    result.pop("processed_png_bytes", None)

    return JSONResponse(content={"success": True, "data": result})


@router.post("/grade-answer")
async def grade_answer(
    file: UploadFile = File(..., description="Photograph of the handwritten answer"),
    question: str = Form(..., min_length=3, max_length=5000),
    correct_answer: str = Form(..., min_length=3, max_length=12000),
    max_marks: float = Form(default=10, gt=0, le=100),
    rubric: str = Form(default="", max_length=12000),
):
    """
    Cleans a handwritten answer with the existing OpenCV pipeline, transcribes
    it with Groq Vision, and awards criterion-level partial marks.
    """
    image_bytes = await read_valid_image(file)

    try:
        result = await grade_handwritten_answer(
            image_bytes=image_bytes,
            question=question,
            correct_answer=correct_answer,
            max_marks=max_marks,
            rubric=rubric,
        )
        return {"success": True, "data": result.model_dump()}
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))
