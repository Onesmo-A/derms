<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class District extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'districts';

    protected $fillable = [
        'region_id',
        'name',
        'code',
    ];

    /**
     * Get the region that the district belongs to.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * Get the schools in this district.
     */
    public function schools(): HasMany
    {
        return $this->hasMany(School::class, 'district_id');
    }
}
