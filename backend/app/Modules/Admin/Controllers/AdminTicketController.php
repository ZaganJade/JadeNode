<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Requests\TicketReplyRequest;
use App\Http\Resources\TicketMessageResource;
use App\Http\Resources\TicketResource;
use App\Modules\Support\Models\Ticket;
use App\Modules\Support\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTicketController
{
    /**
     * List all tickets with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['user'])->withCount('messages');

        if ($request->filled('status')) {
            $query->byStatus($request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->byPriority($request->input('priority'));
        }

        $tickets = $query->orderByDesc('last_reply_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => TicketResource::collection($tickets),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    /**
     * Show ticket detail with messages.
     */
    public function show(string $id): JsonResponse
    {
        $ticket = Ticket::where('public_id', $id)
            ->with(['user', 'messages' => fn ($q) => $q->orderBy('created_at')])
            ->withCount('messages')
            ->first();

        if (! $ticket) {
            return response()->json([
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'ticket' => new TicketResource($ticket),
            'messages' => TicketMessageResource::collection($ticket->messages),
        ]);
    }

    /**
     * Admin reply to a ticket.
     */
    public function reply(TicketReplyRequest $request, string $id): JsonResponse
    {
        $ticket = Ticket::where('public_id', $id)->first();

        if (! $ticket) {
            return response()->json([
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        if (in_array($ticket->status, ['closed'])) {
            return response()->json([
                'message' => 'Tiket ini sudah ditutup.',
            ], 409);
        }

        $message = TicketMessage::create([
            'public_id' => Str::ulid()->toBase32(),
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'sender_type' => 'admin',
            'message' => $request->input('message'),
        ]);

        $ticket->update([
            'last_reply_at' => now(),
            'last_reply_by' => 'admin',
            'status' => 'in_progress',
        ]);

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'ticket_message' => new TicketMessageResource($message),
        ], 201);
    }

    /**
     * Update ticket status.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:in_progress,resolved,closed',
        ]);

        $ticket = Ticket::where('public_id', $id)->first();

        if (! $ticket) {
            return response()->json([
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        $ticket->update([
            'status' => $request->input('status'),
        ]);

        $ticket->load(['user', 'messages']);
        $ticket->loadCount('messages');

        return response()->json([
            'message' => 'Status tiket berhasil diperbarui.',
            'ticket' => new TicketResource($ticket),
        ]);
    }
}
