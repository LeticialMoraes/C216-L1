DROP TABLE IF EXISTS alunos;
DROP TABLE IF EXISTS curso_contadores;

CREATE TABLE alunos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    curso TEXT NOT NULL,
    matricula INTEGER NOT NULL
);

CREATE TABLE curso_contadores (
    curso TEXT PRIMARY KEY,
    proximo INTEGER NOT NULL DEFAULT 1
);

INSERT INTO curso_contadores (curso, proximo) VALUES ('GES', 1), ('GEC', 1);
