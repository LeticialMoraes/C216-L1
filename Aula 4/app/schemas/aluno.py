from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Curso(str, Enum):
    GES = "GES"
    GEC = "GEC"


class AlunoCreate(BaseModel):
    nome: str = Field(..., min_length=1)
    email: EmailStr
    curso: Curso


class AlunoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1)
    email: Optional[EmailStr] = None


class AlunoResponse(BaseModel):
    id: str
    nome: str
    email: str
    curso: str
    matricula: int
