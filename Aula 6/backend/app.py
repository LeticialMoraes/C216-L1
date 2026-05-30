import os
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify(status="ok", service="aula6-backend")


@app.route("/")
def root():
    return jsonify(
        message="Backend da Aula 6",
        hint="O frontend Flask está na porta 3000.",
    )


if __name__ == "__main__":
    # Opcional: testar DATABASE_URL sem bloquear o subir do container
    _ = os.environ.get("DATABASE_URL", "")
    app.run(host="0.0.0.0", port=8000, debug=False)
