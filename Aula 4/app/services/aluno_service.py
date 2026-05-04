from __future__ import annotations

import threading

from app.schemas.aluno import AlunoCreate, AlunoResponse, AlunoUpdate, Curso


class AlunoNaoEncontradoError(Exception):
    pass


class NenhumCampoParaAtualizarError(Exception):
    pass


class AlunoService:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._alunos: dict[str, dict] = {}
        self._proximo_matricula: dict[str, int] = {
            Curso.GES.value: 1,
            Curso.GEC.value: 1,
        }

    def _gerar_id_e_matricula(self, curso: Curso) -> tuple[str, int]:
        with self._lock:
            n = self._proximo_matricula[curso.value]
            self._proximo_matricula[curso.value] = n + 1
            return f"{curso.value}{n}", n

    def criar(self, payload: AlunoCreate) -> AlunoResponse:
        aluno_id, matricula = self._gerar_id_e_matricula(payload.curso)
        registro = {
            "id": aluno_id,
            "nome": payload.nome,
            "email": str(payload.email),
            "curso": payload.curso.value,
            "matricula": matricula,
        }
        with self._lock:
            self._alunos[aluno_id] = registro
        return AlunoResponse(**registro)

    def listar(self) -> list[AlunoResponse]:
        with self._lock:
            return [AlunoResponse(**a) for a in self._alunos.values()]

    def obter(self, aluno_id: str) -> AlunoResponse:
        with self._lock:
            aluno = self._alunos.get(aluno_id)
        if aluno is None:
            raise AlunoNaoEncontradoError
        return AlunoResponse(**aluno)

    def atualizar(self, aluno_id: str, payload: AlunoUpdate) -> AlunoResponse:
        with self._lock:
            aluno = self._alunos.get(aluno_id)
            if aluno is None:
                raise AlunoNaoEncontradoError
            data = payload.model_dump(exclude_unset=True)
            if not data:
                raise NenhumCampoParaAtualizarError
            if "nome" in data:
                aluno["nome"] = data["nome"]
            if "email" in data:
                aluno["email"] = str(data["email"])
            self._alunos[aluno_id] = aluno
            out = dict(aluno)
        return AlunoResponse(**out)

    def limpar_todos(self) -> dict[str, str]:
        with self._lock:
            self._alunos.clear()
            self._proximo_matricula[Curso.GES.value] = 1
            self._proximo_matricula[Curso.GEC.value] = 1
        return {"message": "Lista de alunos e contadores foram resetados"}

    def remover(self, aluno_id: str) -> None:
        with self._lock:
            if aluno_id not in self._alunos:
                raise AlunoNaoEncontradoError
            del self._alunos[aluno_id]


aluno_service = AlunoService()
