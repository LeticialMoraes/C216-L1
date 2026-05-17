from fastapi import FastAPI, Request


def register_custom_header(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_custom_header(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-App"] = "gestao-alunos"
        return response
