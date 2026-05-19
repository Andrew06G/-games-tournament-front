import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useNotificacionesNoLeidas(enabled: boolean) {
  return useQuery({
    queryKey: ["notificaciones-no-leidas"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ total: number }>(
        "/notificaciones/no-leidas",
      );
      return data.total;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
