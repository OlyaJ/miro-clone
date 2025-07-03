**1 Устанавливаем зависимости**

```bash
npm i --save-dev eslint-plugin-boundaries eslint-import-resolver-typescript vite-tsconfig-paths
```

**2 Добавляем `path alias` для импортов**

`tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

`tsconfig.app.json`

```json
{
  "compilerOptions": {
    //...
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

`vite.config.ts`

```ts
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
});
```

**3 Добавляем конфигурацию линтера**

Копируем конфигурацию плагина boundaries
`2-linter/eslint.boundaries.js` в корень проекта

И регистриуем это в общем `eslint.config.js`

```js
import { eslintBoundariesConfig } from "./eslint.boundaries.js";

export default tseslint.config(
  // Остальной конфиг
  eslintBoundariesConfig,
);
```

**4 Проверяем работает ли**

```bash
npm run build
```

```bash
npm run lint
```
