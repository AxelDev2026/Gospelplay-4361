import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useCatalog() {
  return useQuery(orpc.music.catalog.queryOptions({ staleTime: 60_000 }));
}
export function useLibrary(enabled: boolean) {
  return useQuery(orpc.music.library.queryOptions({ enabled }));
}
export function useFavorite() {
  const q = useQueryClient();
  return useMutation(
    orpc.music.favorite.mutationOptions({
      onMutate: async ({ id, liked }) => {
        const key = orpc.music.library.queryOptions().queryKey;
        await q.cancelQueries({ queryKey: key });
        const prev = q.getQueryData(key);
        q.setQueryData(key, (old) =>
          old
            ? {
                ...old,
                favorites: liked
                  ? [...new Set([...old.favorites, id])]
                  : old.favorites.filter((x) => x !== id),
              }
            : old,
        );
        return { prev };
      },
      onError: (_e, _v, c) => q.setQueryData(orpc.music.library.queryOptions().queryKey, c?.prev),
      onSettled: () => q.invalidateQueries({ queryKey: orpc.music.library.key() }),
    }),
  );
}
export function usePremium() {
  const q = useQueryClient();
  return useMutation(
    orpc.music.demoPremium.mutationOptions({
      onSuccess: () => q.invalidateQueries({ queryKey: orpc.music.library.key() }),
    }),
  );
}
export function useCreatePlaylist() {
  const q = useQueryClient();
  return useMutation(
    orpc.music.createPlaylist.mutationOptions({
      onSuccess: () => q.invalidateQueries({ queryKey: orpc.music.library.key() }),
    }),
  );
}
export function useSubmissions(enabled: boolean) {
  return useQuery(orpc.music.submissions.queryOptions({ enabled }));
}
export function useSubmit() {
  const q = useQueryClient();
  return useMutation(
    orpc.music.submit.mutationOptions({
      onSuccess: () => q.invalidateQueries({ queryKey: orpc.music.submissions.key() }),
    }),
  );
}
export function useModerate() {
  const q = useQueryClient();
  return useMutation(
    orpc.music.moderate.mutationOptions({
      onSuccess: () => {
        q.invalidateQueries({ queryKey: orpc.music.submissions.key() });
        q.invalidateQueries({ queryKey: orpc.music.catalog.key() });
      },
    }),
  );
}
export function useWeather() {
  return useMutation(orpc.music.weather.mutationOptions());
}
