<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Region extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'regions';

    protected $fillable = [
        'name',
        'code',
    ];

    /**
     * Get the districts in the region.
     */
    public function districts(): HasMany
    {
        return $this->hasMany(District::class, 'region_id');
    }

    /**
     * Get all schools in this region (through districts).
     */
    public function schools(): HasManyThrough
    {
        return $this->hasManyThrough(School::class, District::class, 'region_id', 'district_id');
    }
}
