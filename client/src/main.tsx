import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos: evita refetches innecesarios al navegar
      gcTime: 10 * 60 * 1000, // 10 minutos: mantiene datos en caché más tiempo
      refetchOnWindowFocus: false, // No refetch al volver a la pestaña
      retry: 1, // Solo 1 reintento en caso de error
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Custom fetch that detects HTML responses (proxy timeout) and retries once
const resilientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const doFetch = () => globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
  
  let response = await doFetch();
  
  // If the response is HTML instead of JSON, the proxy timed out
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html') && !contentType.includes('json')) {
    console.warn('[tRPC] Received HTML response (proxy timeout), retrying...');
    // Wait 2 seconds and retry once
    await new Promise(r => setTimeout(r, 2000));
    response = await doFetch();
    
    const retryContentType = response.headers.get('content-type') || '';
    if (retryContentType.includes('text/html') && !retryContentType.includes('json')) {
      // Return a synthetic error response that tRPC can parse
      return new Response(
        JSON.stringify([{ error: { message: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.', code: -32603, data: { code: 'TIMEOUT' } } }]),
        { status: 408, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
  return response;
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: resilientFetch,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
