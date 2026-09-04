/**
 * Helper HTTP client dùng chung cho toàn bộ client-side API calls.
 * Tự động format query params, headers và chuẩn hóa xử lý lỗi HTTP.
 */

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, body, headers, ...customConfig } = options;

  // Xây dựng URL kèm Query Parameters nếu có
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isJsonBody = body !== undefined && !(body instanceof FormData);

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `Yêu cầu thất bại với mã trạng thái ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      // Nếu không parse được JSON lỗi thì giữ thông báo mặc định
    }
    throw new Error(errorMessage);
  }

  // Nếu HTTP 204 No Content hoặc không có nội dung thì trả về void/null
  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json();
  return data as T;
}
