<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Identity\Models\User;

class ImportSession extends Model
{
    use HasUuids;

    protected $table = 'import_sessions';

    protected $fillable = [
        'source_system',
        'exam_type',
        'year',
        'status',
        'total_centres',
        'processed_centres',
        'failed_centres',
        'total_students',
        'parser_version',
        'scraper_version',
        'mapping_version',
        'errors',
        'warnings',
        'logs',
        'started_by',
        'started_at',
        'finished_at'
    ];

    protected $casts = [
        'errors' => 'array',
        'warnings' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime'
    ];

    public function details(): HasMany
    {
        return $this->hasMany(ImportDetail::class, 'import_session_id');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(RawCandidate::class, 'import_session_id');
    }
}
