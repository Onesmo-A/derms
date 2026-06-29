<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExaminationType extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'examination_types';

    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    /**
     * Get the examinations of this type.
     */
    public function examinations(): HasMany
    {
        return $this->hasMany(Examination::class, 'examination_type_id');
    }
}
