<?php

namespace App\Domains\Student\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\School\Models\School;

class Student extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'students';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'current_class_level_id',
        'registration_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'parent_name',
        'parent_phone',
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /**
     * Get the school that the student attends.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    /**
     * Get the academic year that the student is registered under.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    /**
     * Get the current class level of the student.
     */
    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'current_class_level_id');
    }
}
