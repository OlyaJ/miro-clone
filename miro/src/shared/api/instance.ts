import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { CONFIG } from "../model/config";
import type { ApiPaths } from "./schema";
import { useSession } from '../model/session';

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
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/refresh")) {
      return request;
    }
    const token = await useSession.getState().refreshToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
});




