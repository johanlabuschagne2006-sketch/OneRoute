import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      const errorMessage = text || res.statusText || 'Unknown error';
      throw new Error(`${res.status}: ${errorMessage}`);
    } catch (parseError) {
      throw new Error(`${res.status}: ${res.statusText || 'Request failed'}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Handle queryKey properly - only join strings, convert objects to query params
      let url = queryKey[0] as string;
      if (queryKey.length > 1) {
        const params = new URLSearchParams();
        for (let i = 1; i < queryKey.length; i++) {
          const param = queryKey[i];
          if (typeof param === 'object' && param !== null) {
            // Convert object to query parameters
            Object.entries(param).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                params.append(key, String(value));
              }
            });
          } else {
            // If it's a simple value, treat it as an ID
            url = `${url}/${param}`;
          }
        }
        if (params.toString()) {
          url = `${url}?${params.toString()}`;
        }
      }
      
      const res = await fetch(url, {
        credentials: "include",
      });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // In development, log errors for debugging
      if (import.meta.env.DEV) {
        console.error('Query fetch error:', error);
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
