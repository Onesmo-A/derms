<?php

namespace App\Domains\Examination\Models;

use App\Enums\ExaminationStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Identity\Models\User;

class Examination extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'examinations';

    protected $fillable = [
        'academic_year_id',
        'examination_type_id',
        'name',
        'start_date',
        'end_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => ExaminationStatus::class,
    ];

    /**
     * Get the academic year this examination belongs to.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    /**
     * Get the type of this examination.
     */
    public function examinationType(): BelongsTo
    {
        return $this->belongsTo(ExaminationType::class, 'examination_type_id');
    }

    /**
     * Get the class levels involved in this examination.
     */
    public function classLevels(): BelongsToMany
    {
        return $this->belongsToMany(ClassLevel::class, 'examination_class_levels', 'examination_id', 'class_level_id')
            ->withTimestamps();
    }

    /**
     * Get the subject configurations for this examination.
     */
    public function examinationSubjects(): HasMany
    {
        return $this->hasMany(ExaminationSubject::class, 'examination_id');
    }

    /**
     * Get the registered candidates for this examination.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(ExaminationRegistration::class, 'examination_id');
    }

    /**
     * Get the officer who created this examination.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
