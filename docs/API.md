# API Endpoints - Diesel Bar

Base URL: `http://localhost:3000/api`

## Authentication

### POST /auth/login

Login de usuário

**Request:**

```json
{
  "email": "admin@demo.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin Demo",
    "email": "admin@demo.com",
    "role": "ADMIN",
    "establishmentId": "uuid"
  }
}
```

### POST /auth/register

Registrar novo estabelecimento

**Request:**

```json
{
  "name": "João Silva",
  "email": "joao@bar.com",
  "password": "senha123",
  "establishmentName": "Bar do João"
}
```

## Orders

### GET /orders

Listar todos os pedidos

- Query params: `?status=PENDING`

### GET /orders/kitchen

Pedidos para cozinha (PENDING e PREPARING)

### POST /orders

Criar novo pedido

**Request:**

```json
{
  "comandaId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "observations": "Sem gelo"
    }
  ],
  "observations": "Mesa próxima à janela"
}
```

### PATCH /orders/:id/status

Atualizar status do pedido

**Request:**

```json
{
  "status": "PREPARING"
}
```

## Products

### GET /products

Listar produtos

- Query params: `?categoryId=uuid`

### GET /products/search?q=cerveja

Buscar produtos

### POST /products

Criar produto

**Request:**

```json
{
  "categoryId": "uuid",
  "name": "Heineken",
  "price": 12.0,
  "code": "001",
  "description": "Cerveja premium",
  "preparationTime": 5
}
```

## Categories

### GET /categories

Listar categorias

### POST /categories

Criar categoria

## Tables

### GET /tables

Listar mesas

### POST /tables

Criar mesa

### PATCH /tables/:id/status

Atualizar status da mesa

## Comandas

### GET /comandas

Listar comandas

- Query params: `?status=OPEN`

### GET /comandas/:id

Detalhes da comanda

### POST /comandas

Criar comanda

**Request:**

```json
{
  "tableId": "uuid",
  "customerName": "João Silva"
}
```

### PATCH /comandas/:id/close

Fechar comanda

## WebSocket Events

**Connect:**

```javascript
socket.emit("join-establishment", establishmentId);
```

**Events:**

- `new-order` - Novo pedido criado
- `order-updated` - Status do pedido atualizado
- `comanda-updated` - Comanda atualizada

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Headers

Todas as requisições autenticadas devem incluir:

```
Authorization: Bearer <token>
```
