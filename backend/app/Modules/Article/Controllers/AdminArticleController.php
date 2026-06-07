<?php

namespace App\Modules\Article\Controllers;

use App\Modules\Article\Http\Requests\StoreArticleRequest;
use App\Modules\Article\Http\Requests\UpdateArticleRequest;
use App\Modules\Article\Http\Resources\AdminArticleResource;
use App\Modules\Article\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminArticleController
{
    /**
     * List all articles (all statuses) for admin management.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::query()->with('author');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        // By default, exclude archived unless explicitly filtered
        if (!$request->filled('status')) {
            $query->where('status', '!=', 'archived');
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = $request->input('per_page', 25);
        $articles = $query->paginate($perPage);

        return response()->json([
            'data' => AdminArticleResource::collection($articles),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * Store a new article.
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $article = Article::create($data);

        return response()->json([
            'message' => 'Artikel berhasil dibuat.',
            'data' => new AdminArticleResource($article->load('author')),
        ], 201);
    }

    /**
     * Show a single article.
     */
    public function show(int $id): JsonResponse
    {
        $article = Article::with('author')->findOrFail($id);

        return response()->json([
            'data' => new AdminArticleResource($article),
        ]);
    }

    /**
     * Update an existing article.
     */
    public function update(UpdateArticleRequest $request, int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->update($request->validated());

        return response()->json([
            'message' => 'Artikel berhasil diperbarui.',
            'data' => new AdminArticleResource($article->fresh()->load('author')),
        ]);
    }

    /**
     * Delete an article (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->delete();

        return response()->json([
            'message' => 'Artikel berhasil dihapus.',
        ]);
    }

    /**
     * Archive an article.
     */
    public function archive(int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Artikel berhasil diarsipkan.',
            'data' => new AdminArticleResource($article->fresh()->load('author')),
        ]);
    }

    /**
     * Restore an archived article (set back to draft).
     */
    public function unarchive(int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->update(['status' => 'draft']);

        return response()->json([
            'message' => 'Artikel berhasil dipulihkan dari arsip.',
            'data' => new AdminArticleResource($article->fresh()->load('author')),
        ]);
    }

    /**
     * List all archived articles.
     */
    public function archived(Request $request): JsonResponse
    {
        $query = Article::query()
            ->with('author')
            ->where('status', 'archived');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'updated_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = $request->input('per_page', 25);
        $articles = $query->paginate($perPage);

        return response()->json([
            'data' => AdminArticleResource::collection($articles),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }
}
