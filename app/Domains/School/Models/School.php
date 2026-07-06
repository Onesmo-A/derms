<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Identity\Models\User;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;

class School extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    public const ENROLMENT_CATEGORY_BELOW_40 = 'below_40';
    public const ENROLMENT_CATEGORY_40_AND_ABOVE = '40_and_above';

    protected $table = 'schools';

    protected $fillable = [
        'district_id',
        'name',
        'registration_number',
        'type',
        'level',
        'phone_number',
        'email',
        'address',
    ];

    protected $casts = [
        'student_count_cache' => 'integer',
    ];

    protected $appends = [
        'enrolment_category_label',
    ];

    /**
     * Get the district that the school belongs to.
     */
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'district_id');
    }

    /**
     * Get the users/staff associated with this school.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'school_id');
    }

    /**
     * Get the students registered at this school.
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'school_id');
    }

    /**
     * Build the candidate/student registration prefix for this school.
     *
     * Government schools use an `S` prefix while private schools use `P`.
     * The numeric part is taken from the school's registration number.
     */
    public function candidateRegistrationPrefix(): string
    {
        $digits = preg_replace('/\D+/', '', (string) $this->registration_number);

        if ($digits === '') {
            return (string) $this->registration_number;
        }

        $prefix = strtolower((string) $this->type) === 'private' ? 'P' : 'S';

        return $prefix . str_pad($digits, 4, '0', STR_PAD_LEFT);
    }

    public function candidateRegistrationPrefixForClass(ClassLevel $classLevel): string
    {
        return $this->candidateRegistrationPrefix();
    }

    public function buildStudentRegistrationNumber(?ClassLevel $classLevel, string $suffix): string
    {
        $suffix = preg_replace('/\D+/', '', $suffix);

        if ($suffix === '') {
            return '';
        }

        return sprintf(
            '%s/%s',
            $this->candidateRegistrationPrefix(),
            str_pad($suffix, 4, '0', STR_PAD_LEFT)
        );
    }

    /**
     * Sync the stored school enrolment summary from the current students table.
     */
    public function refreshEnrollmentSummary(): self
    {
        $studentCount = $this->students()->count();

        $this->forceFill([
            'student_count_cache' => $studentCount,
            'enrolment_category' => $studentCount < 40
                ? self::ENROLMENT_CATEGORY_BELOW_40
                : self::ENROLMENT_CATEGORY_40_AND_ABOVE,
        ])->saveQuietly();

        return $this->fresh();
    }

    /**
     * Human-readable label for the school's enrolment band.
     */
    public function getEnrolmentCategoryLabelAttribute(): string
    {
        return $this->enrolment_category === self::ENROLMENT_CATEGORY_40_AND_ABOVE
            ? '40 and above'
            : 'Below 40';
    }
}
