**1 Устанавливаем зависимости**

```bash
npm i react-router-dom
```

**2 Добавляем `shared/model/routes.ts` модуль с описанием всех роутов**

Содержимое можно скопировать из `3-router/shared/model/routes.ts`

**3 Подключаем роутер**

Скопировать `3-router/app/router.ts` и `3-router/app/root.ts` в `src/app`

И подключаем в `src/main.tsx`

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

**4 Меняем формат public api**

`eslint.boundaries.js`

```js
  {
    rules: {
      "boundaries/entry-point": [
        2,
        {
          default: "disallow",
          rules: [
            {
              target: ["features"],
              allow: ["index.(ts|tsx)", "*.page.(ts|tsx)"],
            },
          ],
        },
      ],
    },
  }
```

**5 Обновляем структуру модулей в соответствии с новым public api**

Можно заменить `features` на `3-router/features`

**6 Тестируем переход по ссылкам и получение boardId**

```tsx

<Link to={href(ROUTES.BOARD, {boardId: '1'})}>
```

```tsx
const params = useParams<PathParams[typeof ROUTES.BOARD]>();
```

`src/app/app.tsx`

```tsx
export function App() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

  return (
    <div>
      {!isAuthPage && <AppHeader />}
      <Outlet />
    </div>
  );
}
```
