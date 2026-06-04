<?php

namespace App\Modules\Deployment\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProvisioningTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'deployment_id',
        'assigned_to',
        'status',
        'due_at',
        'overdue_at',
        'started_at',
        'completed_at',
        'failure_reason',
        'result_data',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'overdue_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'result_data' => 'array',
        ];
    }

    public function deployment(): BelongsTo
    {
        return $this->belongsTo(Deployment::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
