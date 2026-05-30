-- Script de inicialização do banco (laboratório distribuído)
CREATE TABLE IF NOT EXISTS professores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL
);

INSERT INTO professores (nome) VALUES ('Disciplina C216 - exemplo');
