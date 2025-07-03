**1 Устанавливаем зависимости**

```bash
npm i -D openapi-typescript msw openapi-msw

npm i openapi-fetch openapi-react-query @tanstack/react-query
```

**2 Копируем пример api схемы**

Копируем `5-api/shared/api/schema` -> `src/shared/api/schema`

**3 Добавляем комманду для генерации api и запускаем**

`package.json`

```ts
{
  "scripts": {
    "api": "npx openapi-typescript ./src/shared/api/schema/main.yaml -o ./src/shared/api/schema/generated.ts"
  }
}
```

_Часто схема будет в отдельном репозитории. В таком случае просто укажите путь в другой репозиторий. Или прямую ссылку на схему_

`package.json`

```ts
{
  "scripts": {
    "api": "npx openapi-typescript ../api-schema/main.yaml -o ./src/shared/api/schema/generated.ts"
  }
}
```

`package.json`

```ts
{
  "scripts": {
    "api": "npx openapi-typescript https://api.example.com/schema.yaml -o ./src/shared/api/schema/generated.ts"
  }
}
```

**4 добавляем entrypoint для сгенерированных типов**

`src/shared/api/schema/index.ts`

```ts
import { paths, components } from "./generated";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
```

**5 Создаём инстанс api на основе типов**

копируем

Копируем `5-api/shared/api/instace.ts` -> `src/shared/api/instace.ts`
Копируем `5-api/shared/api/query-client.ts` -> `src/shared/api/query-client.ts`

**6 Подключаем @tanstack/react-query**
Копируем `5-api/app/providers.tsx` -> `src/app/providers.tsx`

Регистрируем

`app/router.tsx`

```tsx
export const router = createBrowserRouter([
  {
    element: (
      <Providers>
        <App />
      </Providers>
    ),
    //....
  },
]);
```

**7 Добавляем моки**

```bash
npx msw init public --save
```

Копируем `5-api/shared/api/mocks` -> `src/shared/api/mocks`

Регистрируем в `main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import("@/shared/api/mocks/browser");
  return worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
```

**8 Добавляем моки для оставшихся запросов и тестируем**

```tsx
const queryClient = useQueryClient();
const boardsQuery = useQuery(rqClient.queryOptions("get", "/boards"));

const deleteBoardMutation = rqClient.useMutation(
  "delete",
  "/boards/{boardId}",
  {
    onSettled: () => {
      return queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/boards"),
      );
    },
  },
);

const createBoardMutation = rqClient.useMutation("post", "/boards", {
  onSettled: () => {
    return queryClient.invalidateQueries(
      rqClient.queryOptions("get", "/boards"),
    );
  },
});
```
