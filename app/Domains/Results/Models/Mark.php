<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Identity\Models\User;

class Mark extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'marks';

    protected $fillable = [
        'examination_registration_id',
        'examination_subject_id',
        'paper_one_score',
        'paper_two_score',
        'final_score',
        'grade',
        'points',
        'remarks',
        'entered_by',
        'is_validated',
    ];

    protected $casts = [
        'paper_one_score' => 'decimal:2',
        'paper_two_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'is_validated' => 'boolean',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(ExaminationRegistration::class, 'examination_registration_id');
    }

    public function examinationSubject(): BelongsTo
    {
        return $this->belongsTo(ExaminationSubject::class, 'examination_subject_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
