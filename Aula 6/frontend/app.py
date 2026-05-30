import os

import requests
from flask import Flask, flash, redirect, render_template, request, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "secret")

ALUNA = "Leticia Luane Moraes"
MATRICULA = "352"

API_URL = os.environ.get(
    "API_URL", "http://backend:8000/api/v1/professores"
).rstrip("/")


@app.context_processor
def inject_aluno():
    return {"aluna": ALUNA, "matricula": MATRICULA}


@app.route("/")
def home():
    return render_template("home.html", titulo="Início")


@app.route("/about")
def about():
    return render_template("about.html", titulo="Sobre")


@app.route("/contact")
def contact():
    return render_template("contact.html", titulo="Contato")


@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if request.method == "POST":
        data = {
            "nome": request.form["nome"],
            "email": request.form["email"],
            "sala_de_atendimento": request.form["sala_de_atendimento"],
        }
        response = requests.post(f"{API_URL}/", json=data, timeout=30)
        if response.status_code == 201:
            flash("Professor cadastrado com sucesso!", "success")
            return redirect(url_for("professores"))
        try:
            detail = response.json().get("detail", "Erro ao cadastrar professor.")
        except Exception:
            detail = "Erro ao cadastrar professor."
        flash(detail, "danger")
    return render_template("cadastro.html", titulo="Cadastro")


@app.route("/professores")
def professores():
    try:
        response = requests.get(f"{API_URL}/", timeout=30)
        lista = response.json() if response.ok else []
    except requests.RequestException:
        lista = []
        flash("Não foi possível conectar à API do backend.", "danger")
    return render_template("professores.html", titulo="Professores", professores=lista)


@app.route("/editar/<int:professor_id>", methods=["GET", "POST"])
def editar(professor_id):
    if request.method == "POST":
        data = {
            "nome": request.form["nome"],
            "email": request.form["email"],
            "sala_de_atendimento": request.form["sala_de_atendimento"],
        }
        response = requests.patch(f"{API_URL}/{professor_id}", json=data, timeout=30)
        if response.ok:
            flash("Professor atualizado com sucesso!", "success")
        else:
            flash("Erro ao atualizar professor.", "danger")
        return redirect(url_for("professores"))
    try:
        r = requests.get(f"{API_URL}/{professor_id}", timeout=30)
        prof = r.json() if r.ok else {}
    except requests.RequestException:
        prof = {}
    if not prof:
        flash("Professor não encontrado.", "danger")
        return redirect(url_for("professores"))
    return render_template("editar.html", titulo="Editar professor", professor=prof)


@app.route("/excluir/<int:professor_id>")
def excluir(professor_id):
    try:
        response = requests.delete(f"{API_URL}/{professor_id}", timeout=30)
        if response.ok:
            flash("Professor removido com sucesso!", "success")
        else:
            flash("Erro ao remover professor.", "danger")
    except requests.RequestException:
        flash("Erro ao conectar à API.", "danger")
    return redirect(url_for("professores"))


@app.route("/reset")
def reset():
    try:
        response = requests.delete(f"{API_URL}/", timeout=30)
        if response.ok:
            flash("Banco de dados resetado com sucesso!", "info")
        else:
            flash("Erro ao resetar banco.", "danger")
    except requests.RequestException:
        flash("Erro ao conectar à API.", "danger")
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=3000)
