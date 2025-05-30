import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { signal?: AbortSignal }
): Promise<Response> {
  // Get the auth token from localStorage
  const authToken = localStorage.getItem('auth_token');
  
  // Add log to see the token being sent (first few chars) as specified in the plan
  if (authToken) {
    console.log(`API Request ${method} ${url} - Token (first 10 chars):`, authToken.substring(0, 10) + '...');
  } else {
    console.log(`API Request ${method} ${url} - No auth token found`);
  }
  
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal: options?.signal,
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
    // Get the auth token from localStorage
    const authToken = localStorage.getItem('auth_token');
    
    // Add log for query requests as well
    if (authToken) {
      console.log(`Query Request ${queryKey[0]} - Token (first 10 chars):`, authToken.substring(0, 10) + '...');
    } else {
      console.log(`Query Request ${queryKey[0]} - No auth token found`);
    }
    
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
