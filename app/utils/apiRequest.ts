type WriteMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface WriteOptions {
  method: WriteMethod;
  body?: Record<string, unknown> | FormData;
}

export const apiRequest = <Result = unknown>(url: string, options: WriteOptions): Promise<Result> =>
  $fetch<Result>(url, options);
