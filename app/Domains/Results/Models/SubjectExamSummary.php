<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Examination\Models\Examination;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Examination\Models\Subject;
use App\Domains\School\Models\School;

class SubjectExamSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'subject_exam_summaries';

    protected $fillable = [
        'examination_id',
        'class_level_id',
        'subject_id',
        'school_id', // Nullable: NULL indicates district-wide aggregate
        'registered_candidates',
        'sat_candidates',
        'total_score',
        'average_score',
        'gpa',
        'grade_a_count',
        'grade_b_count',
        'grade_c_count',
        'grade_d_count',
        'grade_f_count',
        'subject_position_district',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'average_score' => 'decimal:2',
        'gpa' => 'decimal:2',
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

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }
}
