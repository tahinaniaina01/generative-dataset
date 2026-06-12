import json
from typing import Any

import httpx

from .schemas import DatasetGenerateRequest


class GeminiService:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model

    async def generate_records(self, request: DatasetGenerateRequest) -> list[dict[str, Any]]:
        prompt = self._build_prompt(request)
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code >= 400:
            raise RuntimeError(
                f"Gemini API error {response.status_code}: {response.text[:600]}"
            )

        body = response.json()
        raw_text = self._extract_text(body)
        if not raw_text:
            raise RuntimeError("Gemini response did not contain text.")

        parsed = self._parse_json_array(raw_text)
        return self._normalize_records(parsed, request)

    def _extract_text(self, body: dict[str, Any]) -> str:
        candidates = body.get("candidates")
        if isinstance(candidates, list):
            for candidate in candidates:
                if not isinstance(candidate, dict):
                    continue
                content = candidate.get("content")
                if not isinstance(content, dict):
                    continue
                parts = content.get("parts")
                if not isinstance(parts, list):
                    continue
                for part in parts:
                    if isinstance(part, dict) and isinstance(part.get("text"), str):
                        return part["text"]

        if isinstance(body.get("text"), str):
            return body["text"]

        return ""

    def _build_prompt(self, request: DatasetGenerateRequest) -> str:
        fields_desc = "\n".join(
            f'- "{field.key}": {field.description or "No description"}'
            for field in request.fields
        )
        expected_keys = [field.key for field in request.fields]
        return (
            "Generate synthetic dataset records.\n"
            f"Language: {request.language}.\n"
            f"Number of records: {request.count}.\n"
            "Return ONLY a valid JSON array, without markdown and without comments.\n"
            "Each item must be a JSON object containing exactly these keys:\n"
            f"{json.dumps(expected_keys, ensure_ascii=True)}\n"
            "Field details:\n"
            f"{fields_desc}\n"
            "Rules:\n"
            "- Use realistic values according to each field meaning.\n"
            "- Keep field names exactly as provided (case-sensitive).\n"
            "- Ensure output is strict JSON and parseable.\n"
        )

    def _parse_json_array(self, raw_text: str) -> list[dict[str, Any]]:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```json").removeprefix("```")
            cleaned = cleaned.removesuffix("```")
            cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        if not isinstance(parsed, list):
            raise RuntimeError("Gemini output is not a JSON array.")
        if not all(isinstance(item, dict) for item in parsed):
            raise RuntimeError("Gemini output array must contain only JSON objects.")
        return parsed

    def _normalize_records(
        self,
        records: list[dict[str, Any]],
        request: DatasetGenerateRequest,
    ) -> list[dict[str, Any]]:
        keys = [field.key for field in request.fields]
        normalized: list[dict[str, Any]] = []

        for index in range(request.count):
            source = records[index] if index < len(records) else {}
            obj: dict[str, Any] = {}
            for key in keys:
                obj[key] = source.get(key)
            normalized.append(obj)

        return normalized
