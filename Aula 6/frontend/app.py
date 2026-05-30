from flask import Flask, render_template

app = Flask(__name__)

ALUNA = "Leticia Luane Moraes"
MATRICULA = "352"


@app.route("/")
def home():
    return render_template(
        "index.html",
        titulo="Início",
        aluna=ALUNA,
        matricula=MATRICULA,
    )


@app.route("/about")
def about():
    return render_template(
        "about.html",
        titulo="Sobre",
        aluna=ALUNA,
        matricula=MATRICULA,
    )


@app.route("/contact")
def contact():
    return render_template(
        "contact.html",
        titulo="Contato",
        aluna=ALUNA,
        matricula=MATRICULA,
    )


if __name__ == "__main__":
    # debug=False evita o reloader duplicar processo dentro do container
    app.run(debug=False, host="0.0.0.0", port=3000)
