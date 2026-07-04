<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportDetail extends Model
{
    use HasUuids;

    protected $table = 'import_details';

    protected $fillable = [
        'import_session_id',
        'centre_number',
        'school_name',
        'status',
        'candidates_count',
        'errors',
        'warnings',
        'started_at',
        'finished_at'
    ];

    protected $casts = [
        'errors' => 'array',
        'warnings' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime'
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ImportSession::class, 'import_session_id');
    }
}
