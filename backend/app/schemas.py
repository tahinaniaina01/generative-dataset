from typing import Any, Literal

from pydantic import BaseModel, Field


Language = Literal["english", "french", "malagasy", "spanish", "german", "japanese"]
OutputFormat = Literal["json", "csv", "xlsx"]
GenerationMode = Literal["ai"]


class FieldSchema(BaseModel):
    key: str = Field(min_length=1)
    description: str = ""


class SchemaExtractRequest(BaseModel):
    json_example: dict[str, Any] | None = None
    csv_example: str | None = None


class SchemaExtractResponse(BaseModel):
    fields: list[FieldSchema]


class GenerateExampleRequest(BaseModel):
    fields: list[FieldSchema]


class DatasetGenerateRequest(BaseModel):
    language: Language
    count: int = Field(ge=1, le=1000)
    format: OutputFormat
    fields: list[FieldSchema] = Field(min_length=1)
    mode: GenerationMode


class DatasetCsvResponse(BaseModel):
    format: Literal["csv"]
    data: str
