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
        'code',
        'has_practical',
    ];

    protected $casts = [
        'has_practical' => 'boolean',
    ];
}
