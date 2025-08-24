import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { CONFIG } from "../model/config";
import type { ApiPaths, ApiSchemas } from "./schema";
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
  onRequest({request}){
    const token = useSession.getState().refreshToken; 
    if(token) {
      request.headers.set(JSON.stringify({
        code:"NOT_AUTHORIZED",
        message:"You are not authorized to access this resource",
      } as ApiSchemas["Error"]), `Bearer ${token}`)
    } else{
      return new Response("Unathorized", {
        status:401,
        headers:{
          "Content-Type": "application/json",
        }
      })
    }
  }
})



