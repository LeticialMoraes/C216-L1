FROM python:3.10-slim

WORKDIR /app

COPY ["Aula 1/sistema_faculdade.py", "sistema_faculdade.py"]

CMD ["python", "-u", "sistema_faculdade.py"]
