from fastapi import APIRouter, HTTPException, status

from app.schemas.aluno import AlunoCreate, AlunoResponse, AlunoUpdate
from app.services.aluno_service import (
    AlunoNaoEncontradoError,
    NenhumCampoParaAtualizarError,
    aluno_service,
)

router = APIRouter(prefix="/api/v1/alunos", tags=["alunos"])


def _nao_encontrado() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")


@router.post("/", response_model=AlunoResponse, status_code=status.HTTP_201_CREATED)
def criar_aluno(payload: AlunoCreate) -> AlunoResponse:
    return aluno_service.criar(payload)


@router.get("/", response_model=list[AlunoResponse])
def listar_alunos() -> list[AlunoResponse]:
    return aluno_service.listar()


@router.get("/{aluno_id}", response_model=AlunoResponse)
def obter_aluno(aluno_id: str) -> AlunoResponse:
    try:
        return aluno_service.obter(aluno_id)
    except AlunoNaoEncontradoError:
        raise _nao_encontrado() from None


@router.patch("/{aluno_id}", response_model=AlunoResponse)
def atualizar_aluno(aluno_id: str, payload: AlunoUpdate) -> AlunoResponse:
    try:
        return aluno_service.atualizar(aluno_id, payload)
    except AlunoNaoEncontradoError:
        raise _nao_encontrado() from None
    except NenhumCampoParaAtualizarError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum campo para atualizar",
        ) from None


@router.delete("/")
def limpar_todos_alunos() -> dict[str, str]:
    return aluno_service.limpar_todos()


@router.delete("/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_aluno(aluno_id: str) -> None:
    try:
        aluno_service.remover(aluno_id)
    except AlunoNaoEncontradoError:
        raise _nao_encontrado() from None
