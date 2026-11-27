import { QueryClient } from "@tanstack/react-query";

// Instância única do QueryClient (compartilhada entre RootLayout e client.js)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
