# OrbitLab Frontend

Frontend Angular do OrbitLab, hoje centrado em formulas de fisica e simulacao visual em tempo real.

O foco atual do produto e permitir que o usuario escreva uma formula, veja os parametros serem detectados automaticamente e acompanhe o comportamento fisico resultante no canvas, sem depender de banco de dados no fluxo principal.

## O que esta funcional agora

- campo principal de formula
- deteccao automatica de variaveis
- geracao de inputs dinamicos
- parser seguro com `mathjs`
- classificacao inicial do fenomeno
- simulacao em tempo real no canvas
- controle de velocidade da simulacao
- visualizacoes com:
  - 1 particula
  - 2 particulas
  - vetores
  - trajetorias
  - onda animada

## Dominios suportados

- Cinematica
- Dinamica simples
- Oscilacao
- Gravitacao basica
- Ondas viajantes simples
- Optica guiada
- Eletromagnetismo introdutorio
- Termodinamica visual
- Expressoes genericas com fallback seguro

## Biblioteca visual

- `/simulations/library` lista os experimentos salvos
- a biblioteca limpa metadados internos de formula antes de renderizar
- e possivel buscar por nome, descricao, formula e filtrar por dominio

## Exemplos de formulas

```txt
x = x0 + v*t
y = v0*t - (g*t^2)/2
ax = -k*x/m
x = A*cos(w*t)
F = G*(m1*m2)/r^2
y = A*sin(k*x - w*t)
```

## Rotas principais

- `/simulations`: laboratorio principal, formula-first
- `/simulations/library`: biblioteca secundaria de simulacoes
- `/simulations/:id`: detalhe de simulacao

Rotas antigas de criacao manual foram redirecionadas para o fluxo principal.

## Estrutura de pastas

```txt
src/app/
|- core/
|  \- config/
|     \- api.config.ts
\- features/
   \- simulations/
      |- components/
      |- engine/
      |- formula/
      |  |- modules/
      |  |- solvers/
      |  \- visualizers/
      |- models/
      |- pages/
      |- rendering/
      \- services/
```

## Como a arquitetura esta organizada

### UI

Pages e components so coordenam entrada do usuario, estado visual e eventos.

### Parser matematico

Responsavel por validar a formula, normalizar a entrada e gerar a AST com `mathjs`.

Arquivos principais:

- `formula-scenario-parser.service.ts`
- `formula-scenario-evaluator.service.ts`

### Classificador fisico

Analisa simbolos, funcoes e alvo da expressao para identificar o dominio e a estrategia de resolucao.

Arquivos principais:

- `formula-scenario-classifier.service.ts`
- `formula/modules/*`

### Solver

Escolhe como a simulacao sera calculada:

- expressao direta
- integracao de estado
- forca entre dois corpos
- amostragem de onda

Arquivos principais:

- `formula-scenario-engine.service.ts`
- `formula/solvers/*`

### Engine visual

Traduz o estado numerico em uma cena compativel com o fenomeno:

- particula
- interacao entre pares
- trajetoria
- padrao oscilatorio
- onda

Arquivos principais:

- `formula-scenario-visualization.service.ts`
- `formula/visualizers/*`
- `rendering/simulation-canvas-renderer.service.ts`

## Como a tela principal funciona

1. o usuario digita uma formula no formato `alvo = expressao`
2. o parser valida e extrai os simbolos
3. as variaveis viram inputs automaticamente
4. o classificador escolhe o dominio fisico inicial
5. o solver calcula a evolucao no tempo
6. o visualizer escolhe a cena
7. o canvas renderiza a animacao

## Como a decisao visual e feita

Alguns exemplos:

- formulas simples de `x` ou `y` tendem a usar `1 particula`
- leis de forca entre pares, como gravitacao, usam `2 particulas`
- expressoes com velocidade, aceleracao ou interacao podem ativar `vetores`
- movimento no tempo costuma manter `trajetoria`
- expressoes de onda com `sin` ou `cos`, `x` e `t` usam visualizacao de `onda`

## Integracao com o backend

O frontend usa o backend apenas onde faz sentido, via `HttpClient`, com a base:

```txt
http://localhost:3000/api
```

O fluxo principal do laboratorio nao depende de banco. A API continua disponivel para simulacoes e para compatibilidade com a estrutura existente.

## Como rodar

```bash
cd frontend
npm install
npm start
```

Aplicacao local:

```txt
http://localhost:4200/simulations
```

## Scripts

```bash
npm run build
npm start
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Testabilidade

O frontend foi organizado para manter a logica fora da UI sempre que possivel.

Isso permite testar separadamente:

- parser
- classificador
- solvers
- visualizers
- runner
- services de integracao
- components e pages

## Limitacoes atuais

- a melhor entrada hoje e `uma formula por vez`
- o formato esperado ainda e `alvo = expressao`
- parte dos dominios avancados ainda depende de cenarios guiados
- nem toda a fisica classica esta suportada nesta etapa

## Visao de crescimento

A base atual foi desenhada para crescer por modulos, sem reescrever o laboratorio:

- novos classificadores por dominio
- novos solvers
- novos visualizers
- novos cenarios guiados quando formula livre ainda nao for a melhor UX
