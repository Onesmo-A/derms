<?php

namespace App\Domains\Student\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassLevel extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'class_levels';

    protected $fillable = [
        'name',
        'numeric_level',
    ];
}
