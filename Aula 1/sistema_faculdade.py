alunos = []  # armazenando os alunos

cont_cursos = {}  # armazenando a quantidade de matriculas por curso

# Dicionário de cursos válidos do Inatel (Sigla ou nome completo)
cursos_validos = {
    "GES": "GES",
    "ENGENHARIA DE SOFTWARE": "GES",

    "GEC": "GEC",
    "ENGENHARIA DA COMPUTAÇÃO": "GEC",

    "GET": "GET",
    "ENGENHARIA DE TELECOMUNICAÇÕES": "GET",

    "GEP": "GEP",
    "ENGENHARIA DE PRODUÇÃO": "GEP",

    "GEA": "GEA",
    "ENGENHARIA DE CONTROLE E AUTOMAÇÃO": "GEA",

    "GEB": "GEB",
    "ENGENHARIA BIOMEDICA": "GEB",
    "ENGENHARIA BIOMÉDICA": "GEB",

    "GEE": "GEE",
    "ENGENHARIA ELETRICA": "GEE",
    "ENGENHARIA ELÉTRICA": "GEE"
}

# Função para mostrar cursos disponíveis
def listar_cursos():
    print("\nCursos disponíveis no Inatel:\n")
    print("GES - Engenharia de Software")
    print("GEC - Engenharia da Computação")
    print("GET - Engenharia de Telecomunicações")
    print("GEP - Engenharia de Produção")
    print("GEA - Engenharia de Controle e Automação")
    print("GEB - Engenharia Biomédica")
    print("GEE - Engenharia Elétrica")
    print()


# Função para validar o curso
def validar_curso(curso):
    curso = curso.upper().strip()

    if curso in cursos_validos:
        return cursos_validos[curso]
    else:
        raise ValueError("Curso inválido.")


# Função para gerar a matrícula
def gerar_matricula(curso):
    if curso not in cont_cursos:
        cont_cursos[curso] = 1
    else:
        cont_cursos[curso] += 1

    return f"{curso}{cont_cursos[curso]}"


# Função para criar aluno
def criar_aluno():
    try:
        nome = input("Nome do aluno: ").strip()
        email = input("Email do aluno: ").strip()

        listar_cursos()  # mostra os cursos antes da escolha

        curso_input = input("Curso (sigla ou nome completo): ")

        if not nome or not email or not curso_input:
            raise ValueError("Todos os campos devem ser preenchidos.")

        curso = validar_curso(curso_input)

        matricula = gerar_matricula(curso)

        aluno = {
            "nome": nome,
            "email": email,
            "curso": curso,
            "matricula": matricula
        }

        alunos.append(aluno)

        print("\nAluno cadastrado com sucesso!")
        print(f"Matrícula gerada: {matricula}\n")

    except ValueError as e:
        print(f"Erro: {e}")

    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")


# Função para listar alunos
def listar_alunos():
    if not alunos:
        print("\nNenhum aluno cadastrado.\n")
        return

    print("\nLista de alunos do Inatel:\n")

    for aluno in alunos:
        print(f"Matrícula: {aluno['matricula']}")
        print(f"Nome: {aluno['nome']}")
        print(f"Email: {aluno['email']}")
        print(f"Curso: {aluno['curso']}")
        print("----------------------")


# Função para atualizar aluno
def atualizar_aluno():
    try:
        matricula = input("Digite a matrícula do aluno que deseja atualizar: ").strip()

        for aluno in alunos:
            if aluno["matricula"] == matricula:

                novo_nome = input("Novo nome: ").strip()
                novo_email = input("Novo email: ").strip()

                if not novo_nome or not novo_email:
                    raise ValueError("Nome e email não podem estar vazios.")

                aluno["nome"] = novo_nome
                aluno["email"] = novo_email

                print("\nAluno atualizado com sucesso!\n")
                return

        print("\nAluno não encontrado.\n")

    except ValueError as e:
        print(f"Erro: {e}")

    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")


# Função para deletar aluno
def deletar_aluno():
    try:
        matricula = input("Digite a matrícula do aluno que deseja deletar: ").strip()

        for aluno in alunos:
            if aluno["matricula"] == matricula:
                alunos.remove(aluno)
                print("\nAluno removido com sucesso!\n")
                return

        print("\nAluno não encontrado.\n")

    except Exception as e:
        print(f"Erro ao remover aluno: {e}")


# Função para exibir o menu
def menu():
    while True:
        try:
            print("\n===== SISTEMA DE ALUNOS DO INATEL =====")
            print("1 - Cadastrar aluno")
            print("2 - Listar alunos")
            print("3 - Atualizar aluno")
            print("4 - Deletar aluno")
            print("5 - Sair")

            opcao = input("Escolha uma opção: ")

            if opcao == "1":
                criar_aluno()

            elif opcao == "2":
                listar_alunos()

            elif opcao == "3":
                atualizar_aluno()

            elif opcao == "4":
                deletar_aluno()

            elif opcao == "5":
                print("Encerrando sistema...")
                break

            else:
                print("Opção inválida!")

        except KeyboardInterrupt:
            print("\nPrograma interrompido pelo usuário.")
            break

        except Exception as e:
            print(f"Ocorreu um erro inesperado: {e}")


menu()