<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Student\Models\ClassLevel;

class GradingSystem extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'grading_systems';

    protected $fillable = [
        'name',
        'class_level_id',
        'type', // 'subject', 'division'
    ];

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(GradingSystemDetail::class, 'grading_system_id');
    }
}
