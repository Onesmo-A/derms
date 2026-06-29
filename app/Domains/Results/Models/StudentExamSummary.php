<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Examination\Models\ExaminationRegistration;

class StudentExamSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'student_exam_summaries';

    protected $fillable = [
        'examination_registration_id',
        'total_marks',
        'average_marks',
        'gpa',
        'division',
        'division_points',
        'passed_subjects_count',
        'failed_subjects_count',
        'school_position',
        'district_position',
        'status',
    ];

    protected $casts = [
        'total_marks' => 'decimal:2',
        'average_marks' => 'decimal:2',
        'gpa' => 'decimal:2',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(ExaminationRegistration::class, 'examination_registration_id');
    }
}
