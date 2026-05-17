from __future__ import annotations

from app.db.connection import get_connection
from app.schemas.aluno import AlunoCreate, AlunoResponse, AlunoUpdate, Curso


class AlunoNaoEncontradoError(Exception):
    pass


class NenhumCampoParaAtualizarError(Exception):
    pass


class AlunoService:
    async def criar(self, payload: AlunoCreate) -> AlunoResponse:
        conn = await get_connection()
        try:
            async with conn.transaction():
                row = await conn.fetchrow(
                    "SELECT proximo FROM curso_contadores WHERE curso = $1 FOR UPDATE",
                    payload.curso.value,
                )
                if row is None:
                    await conn.execute(
                        "INSERT INTO curso_contadores (curso, proximo) VALUES ($1, 1)",
                        payload.curso.value,
                    )
                    matricula = 1
                else:
                    matricula = row["proximo"]
                aluno_id = f"{payload.curso.value}{matricula}"
                await conn.execute(
                    "UPDATE curso_contadores SET proximo = proximo + 1 WHERE curso = $1",
                    payload.curso.value,
                )
                row = await conn.fetchrow(
                    """
                    INSERT INTO alunos (id, nome, email, curso, matricula)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                    """,
                    aluno_id,
                    payload.nome,
                    str(payload.email),
                    payload.curso.value,
                    matricula,
                )
            return AlunoResponse(**dict(row))
        finally:
            await conn.close()

    async def listar(self) -> list[AlunoResponse]:
        conn = await get_connection()
        try:
            rows = await conn.fetch("SELECT * FROM alunos ORDER BY id")
            return [AlunoResponse(**dict(row)) for row in rows]
        finally:
            await conn.close()

    async def obter(self, aluno_id: str) -> AlunoResponse:
        conn = await get_connection()
        try:
            row = await conn.fetchrow("SELECT * FROM alunos WHERE id = $1", aluno_id)
            if row is None:
                raise AlunoNaoEncontradoError
            return AlunoResponse(**dict(row))
        finally:
            await conn.close()

    async def atualizar(self, aluno_id: str, payload: AlunoUpdate) -> AlunoResponse:
        data = payload.model_dump(exclude_unset=True)
        if not data:
            raise NenhumCampoParaAtualizarError

        conn = await get_connection()
        try:
            atual = await conn.fetchrow("SELECT * FROM alunos WHERE id = $1", aluno_id)
            if atual is None:
                raise AlunoNaoEncontradoError

            nome = data.get("nome", atual["nome"])
            email = str(data["email"]) if "email" in data else atual["email"]

            row = await conn.fetchrow(
                """
                UPDATE alunos
                SET nome = $1, email = $2
                WHERE id = $3
                RETURNING *
                """,
                nome,
                email,
                aluno_id,
            )
            return AlunoResponse(**dict(row))
        finally:
            await conn.close()

    async def limpar_todos(self) -> dict[str, str]:
        conn = await get_connection()
        try:
            async with conn.transaction():
                await conn.execute("DELETE FROM alunos")
                await conn.execute(
                    "UPDATE curso_contadores SET proximo = 1 WHERE curso IN ('GES', 'GEC')"
                )
            return {"message": "Lista de alunos e contadores foram resetados"}
        finally:
            await conn.close()

    async def remover(self, aluno_id: str) -> None:
        conn = await get_connection()
        try:
            result = await conn.execute("DELETE FROM alunos WHERE id = $1", aluno_id)
            if result != "DELETE 1":
                raise AlunoNaoEncontradoError
        finally:
            await conn.close()


aluno_service = AlunoService()
