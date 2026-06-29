<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Examination\Models\Examination;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\ClassLevel;

class SchoolExamSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'school_exam_summaries';

    protected $fillable = [
        'examination_id',
        'school_id',
        'class_level_id',
        'registered_candidates',
        'sat_candidates',
        'absent_candidates',
        'total_gpa',
        'division_i_count',
        'division_ii_count',
        'division_iii_count',
        'division_iv_count',
        'division_zero_count',
        'pass_rate',
        'fail_rate',
        'school_position_district',
    ];

    protected $casts = [
        'total_gpa' => 'decimal:2',
        'pass_rate' => 'decimal:2',
        'fail_rate' => 'decimal:2',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class, 'examination_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }
}
