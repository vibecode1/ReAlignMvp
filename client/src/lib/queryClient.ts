import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  // Get the auth token from localStorage
  const token = localStorage.getItem('realign_token');
  console.log('apiRequest: URL =', url, 'Method =', method);
  console.log('apiRequest: Token retrieved from localStorage =', token ? `${token.substring(0, 10)}...` : 'No token found');
  
  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Add Content-Type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Authorization header if token exists and is valid
  if (token && token !== "undefined" && token !== "null") {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('apiRequest: Valid token found, added to Authorization header');
  } else {
    console.log('apiRequest: No valid token available for Authorization header');
  }
  
  console.log('apiRequest: Request headers =', headers);
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the auth token from localStorage
    const token = localStorage.getItem('realign_token');
    const url = queryKey[0] as string;
    console.log('getQueryFn: URL =', url);
    console.log('getQueryFn: Token retrieved from localStorage =', token ? `${token.substring(0, 10)}...` : 'No token found');
    
    // Create headers object
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token exists and is valid
    if (token && token !== "undefined" && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
      console.log('getQueryFn: Valid token found, added to Authorization header');
    } else {
      console.log('getQueryFn: No valid token available for Authorization header');
    }
    
    console.log('getQueryFn: Request headers =', headers);
    
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('getQueryFn: Received 401 response, returning null per configuration');
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
