<?php

namespace App\Domains\Examination\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Student\Models\ClassLevel;

class ExaminationClassLevel extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'examination_class_levels';

    protected $fillable = [
        'examination_id',
        'class_level_id',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class, 'examination_id');
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }
}
