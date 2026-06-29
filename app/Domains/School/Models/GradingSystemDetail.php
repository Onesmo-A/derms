<?php

namespace App\Domains\School\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradingSystemDetail extends Model
{
    use HasFactory;

    protected $table = 'grading_system_details';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'grading_system_id',
        'grade',
        'min_score',
        'max_score',
        'min_points',
        'max_points',
        'points',
        'description',
    ];

    protected $casts = [
        'min_score'  => 'float',
        'max_score'  => 'float',
        'points'     => 'integer',
        'min_points' => 'integer',
        'max_points' => 'integer',
    ];

    public function gradingSystem()
    {
        return $this->belongsTo(GradingSystem::class, 'grading_system_id');
    }
}
