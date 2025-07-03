**1. Добавляем в схему bearer токен**

`src/shared/api/schema/main.yaml`

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Добавляем к запросам что им нужна авторизация

`src/shared/api/schemas/endpoints/boards.yaml`

```yaml
createBoard:
  summary: Create a new board
  security:
    - bearerAuth: []
```

Посмотреть схему целиком

```bash
npx @redocly/cli@latest bundle ./src/shared/api/schema/main.yaml -o bundle.yaml
```

**2. Добавляем запрос на обновление токена**

`src/shared/api/schema/endpoints/auth.yaml`

```yaml
refresh:
  summary: Refresh access token
  parameters:
    - in: cookie
      name: refreshToken
      schema:
        type: string
  responses:
    "200":
      description: Access token refreshed successfully
      content:
        application/json:
          schema:
            $ref: "#/schemas/AuthResponse"
    "401":
      $ref: "../shared/responses.yaml#/UnauthorizedError"
```

`src/shared/api/schema/main.yaml`

```yaml
/auth/refresh:
  post:
    $ref: "./endpoints/auth.yaml#/refresh"
```

**3. Добавляем моки jwt токенов**

Меняем путь для запросов, что бы не возиться с cors
`env.development`

```bash
VITE_API_BASE_URL=/api
```

Устанавливаем библиотеки

```bash
npm i -D jose
npm i jwt-decode
```

Добавляем в `src/shared/api/mocks/session.ts` код для генерации моков токенов

```ts
type Session = {
  userId: string;
  email: string;
};

const JWT_SECRET = new TextEncoder().encode("your-secret-key");
const ACCESS_TOKEN_EXPIRY = "3s";
const REFRESH_TOKEN_EXPIRY = "7d";

export function createRefreshTokenCookie(refreshToken: string) {
  return `refreshToken=${refreshToken}; Max-Age=604800`;
}

async function generateTokens(session: Session) {
  const accessToken = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

async function verifyToken(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as Session;
}

export async function verifyTokenOrThrow(request: Request): Promise<Session> {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  const session = token ? await verifyToken(token).catch(() => null) : null;
  if (!session) {
    throw HttpResponse.json(
      {
        message: "Invalid token",
        code: "INVALID_TOKEN",
      },
      { status: 401 },
    );
  }
  return session;
}
```

Изменяем работу запросов логина и регистрации

```ts
const { accessToken, refreshToken } = await generateTokens({
  userId: user.id,
  email: user.email,
});
return HttpResponse.json(
  {
    accessToken,
    user,
  },
  {
    status: 200,
    headers: {
      "Set-Cookie": createRefreshTokenCookie(refreshToken),
    },
  },
);
```

Генерируем новые типы

```bash
npm run api
```

Добавляем мок refresh запроса

```ts
http.post("/auth/refresh", async ({ cookies }) => {
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    return HttpResponse.json(
      {
        message: "Refresh token не найден",
        code: "REFRESH_TOKEN_MISSING",
      },
      { status: 401 },
    );
  }

  try {
    const session = await verifyToken(refreshToken);
    const user = mockUsers.find((u) => u.id === session.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      {
        userId: user.id,
        email: user.email,
      },
    );

    return HttpResponse.json(
      {
        accessToken,
        user,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": createRefreshTokenCookie(newRefreshToken),
        },
      },
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    return HttpResponse.json(
      {
        message: "Недействительный refresh token",
        code: "INVALID_REFRESH_TOKEN",
      },
      { status: 401 },
    );
  }
});
```

**4 Реализуем модуль для работы с сессие на клиенте**

Устанавливаем стейт менеджер

```bash
npm i create-gstore
```

Можете просто zustand

```bash
npm i zustand
```

```ts
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { createGStore } from "create-gstore";
import { publicFetchClient } from "../api/instance";

type Session = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

const TOKEN_KEY = "token";

let refreshTokenPromise: Promise<string | null> | null = null;

export const useSession = createGStore(() => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const login = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const session = token ? jwtDecode<Session>(token) : null;

  const refreshToken = async () => {
    if (!token) {
      return null;
    }

    const session = jwtDecode<Session>(token);

    if (session.exp < Date.now() / 1000) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = publicFetchClient
          .POST("/auth/refresh")
          .then((r) => r.data?.accessToken ?? null)
          .then((newToken) => {
            if (newToken) {
              login(newToken);
              return newToken;
            } else {
              logout();
              return null;
            }
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      const newToken = await refreshTokenPromise;

      if (newToken) {
        return newToken;
      } else {
        return null;
      }
    }

    return token;
  };

  return { refreshToken, login, logout, session };
});
```

```ts
import { ROUTES } from "@/shared/model/routes";
import { Outlet, redirect } from "react-router-dom";
import { useSession } from "@/shared/model/session";
import { Navigate } from "react-router-dom";
import { enableMocking } from "@/shared/api/mocks";

export function ProtectedRoute() {
  const { session } = useSession();

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  return <Outlet />;
}

export async function protectedLoader() {
  await enableMocking();

  const token = await useSession.getState().refreshToken();

  if (!token) {
    return redirect(ROUTES.LOGIN);
  }

  return null;
}

```

**5 Добавляем middleware для добавления токена в заголовок**

```ts
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query"; // generated by openapi-typescript
import { CONFIG } from "@/shared/model/config";
import { ApiPaths, ApiSchemas } from "./schema";
import { useSession } from "../model/session";

export const fetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});
export const rqClient = createClient(fetchClient);

export const publicFetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});
export const publicRqClient = createClient(publicFetchClient);

fetchClient.use({
  async onRequest({ request }) {
    const token = await useSession.getState().refreshToken();

    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    } else {
      return new Response(
        JSON.stringify({
          code: "NOT_AUTHOIZED",
          message: "You are not authorized to access this resource",
        } as ApiSchemas["Error"]),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
});
```

**6 Подключаем модуль сессии в приложение**

- Переносим `enableMocking` в `src/shared/api/mocks/index.ts`

Добавляем использование сессии в формах входа и регистрации

```ts
const session = useSession();
const loginMutation = publicRqClient.useMutation("post", "/auth/login", {
  onSuccess(data) {
    session.login(data.accessToken);
    navigate(ROUTES.HOME);
  },
});
```

Подключаем защиту

```tsx
      {
        loader: protectedLoader,
        element: (
          <>
            <AppHeader />
            <ProtectedRoute />
          </>
        ),
        children: [
          {
            path: ROUTES.BOARDS,
            lazy: () => import("@/features/boards-list/boards-list.page"),
          },
          {
            path: ROUTES.BOARD,
            lazy: () => import("@/features/board/board.page"),
          },
        ],
      },
```

Верстка заголовка

```tsx
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/kit/button";

export function AppHeader() {
  const { session, logout } = useSession();
  return (
    <header className="bg-background border-b border-border/40 shadow-sm py-3 px-4 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-xl font-semibold">Miro Copy</div>

        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="hover:bg-destructive/10"
            >
              Выйти
            </Button>
          </div>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to={ROUTES.LOGIN}>Войти</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
```
