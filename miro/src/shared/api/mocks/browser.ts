import { setupWorker } from "msw/browser";
import { boardsHandlers } from "./handlers/boards";
import { authHandlers } from "./handlers/auth";

export const worker = setupWorker(...authHandlers, ...boardsHandlers);
