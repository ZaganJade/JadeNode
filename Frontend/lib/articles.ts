/**
 * Article API utilities for JadeNode Marketplace.
 */

import { api } from "./api";

// ─── Public Article Types ──────────────────────────────────────────────────

export interface ArticleAuthor {
  name: string;
}

export interface ArticleData {
  public_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body?: string | null;
  cover_image: string | null;
  category: string | null;
  status: string;
  reading_time: number;
  author: ArticleAuthor;
  created_at: string;
  updated_at: string;
}

export interface ArticleListResponse {
  data: ArticleData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Admin Article Types ──────────────────────────────────────────────────

export interface AdminArticleAuthor {
  id?: number;
  name: string;
}

export interface AdminArticleData {
  id: number;
  public_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body?: string | null;
  cover_image: string | null;
  category: string | null;
  status: string;
  reading_time: number;
  author: AdminArticleAuthor;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AdminArticleListResponse {
  data: AdminArticleData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Public Article API ────────────────────────────────────────────────────

export async function listArticles(
  params?: Record<string, string>,
): Promise<ArticleListResponse> {
  return api.get<ArticleListResponse>("/api/v1/articles", { params });
}

export async function getArticle(
  slug: string,
): Promise<{ data: ArticleData }> {
  return api.get<{ data: ArticleData }>(`/api/v1/articles/${slug}`);
}

export async function getArticleCategories(): Promise<{ data: string[] }> {
  return api.get<{ data: string[] }>("/api/v1/articles/categories");
}

// ─── Admin Article API ─────────────────────────────────────────────────────

export async function adminListArticles(
  params?: Record<string, string>,
): Promise<AdminArticleListResponse> {
  return api.get<AdminArticleListResponse>("/api/v1/admin/articles", {
    params,
  });
}

export async function adminGetArticle(
  id: number,
): Promise<{ data: AdminArticleData }> {
  return api.get<{ data: AdminArticleData }>(`/api/v1/admin/articles/${id}`);
}

export async function adminCreateArticle(data: {
  title: string;
  excerpt?: string | null;
  body: string;
  cover_image?: string | null;
  category?: string | null;
  status?: string;
}): Promise<{ message: string; data: AdminArticleData }> {
  return api.post<{ message: string; data: AdminArticleData }>(
    "/api/v1/admin/articles",
    data,
  );
}

export async function adminUpdateArticle(
  id: number,
  data: {
    title?: string;
    excerpt?: string | null;
    body?: string;
    cover_image?: string | null;
    category?: string | null;
    status?: string;
  },
): Promise<{ message: string; data: AdminArticleData }> {
  return api.put<{ message: string; data: AdminArticleData }>(
    `/api/v1/admin/articles/${id}`,
    data,
  );
}

export async function adminDeleteArticle(
  id: number,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/api/v1/admin/articles/${id}`);
}

export async function adminArchiveArticle(
  id: number,
): Promise<{ message: string; data: AdminArticleData }> {
  return api.put<{ message: string; data: AdminArticleData }>(
    `/api/v1/admin/articles/${id}/archive`,
  );
}

export async function adminUnarchiveArticle(
  id: number,
): Promise<{ message: string; data: AdminArticleData }> {
  return api.put<{ message: string; data: AdminArticleData }>(
    `/api/v1/admin/articles/${id}/unarchive`,
  );
}

export async function adminListArchivedArticles(
  params?: Record<string, string>,
): Promise<AdminArticleListResponse> {
  return api.get<AdminArticleListResponse>(
    "/api/v1/admin/articles/archive",
    { params },
  );
}
