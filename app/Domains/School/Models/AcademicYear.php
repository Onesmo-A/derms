<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class AcademicYear extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'academic_years';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = $m->id ?: (string) Str::uuid());
    }
}
