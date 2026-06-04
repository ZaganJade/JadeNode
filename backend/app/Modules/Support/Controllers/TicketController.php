<?php

namespace App\Modules\Support\Controllers;

use App\Http\Requests\CreateTicketRequest;
use App\Http\Requests\TicketReplyRequest;
use App\Http\Resources\TicketMessageResource;
use App\Http\Resources\TicketResource;
use App\Modules\Support\Models\Ticket;
use App\Modules\Support\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController
{
    /**
     * Create a new support ticket.
     */
    public function store(CreateTicketRequest $request): JsonResponse
    {
        $ticket = Ticket::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $request->user()->id,
            'subject' => $request->input('subject'),
            'priority' => $request->input('priority'),
            'status' => 'open',
            'last_reply_at' => now(),
            'last_reply_by' => 'customer',
        ]);

        TicketMessage::create([
            'public_id' => Str::ulid()->toBase32(),
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'sender_type' => 'customer',
            'message' => $request->input('message'),
        ]);

        $ticket->load('messages', 'user');
        $ticket->loadCount('messages');

        return response()->json([
            'message' => 'Tiket berhasil dibuat.',
            'ticket' => new TicketResource($ticket),
        ], 201);
    }

    /**
     * List the authenticated user's tickets.
     */
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::where('user_id', $request->user()->id)
            ->withCount('messages')
            ->orderByDesc('last_reply_at')
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
     * Show a ticket detail with messages.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::where('public_id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at')])
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
     * Reply to a ticket.
     */
    public function reply(TicketReplyRequest $request, string $id): JsonResponse
    {
        $ticket = Ticket::where('public_id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $ticket) {
            return response()->json([
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        if (in_array($ticket->status, ['closed', 'resolved'])) {
            return response()->json([
                'message' => 'Tiket ini sudah ditutup.',
            ], 409);
        }

        $message = TicketMessage::create([
            'public_id' => Str::ulid()->toBase32(),
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'sender_type' => 'customer',
            'message' => $request->input('message'),
        ]);

        $ticket->update([
            'last_reply_at' => now(),
            'last_reply_by' => 'customer',
            'status' => $ticket->status === 'in_progress' ? 'open' : $ticket->status,
        ]);

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'ticket_message' => new TicketMessageResource($message),
        ], 201);
    }
}
