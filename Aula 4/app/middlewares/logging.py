import time

from fastapi import FastAPI, Request


def register_request_logging(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        print(f"{request.method} {request.url.path} - {process_time:.4f}s")
        return response
