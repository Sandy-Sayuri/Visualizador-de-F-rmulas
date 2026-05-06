# OrbitLab

OrbitLab e um simulador visual de fisica classica com foco em formulas.

Hoje o fluxo principal do produto e `frontend-first`: o usuario digita uma formula, o sistema detecta variaveis, gera os inputs dinamicos e transforma a expressao em uma cena animada no canvas. O backend continua no projeto como API REST para simulacoes e como base para evolucoes futuras, mas a experiencia principal atual nao depende de banco de dados.

## O que o projeto entrega hoje

- Laboratorio de formulas fisicas no navegador
- Parser matematico com `mathjs`
- Deteccao automatica de variaveis
- Inputs dinamicos para parametros
- Classificacao inicial do fenomeno fisico
- Simulacao visual em tempo real
- Controle de velocidade da simulacao
- Renderizacao minima com particulas, vetores, trajetorias e onda
- API NestJS para criar, listar, consultar e remover simulacoes

## Dominios suportados agora

- Cinematica
- Dinamica simples
- Oscilacao
- Gravitacao basica
- Ondas viajantes simples
- Optica guiada
- Eletromagnetismo introdutorio
- Termodinamica visual
- Expressoes genericas com fallback seguro

## Biblioteca e exploracao

- Biblioteca com experimentos salvos no backend
- Releitura de simulacoes geradas por formula
- Busca e filtro por dominio na colecao salva

## Exemplos de formulas

```txt
x = x0 + v*t
y = v0*t - (g*t^2)/2
ax = -k*x/m
x = A*cos(w*t)
F = G*(m1*m2)/r^2
y = A*sin(k*x - w*t)
```

## Arquitetura do repositorio

```txt
.
|- backend/
|  |- src/
|  |  |- modules/simulations/
|  |  |  |- domain/
|  |  |  |- application/
|  |  |  |- infrastructure/
|  |  |  \- presentation/
|  \- README.md
|- frontend/
|  |- src/app/
|  |  |- core/
|  |  \- features/simulations/
|  |     |- components/
|  |     |- formula/
|  |     |- models/
|  |     |- pages/
|  |     |- rendering/
|  |     \- services/
|  \- README.md
\- README.md
```

## Como rodar

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

API local:

```txt
http://localhost:3000/api
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Aplicacao local:

```txt
http://localhost:4200/simulations
```

## Scripts uteis

### Backend

```bash
npm run build
npm run start:dev
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Frontend

```bash
npm run build
npm start
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Como o frontend funciona

O laboratorio segue uma cadeia modular:

1. `parser` valida a formula e extrai a AST com `mathjs`
2. `classifier` identifica o dominio fisico e a estrategia inicial
3. `solver` calcula o estado da simulacao ao longo do tempo
4. `visualizer` converte esse estado em elementos visuais
5. `canvas` renderiza a cena no navegador

Essa separacao permite crescer sem misturar UI, matematica e renderizacao.

## Como o backend funciona

O backend segue uma organizacao em camadas:

- `domain`: entidades, value objects e contratos
- `application`: casos de uso
- `infrastructure`: persistencia em memoria e preparacao para PostgreSQL
- `presentation`: controllers, DTOs, mappers e presenters

Os controllers ficam finos e toda a entrada HTTP passa por validacao.

## Testes

O projeto foi organizado para ser testavel desde o inicio:

- unitarios para parser, classificacao, solvers, visualizadores e casos de uso
- integracao para fluxos entre camadas
- e2e para os fluxos principais da UI e da API

## Observacoes importantes

- O fluxo principal atual nao grava nada em banco
- O backend ainda usa armazenamento em memoria no MVP
- O frontend ja cobre laboratorio livre e cenarios guiados em varios dominios
- Nem toda a fisica classica esta coberta ainda; a base foi feita para crescer com seguranca

## Documentacao especifica

- [Backend](./backend/README.md)
- [Frontend](./frontend/README.md)
