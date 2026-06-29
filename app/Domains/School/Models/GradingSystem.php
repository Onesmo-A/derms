<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    public function details()
    {
        return $this->hasMany(GradingSystemDetail::class, 'grading_system_id');
    }
}
