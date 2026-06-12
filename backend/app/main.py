import csv
import io
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .gemini_service import GeminiService
from .schemas import (
    DatasetCsvResponse,
    DatasetGenerateRequest,
    GenerateExampleRequest,
    SchemaExtractRequest,
    SchemaExtractResponse,
)

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="Dataset Generative API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def infer_default_value(key: str) -> Any:
    lower = key.lower()
    if any(token in lower for token in [
        "age",
        "count",
        "number",
        "num",
        "year",
        "quantity",
        "amount",
        "price",
        "salary",
        "id",
    ]):
        return 0
    if any(token in lower for token in ["active", "enabled", "verified", "available"]):
        return False
    return ""


def records_to_csv(records: list[dict[str, Any]]) -> str:
    if not records:
        return ""

    headers = list(records[0].keys())
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    writer.writerows(records)
    return buffer.getvalue()


@app.get("/api/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.post("/api/schema/extract", response_model=SchemaExtractResponse)
async def extract_schema(request: SchemaExtractRequest) -> SchemaExtractResponse:
    if request.json_example:
        return SchemaExtractResponse(
            fields=[
                {"key": key, "description": ""}
                for key in request.json_example.keys()
            ]
        )

    if request.csv_example:
        lines = request.csv_example.strip().splitlines()
        if lines:
            headers = [h.strip() for h in lines[0].split(",")]
            return SchemaExtractResponse(
                fields=[{"key": header, "description": ""} for header in headers if header]
            )

    return SchemaExtractResponse(fields=[])


@app.post("/api/schema/generate-example")
async def generate_example(request: GenerateExampleRequest) -> dict[str, Any]:
    return {
        field.key: infer_default_value(field.key)
        for field in request.fields
        if field.key.strip()
    }


@app.post("/api/dataset/generate")
async def generate_dataset(request: DatasetGenerateRequest) -> list[dict[str, Any]] | DatasetCsvResponse:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing in backend/.env",
        )

    service = GeminiService(api_key=api_key, model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))

    try:
        records = await service.generate_records(request)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Gemini generation failed: {exc}") from exc

    if request.format == "csv":
        return DatasetCsvResponse(format="csv", data=records_to_csv(records))

    return records
