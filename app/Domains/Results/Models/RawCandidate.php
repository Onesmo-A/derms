<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawCandidate extends Model
{
    use HasUuids;

    protected $table = 'raw_candidates';

    protected $fillable = [
        'import_session_id',
        'centre_number',
        'candidate_number',
        'gender',
        'division',
        'points',
        'is_verified'
    ];

    protected $casts = [
        'is_verified' => 'boolean'
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ImportSession::class, 'import_session_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(RawSubject::class, 'raw_candidate_id');
    }
}
