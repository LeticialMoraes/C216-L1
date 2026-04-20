from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, FastAPI!"}


def test_query_param():
    response = client.get("/api/v1/hello?name=Laura")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello Laura"}


def test_path_param():
    response = client.get("/api/v1/hello/Bruno")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello Bruno"}


def test_post():
    response = client.post("/api/v1/hello", json={"name": "Helena"})
    assert response.status_code == 200
    assert response.json() == {"message": "Hello Helena"}


def test_post_invalid():
    response = client.post("/api/v1/hello", json={})
    assert response.status_code == 422


def test_put():
    # corpo com campo errado: a API espera "name", não "nome"
    response = client.put("/api/v1/update", json={"nome": "Ricardo"})
    assert response.status_code == 422


def test_delete():
    response = client.delete("/api/v1/delete?name=Paula")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Recurso deletado com o nome: Paula",
    }


def test_patch():
    response = client.patch("/api/v1/patch", json={"name": "Gustavo"})
    assert response.status_code == 200
    assert response.json() == {
        "message": "Modificação parcial aplicada ao recurso com o nome: Gustavo",
    }
