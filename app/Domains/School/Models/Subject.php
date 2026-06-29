<?php

namespace App\Domains\School\Models;

use App\Domains\School\Models\ClassLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'class_level_id',
        'is_active',
        'has_practical',
    ];

    public function classLevel()
    {
        return $this->belongsTo(ClassLevel::class);
    }
}
