import { publicFetchClient } from '@/shared/api/instance';
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { createGStore } from 'create-gstore'

type Session = {
    userId: string;
    email: string;
    exp: number;
    iat: number;
}

const TOKEN_KEY = "token"

let refreshTokenPromise: Promise<string | null> | null = null;

export const useSession = createGStore(() => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

    const login = (token: string) => {
        localStorage.setItem(TOKEN_KEY, token);
        setToken(token)
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null)
    }

    const session = token ? jwtDecode<Session>(token) : null

    // session.ts
    const refreshToken = async (): Promise<string | null> => {
        if (!token) return null;

        const { exp } = jwtDecode<Session>(token);
        const now = Math.floor(Date.now() / 1000);
        const BUFFER = 30; // сек, чтобы не попасть ровно в момент истечения

        if (exp <= now + BUFFER) {
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
            return await refreshTokenPromise;
        }

        return token; // <-- ВАЖНО: вернуть текущий, если он ещё жив
    };

    return { refreshToken, login, logout, session }
})
