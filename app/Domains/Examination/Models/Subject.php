<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'subjects';

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
        'is_active' => 'boolean',
        'has_practical' => 'boolean',
    ];
}
