<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawSubject extends Model
{
    use HasUuids;

    protected $table = 'raw_subjects';

    protected $fillable = [
        'raw_candidate_id',
        'subject_code',
        'subject_name',
        'subject_id',
        'grade',
        'points'
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(RawCandidate::class, 'raw_candidate_id');
    }
}
