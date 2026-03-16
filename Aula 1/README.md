# Sistema de CRUD de Alunos do INATEL- Python

## Descrição

Este projeto consiste em um sistema simples desenvolvido em **Python** que roda no **terminal** e permite realizar operações de **CRUD (Create, Read, Update e Delete)** para gerenciar alunos de cursos de engenharia do Inatel.

O sistema permite cadastrar alunos, listar alunos cadastrados, atualizar informações e remover alunos do sistema. Cada aluno possui uma **matrícula gerada automaticamente** com base no curso escolhido.

---

## Funcionalidades

O sistema possui as seguintes funcionalidades:

- Cadastrar aluno
- Listar alunos
- Atualizar dados de um aluno
- Remover aluno
- Geração automática de matrícula
- Validação de cursos disponíveis

---

## Estrutura dos Dados

Os alunos são armazenados utilizando:

- **Lista** para armazenar os alunos
- **Dicionário** para representar cada aluno

Exemplo de estrutura de um aluno:

```python
{
    "nome": "João Silva",
    "email": "joao@email.com",
    "curso": "GES",
    "matricula": "GES1"
}