# OrbitLab Backend

Backend NestJS responsavel pela API REST de simulacoes do OrbitLab.

O backend foi mantido modular desde o inicio para permitir evolucao segura do MVP em memoria para uma persistencia futura em PostgreSQL, sem contaminar os casos de uso com detalhes de framework ou banco.

## Responsabilidade atual

- Expor API REST para simulacoes
- Validar payloads com DTOs
- Aplicar regras de dominio
- Manter controllers finos
- Servir como base para persistencia futura

## Stack

- NestJS
- TypeScript
- class-validator
- class-transformer
- Jest para testes

## Configuracao global da aplicacao

Em [`src/app.factory.ts`](./src/app.factory.ts), a app e configurada com:

- `CORS` habilitado
- prefixo global `/api`
- `ValidationPipe` global
- filtro global para excecoes de dominio

## Endpoints disponiveis

Base URL local:

```txt
http://localhost:3000/api
```

Documentacao Swagger:

```txt
http://localhost:3000/api/docs
```

### Criar simulacao

```http
POST /api/simulations
```

Exemplo de payload:

```json
{
  "name": "Terra e Lua",
  "description": "Cena inicial em memoria",
  "bodies": [
    {
      "name": "Terra",
      "mass": 5972000000000000000000000,
      "radius": 6371,
      "color": "#4f83ff",
      "position": { "x": 0, "y": 0 },
      "velocity": { "x": 0, "y": 0 }
    },
    {
      "name": "Lua",
      "mass": 73470000000000000000000,
      "radius": 1737,
      "color": "#dddddd",
      "position": { "x": 384400, "y": 0 },
      "velocity": { "x": 0, "y": 1.022 }
    }
  ]
}
```

### Listar simulacoes

```http
GET /api/simulations
```

Retorno em ordem da simulacao mais recentemente atualizada para a mais antiga.

### Buscar simulacao por id

```http
GET /api/simulations/:id
```

### Remover simulacao

```http
DELETE /api/simulations/:id
```

Retorno:

```http
204 No Content
```

## Validacoes principais

### Simulation

- `name`: obrigatorio, string, maximo de 120 caracteres
- `description`: opcional, string, maximo de 500 caracteres
- `bodies`: array obrigatorio

### Body

- `name`: obrigatorio, string, maximo de 80 caracteres
- `mass`: numero maior que `0.0000001`
- `radius`: numero maior que `0.0000001`
- `color`: obrigatorio, string, maximo de 40 caracteres
- `position.x` e `position.y`: numeros validos
- `velocity.x` e `velocity.y`: numeros validos

## Estrutura de pastas

```txt
src/
|- app.factory.ts
|- app.module.ts
|- main.ts
|- modules/
|  \- simulations/
|     |- application/
|     |  |- commands/
|     |  \- use-cases/
|     |- domain/
|     |  |- entities/
|     |  |- errors/
|     |  |- repositories/
|     |  \- value-objects/
|     |- infrastructure/
|     |  \- persistence/
|     \- presentation/
|        |- controllers/
|        |- dto/
|        |- mappers/
|        \- presenters/
\- shared/
   \- presentation/filters/
```

## Como a arquitetura foi aplicada

### Domain

Contem entidades como `Simulation` e `Body`, erros de negocio e contratos de repositorio.

### Application

Concentra os casos de uso:

- criar simulacao
- listar simulacoes
- consultar simulacao
- remover simulacao

### Infrastructure

Implementa a persistencia atual em memoria e deixa a porta pronta para uma implementacao futura em PostgreSQL.

### Presentation

Recebe HTTP, valida DTOs, faz o mapeamento explicito de request para comando de aplicacao e converte o resultado para resposta HTTP.

## Principios aplicados

- `SRP`: cada camada tem uma responsabilidade clara
- `DIP`: casos de uso dependem da abstracao de repositorio
- `OCP`: o repositorio atual pode ser trocado sem alterar a regra de negocio
- DTOs nao sao usados como entidades de dominio
- mapeamento explicito e feito em `presentation/mappers`

## Como rodar

```bash
cd backend
npm install
npm run start:dev
```

Build de producao:

```bash
npm run build
npm start
```

## Testes

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Estado atual e proximos passos

Hoje o backend:

- funciona sem banco
- guarda os dados apenas em memoria
- atende o contrato REST principal

Proximo passo natural:

- adicionar implementacao PostgreSQL em `infrastructure/persistence/postgresql`
- manter os mesmos casos de uso e contratos

Existe uma nota especifica sobre a futura persistencia em [`src/modules/simulations/infrastructure/persistence/postgresql/README.md`](./src/modules/simulations/infrastructure/persistence/postgresql/README.md).
