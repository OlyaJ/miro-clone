**1. Добавляем tailwindcss**

```bash
npm install tailwindcss @tailwindcss/vite
```

`src/app/index.css`

```css
@import "tailwindcss";
```

`vite.config.ts`

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // other plugins
    tailwindcss(),
  ],
});
```

**2. Добавляем shadcn**

```bash
npx shadcn@latest init
```

Устраняем проблему

```bash
npm i tw-animate-css
```

Меняем положение компонентов в `components.json`

```json
{
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/shared/lib/css",
    "ui": "@/shared/ui/kit",
    "lib": "@/shared/lib",
    "hooks": "@/shared/lib/react"
  }
}
```

Переносим утилиты для работы с классами

`src/lib/utils.ts` -> `src/shared/lib/css.ts`

**3 Добавляем пример компонента**

```bash
npx shadcn@latest add button
```
