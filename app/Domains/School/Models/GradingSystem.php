<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class GradingSystem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'grading_systems';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'class_level_id',
        'type',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = $m->id ?: (string) Str::uuid());
    }

    public function details()
    {
        return $this->hasMany(GradingSystemDetail::class, 'grading_system_id');
    }
}
