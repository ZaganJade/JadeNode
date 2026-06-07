<?php

namespace App\Modules\Article\Controllers;

use App\Modules\Article\Http\Resources\ArticleResource;
use App\Modules\Article\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController
{
    /**
     * List all published articles (public).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::query()
            ->with('author')
            ->where('status', 'published');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('excerpt', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = $request->input('per_page', 12);
        $articles = $query->paginate($perPage);

        return response()->json([
            'data' => ArticleResource::collection($articles),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * Show a single published article by slug (public).
     */
    public function show(string $slug): JsonResponse
    {
        $article = Article::query()
            ->with('author')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json([
            'data' => new ArticleResource($article),
        ]);
    }

    /**
     * Get unique categories from published articles.
     */
    public function categories(): JsonResponse
    {
        $categories = Article::query()
            ->where('status', 'published')
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->sort()
            ->values();

        return response()->json([
            'data' => $categories,
        ]);
    }
}
