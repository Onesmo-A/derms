<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Identity\Models\User;
use App\Domains\Student\Models\Student;

class School extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

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
}
