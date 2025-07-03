**1. Добавляем схему запросов**

Копируем `7-auth.yaml` -> `src/shared/api/schema/endpoints/auth.yaml`

`src/shared/api/schema/shared/responses.yaml`

```yaml
BadRequestError:
  description: Bad request
  content:
    application/json:
      schema:
        $ref: "#/schemas/Error"
```

`src/shared/api/schema/main.yaml`

```yaml
paths:
  /auth/login:
    post:
      $ref: "./endpoints/auth.yaml#/login"

  /auth/register:
    post:
      $ref: "./endpoints/auth.yaml#/register"
```

Генерируем новые типы

```bash
npm run api
```

**2. Добавляем моки запросов auth**
Копируем `7-auth.ts` -> `src/shared/api/mocks/handlers/auth.ts`

Регистрируем

`src/shared/api/mocks/handlers/index.ts`

```ts
import { authHandlers } from "./auth";

export const handlers = [...authHandlers];
```

**3. Устанавливаем зависимости и добавляем компоненты**

```bash
npm install @hookform/resolvers zod react-hook-form

npx shadcn@latest add button card input form
```

**4. Имплементируем страницы login.page и register.page**

заменяем `7-auth-pages/features/auth` -> `src/features/auth`
