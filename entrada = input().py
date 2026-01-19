entrada = input().strip()

def descrever_tecnica(tecnica):
    if tecnica == "Prompt claro e especifico para tarefa de programacao":
        return "Define o objetivo e as restricoes da tarefa de forma precisa"

    elif tecnica == "Persona de sistema definindo papel e tom da IA":
        return "Atribui um papel ou identidade especifica a IA"

    elif tecnica == "Few-shot prompting com poucos exemplos no proprio prompt":
        return "Fornece exemplos de entrada e saida para guiar a resposta"

    elif tecnica == "Cadeia de pensamento pedindo raciocinio detalhado":
        return "Solicita que a IA explique o raciocinio passo a passo"

    else:
        return "Tecnica desconhecida"

print(descrever_tecnica(entrada))
