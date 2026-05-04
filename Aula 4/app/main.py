from fastapi import FastAPI

from app.middlewares.custom_header import register_custom_header
from app.middlewares.logging import register_request_logging
from app.routes.aluno_routes import router as aluno_router


def create_app() -> FastAPI:
    application = FastAPI(title="Gestão de Alunos", version="1.0.0")
    register_request_logging(application)
    register_custom_header(application)
    application.include_router(aluno_router)
    return application


app = create_app()
