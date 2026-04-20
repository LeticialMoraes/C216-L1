from fastapi import FastAPI, Request
from pydantic import BaseModel
import time

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Executa a rota solicitada
    response = await call_next(request)

    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} - {process_time:.4f}s")

    return response


class User(BaseModel):
    name: str


@app.get("/")
async def hello_world():
    return {"message": "Hello, FastAPI!"}


@app.get("/api/v1/hello")
async def hello_name_via_query(name: str):
    return {"message": f"Hello {name}"}


@app.get("/api/v1/hello/{name}")
async def hello_name_via_path(name: str):
    return {"message": f"Hello {name}"}


@app.post("/api/v1/hello")
async def hello_name(user: User):
    return {"message": f"Hello {user.name}"}


@app.put("/api/v1/update")
async def user_update(user: User):
    return {"message": f"Recurso atualizado com o nome: {user.name}"}


@app.delete("/api/v1/delete")
async def delete_user_by_name(name: str):
    return {"message": f"Recurso deletado com o nome: {name}"}


@app.patch("/api/v1/patch")
async def patch_user(user: User):
    return {"message": f"Modificação parcial aplicada ao recurso com o nome: {user.name}"}
