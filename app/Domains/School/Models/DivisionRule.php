<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class DivisionRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'division_rules';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'min_points',
        'max_points',
        'badge',
    ];

    protected $casts = [
        'min_points' => 'integer',
        'max_points' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = $m->id ?: (string) Str::uuid());
    }
}
