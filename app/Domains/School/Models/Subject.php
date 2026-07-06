<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'subjects';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'short_name',
        'code',
        'description',
        'class_level_id',
        'is_active',
        'has_practical',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'has_practical' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = $m->id ?: (string) Str::uuid());
    }

    public function classLevel()
    {
        return $this->belongsTo(ClassLevel::class);
    }
}
