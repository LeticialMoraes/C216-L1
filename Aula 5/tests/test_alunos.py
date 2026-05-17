from fastapi.testclient import TestClient

from app.main import app

URL = "/api/v1/alunos"


def _reset(client: TestClient) -> None:
    client.delete(f"{URL}/")


def test_criar_aluno(client: TestClient) -> None:
    _reset(client)
    response = client.post(
        f"{URL}/",
        json={
            "nome": "Rafael Costa",
            "email": "rafael.costa@inatel.br",
            "curso": "GES",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nome"] == "Rafael Costa"
    assert body["id"] == "GES1"
    assert body["matricula"] == 1


def test_listar_alunos(client: TestClient) -> None:
    _reset(client)
    client.post(
        f"{URL}/",
        json={"nome": "Beatriz Lima", "email": "beatriz.lima@inatel.br", "curso": "GES"},
    )
    client.post(
        f"{URL}/",
        json={"nome": "Thiago Nunes", "email": "thiago.nunes@inatel.br", "curso": "GEC"},
    )

    response = client.get(f"{URL}/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_buscar_aluno(client: TestClient) -> None:
    _reset(client)
    criado = client.post(
        f"{URL}/",
        json={"nome": "Camila Rocha", "email": "camila.rocha@inatel.br", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.get(f"{URL}/{aluno_id}")
    assert response.status_code == 200
    assert response.json()["email"] == "camila.rocha@inatel.br"


def test_atualizar_aluno(client: TestClient) -> None:
    _reset(client)
    criado = client.post(
        f"{URL}/",
        json={"nome": "Débora Alves", "email": "debora.alves@inatel.br", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.patch(
        f"{URL}/{aluno_id}",
        json={"nome": "Débora Alves Corrêa", "email": "debora.correa@inatel.br"},
    )

    assert response.status_code == 200
    assert response.json()["nome"] == "Débora Alves Corrêa"
    assert response.json()["id"] == aluno_id


def test_deletar_aluno(client: TestClient) -> None:
    _reset(client)
    criado = client.post(
        f"{URL}/",
        json={"nome": "Felipe Mendes", "email": "felipe.mendes@inatel.br", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.delete(f"{URL}/{aluno_id}")
    assert response.status_code == 204
    assert client.get(f"{URL}/{aluno_id}").status_code == 404


def test_tres_alunos_por_curso(client: TestClient) -> None:
    _reset(client)
    nomes_ges = ["Helena Dias", "Igor Pires", "Júlia Cardoso"]
    nomes_gec = ["Kauê Barbosa", "Larissa Moura", "Marcos Teixeira"]

    for curso, nomes in (("GES", nomes_ges), ("GEC", nomes_gec)):
        ids = []
        for i, nome in enumerate(nomes):
            response = client.post(
                f"{URL}/",
                json={
                    "nome": nome,
                    "email": f"{curso.lower()}.turma{i + 1}@inatel.br",
                    "curso": curso,
                },
            )
            assert response.status_code == 201
            ids.append(response.json()["id"])

        assert ids == [f"{curso}1", f"{curso}2", f"{curso}3"]

    listagem = client.get(f"{URL}/").json()
    assert len(listagem) == 6


def test_proximo_id_apos_delete_nao_volta_atras(client: TestClient) -> None:
    _reset(client)
    client.post(
        f"{URL}/",
        json={"nome": "Natália Freitas", "email": "natalia.freitas@inatel.br", "curso": "GES"},
    )
    client.delete(f"{URL}/GES1")

    response = client.post(
        f"{URL}/",
        json={"nome": "Otávio Prado", "email": "otavio.prado@inatel.br", "curso": "GES"},
    )
    assert response.json()["id"] == "GES2"


def test_persistencia_dados_no_postgresql(client: TestClient) -> None:
    _reset(client)
    client.post(
        f"{URL}/",
        json={"nome": "Patrícia Gomes", "email": "patricia.gomes@inatel.br", "curso": "GES"},
    )
    client.post(
        f"{URL}/",
        json={"nome": "Renato Vieira", "email": "renato.vieira@inatel.br", "curso": "GEC"},
    )

    outro_client = TestClient(app)
    listagem = outro_client.get(f"{URL}/").json()
    assert len(listagem) == 2

    assert outro_client.get(f"{URL}/GES1").json()["nome"] == "Patrícia Gomes"
    assert outro_client.get(f"{URL}/GEC1").json()["nome"] == "Renato Vieira"


def test_persistencia_apos_limpar_apenas_memoria_nao_aplica(client: TestClient) -> None:
    _reset(client)
    nomes = ["Sofia Andrade", "Túlio Campos", "Úrsula Duarte"]
    for i, nome in enumerate(nomes):
        client.post(
            f"{URL}/",
            json={"nome": nome, "email": f"ges.turma{i + 1}@inatel.br", "curso": "GES"},
        )

    assert len(client.get(f"{URL}/").json()) == 3

    outro_client = TestClient(app)
    assert len(outro_client.get(f"{URL}/").json()) == 3
    assert outro_client.get(f"{URL}/GES2").json()["nome"] == "Túlio Campos"


def test_buscar_aluno_inexistente_retorna_404(client: TestClient) -> None:
    _reset(client)
    response = client.get(f"{URL}/GES99")
    assert response.status_code == 404


def test_patch_sem_nenhum_campo_retorna_400(client: TestClient) -> None:
    _reset(client)
    client.post(
        f"{URL}/",
        json={"nome": "Vitor Hugo", "email": "vitor.hugo@inatel.br", "curso": "GES"},
    )
    response = client.patch(f"{URL}/GES1", json={})
    assert response.status_code == 400
