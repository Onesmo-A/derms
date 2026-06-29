<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ClassLevel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'class_levels';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'numeric_level',
    ];

    protected $casts = [
        'numeric_level' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = $m->id ?: (string) Str::uuid());
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }
}
