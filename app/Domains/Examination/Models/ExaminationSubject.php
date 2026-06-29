<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Student\Models\ClassLevel;

class ExaminationSubject extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'examination_subjects';

    protected $fillable = [
        'examination_id',
        'class_level_id',
        'subject_id',
        'max_marks',
        'pass_marks',
        'paper_one_weight',
        'paper_two_weight',
    ];

    protected $casts = [
        'max_marks' => 'decimal:2',
        'pass_marks' => 'decimal:2',
        'paper_one_weight' => 'decimal:2',
        'paper_two_weight' => 'decimal:2',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class, 'examination_id');
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
