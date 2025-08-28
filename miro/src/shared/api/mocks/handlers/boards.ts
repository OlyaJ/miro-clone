import { HttpResponse } from "msw";
import { http } from "../http";
import type { ApiSchemas } from "../../schema";
import { verifyTokenOrThrow } from "../session";

const nowIso = () => new Date().toISOString();

const seedTime = () => {
  const createdAt = nowIso();
  return {
    createdAt,
    updatedAt: createdAt,
    lastOpenedAt: createdAt,
  };
};

const boards: ApiSchemas["Board"][] = [
  {
    id: "board-1",
    name: "Marketing Campaign",
    ...seedTime(),
    isFavorite: false,
  },
  {
    id: "board-2",
    name: "Product Roadmap",
    ...seedTime(),
    isFavorite: true,
  },
];

// Утилиты
function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

type SortKey = "createdAt" | "updatedAt" | "lastOpenedAt" | "isFavorite" | "name";

function sortBoards(items: ApiSchemas["Board"][], sort: SortKey) {
  const copy = [...items];
  copy.sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    if (sort === "isFavorite") {
      return (bv as unknown as number) - (av as unknown as number);
    }
    if (sort === "name") {
      return String(av).localeCompare(String(bv));
    }
    return String(bv).localeCompare(String(av)); // даты: по убыванию
  });
  return copy;
}

/** Генерация множества бордов (для тестов/демо). */
export function seedBoards(count = 1000): number {
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const dt = new Date(base.getTime() - i * 60_000); // минус i минут
    const iso = dt.toISOString();
    const board: ApiSchemas["Board"] = {
      id: crypto.randomUUID(),
      name: `Board #${String(i + 1).padStart(4, "0")}`,
      createdAt: iso,
      updatedAt: iso,
      lastOpenedAt: iso,
      isFavorite: i % 2 === 0,
    };
    boards.push(board);
  }
  return count;
}

/** Досыпает борды до минимума, если не хватает. */
function ensureBoardsCount(min: number) {
  if (boards.length < min) {
    seedBoards(min - boards.length);
  }
}

export const boardsHandlers = [
  // GET /boards — список с пагинацией/фильтрами/поиском/сортировкой
  http.get("/boards", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const sort = (url.searchParams.get("sort") ?? "createdAt") as SortKey;
    const isFavorite = parseBooleanParam(url.searchParams.get("isFavorite"));
    const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";

    // «Как у Жени»: если это первый лист без фильтров/поиска — гарантируем минимум limit штук
    if (page === 1 && !search && typeof isFavorite !== "boolean") {
      ensureBoardsCount(Math.max(1, limit));
    }

    let result = boards;

    if (typeof isFavorite === "boolean") {
      result = result.filter((b) => b.isFavorite === isFavorite);
    }
    if (search) {
      result = result.filter((b) => b.name.toLowerCase().includes(search));
    }

    result = sortBoards(result, sort);

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * Math.max(1, limit);
    const list = result.slice(start, start + Math.max(1, limit));

    const payload: ApiSchemas["BoardsList"] = {
      list,
      total,
      totalPages,
      currentPage: safePage,
    };

    return HttpResponse.json(payload, { status: 200 });
  }),

  // POST /boards — создание доски
  http.post("/boards", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);
    const data = (await ctx.request.json()) as { name?: string };

    if (!data?.name || typeof data.name !== "string") {
      return HttpResponse.json(
        { message: "Invalid request body", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    const timestamps = seedTime();
    const board: ApiSchemas["Board"] = {
      id: crypto.randomUUID(),
      name: data.name,
      ...timestamps,
      isFavorite: false,
    };

    boards.push(board);
    return HttpResponse.json(board, { status: 201 });
  }),

  // GET /boards/{boardId}
  http.get("/boards/{boardId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { boardId } = params as { boardId: string };
    const board = boards.find((b) => b.id === boardId);
    if (!board) {
      return HttpResponse.json(
        { message: "Board not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return HttpResponse.json(board, { status: 200 });
  }),

  // PUT /boards/{boardId}/rename
  http.put("/boards/{boardId}/rename", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { boardId } = params as { boardId: string };
    const body = (await request.json()) as ApiSchemas["RenameBoard"];

    const board = boards.find((b) => b.id === boardId);
    if (!board) {
      return HttpResponse.json(
        { message: "Board not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    if (!body?.name || typeof body.name !== "string") {
      return HttpResponse.json(
        { message: "Invalid request body", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    board.name = body.name;
    board.updatedAt = nowIso();

    return HttpResponse.json(board, { status: 200 });
  }),

  // PUT /boards/{boardId}/favorite
  http.put("/boards/{boardId}/favorite", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { boardId } = params as { boardId: string };
    const body = (await request.json()) as ApiSchemas["UpdateBoardFavorite"];

    const board = boards.find((b) => b.id === boardId);
    if (!board) {
      return HttpResponse.json(
        { message: "Board not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    if (typeof body?.isFavorite !== "boolean") {
      return HttpResponse.json(
        { message: "Invalid request body", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    board.isFavorite = body.isFavorite;
    board.updatedAt = nowIso();

    return HttpResponse.json(board, { status: 200 });
  }),

  // DELETE /boards/{boardId} — 204 без тела
  http.delete("/boards/{boardId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { boardId } = params as { boardId: string };
    const index = boards.findIndex((board) => board.id === boardId);

    if (index === -1) {
      return HttpResponse.json(
        { message: "Board not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    boards.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
