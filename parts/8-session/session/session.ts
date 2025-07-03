import { createGStore } from "create-gstore";
import jwtDecode from "jwt-decode";

import { useMemo, useState } from "react";
import { fetchClient } from "@/shared/api/instance";

export type Session = {
  userId: string;
  email: string;
  exp: number;
};

let refreshTokenPromise: Promise<{ data?: { accessToken: string } }> | null =
  null;

export const useSession = createGStore(() => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const updateToken = (token: string) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  const removeToken = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const getFreshToken = async () => {
    if (!token) {
      return null;
    }

    const res = jwtDecode<{ exp: number }>(token);

    if (res.exp < Date.now() / 1000) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = fetchClient.POST("/auth/refresh").finally(() => {
          refreshTokenPromise = null;
        });
      }

      const res = await refreshTokenPromise;

      if (res.data) {
        updateToken(res.data.accessToken);
        return res.data.accessToken;
      }

      return null;
    }

    return token;
  };

  const session = useMemo(
    () => (!token ? null : jwtDecode<Session>(token)),
    [token],
  );

  return {
    session,
    getFreshToken,
    logout: removeToken,
    login: updateToken,
  };
});
