<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradingSystemDetail extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'grading_system_details';

    protected $fillable = [
        'grading_system_id',
        'grade',
        'min_score',
        'max_score',
        'min_points',
        'max_points',
        'points',
        'description',
    ];

    protected $casts = [
        'min_score' => 'decimal:2',
        'max_score' => 'decimal:2',
    ];

    public function gradingSystem(): BelongsTo
    {
        return $this->belongsTo(GradingSystem::class, 'grading_system_id');
    }
}
