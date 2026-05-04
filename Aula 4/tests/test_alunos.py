from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
URL = "/api/v1/alunos"


def _reset():
    client.delete(f"{URL}/")


def test_criar_aluno():
    _reset()
    response = client.post(
        f"{URL}/",
        json={
            "nome": "João Teste",
            "email": "joao@teste.com",
            "curso": "GES",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nome"] == "João Teste"
    assert body["id"] == "GES1"
    assert body["matricula"] == 1


def test_listar_alunos():
    _reset()
    client.post(f"{URL}/", json={"nome": "A", "email": "a@t.com", "curso": "GES"})
    client.post(f"{URL}/", json={"nome": "B", "email": "b@t.com", "curso": "GEC"})

    response = client.get(f"{URL}/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_buscar_aluno():
    _reset()
    criado = client.post(
        f"{URL}/",
        json={"nome": "Maria", "email": "maria@t.com", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.get(f"{URL}/{aluno_id}")
    assert response.status_code == 200
    assert response.json()["email"] == "maria@t.com"


def test_atualizar_aluno():
    _reset()
    criado = client.post(
        f"{URL}/",
        json={"nome": "Velho", "email": "velho@t.com", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.patch(
        f"{URL}/{aluno_id}",
        json={"nome": "Novo nome", "email": "novo@t.com"},
    )

    assert response.status_code == 200
    assert response.json()["nome"] == "Novo nome"
    assert response.json()["id"] == aluno_id


def test_deletar_aluno():
    _reset()
    criado = client.post(
        f"{URL}/",
        json={"nome": "Sai fora", "email": "del@t.com", "curso": "GES"},
    )
    aluno_id = criado.json()["id"]

    response = client.delete(f"{URL}/{aluno_id}")
    assert response.status_code == 204

    assert client.get(f"{URL}/{aluno_id}").status_code == 404


def test_criar_aluno_gec():
    _reset()
    response = client.post(
        f"{URL}/",
        json={"nome": "Curso GEC", "email": "gec@t.com", "curso": "GEC"},
    )
    assert response.status_code == 201
    assert response.json()["id"] == "GEC1"


def test_proximo_id_apos_delete_nao_volta_atras():
    _reset()
    client.post(f"{URL}/", json={"nome": "Um", "email": "1@t.com", "curso": "GES"})
    client.delete(f"{URL}/GES1")

    response = client.post(
        f"{URL}/",
        json={"nome": "Dois", "email": "2@t.com", "curso": "GES"},
    )
    assert response.json()["id"] == "GES2"


def test_limpar_todos_os_alunos():
    _reset()
    client.post(f"{URL}/", json={"nome": "X", "email": "x@t.com", "curso": "GES"})

    response = client.delete(f"{URL}/")
    assert response.status_code == 200

    assert client.get(f"{URL}/").json() == []

    novo = client.post(
        f"{URL}/",
        json={"nome": "Depois do reset", "email": "z@t.com", "curso": "GES"},
    )
    assert novo.json()["id"] == "GES1"


def test_cadastro_sem_email_retorna_erro_de_validacao():
    _reset()
    response = client.post(
        f"{URL}/",
        json={"nome": "Sem email", "curso": "GES"},
    )
    assert response.status_code == 422


def test_buscar_aluno_inexistente_retorna_404():
    _reset()
    response = client.get(f"{URL}/GES99")
    assert response.status_code == 404


def test_patch_sem_nenhum_campo_retorna_400():
    _reset()
    client.post(f"{URL}/", json={"nome": "X", "email": "x@t.com", "curso": "GES"})

    response = client.patch(f"{URL}/GES1", json={})
    assert response.status_code == 400


def test_tres_alunos_ges_em_sequencia():
    _reset()
    ids = []
    for i in range(3):
        r = client.post(
            f"{URL}/",
            json={"nome": f"Aluno {i}", "email": f"a{i}@t.com", "curso": "GES"},
        )
        assert r.status_code == 201
        ids.append(r.json()["id"])

    assert ids == ["GES1", "GES2", "GES3"]
    assert len(client.get(f"{URL}/").json()) == 3
