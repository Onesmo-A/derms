<?php

namespace App\Domains\Examination\Models;

use App\Enums\ExaminationRegistrationStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\StudentExamSummary;

class ExaminationRegistration extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'examination_registrations';

    protected $fillable = [
        'examination_id',
        'student_id',
        'class_level_id',
        'exam_number',
        'status',
    ];

    protected $casts = [
        'status' => ExaminationRegistrationStatus::class,
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class, 'examination_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }

    public function marks(): HasMany
    {
        return $this->hasMany(Mark::class, 'examination_registration_id');
    }

    public function studentExamSummary(): HasOne
    {
        return $this->hasOne(StudentExamSummary::class, 'examination_registration_id');
    }
}
