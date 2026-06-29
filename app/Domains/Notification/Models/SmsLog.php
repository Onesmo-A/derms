<?php

namespace App\Domains\Notification\Models;

use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Student\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sms_logs';

    protected $fillable = [
        'student_id',
        'examination_registration_id',
        'phone_number',
        'message',
        'status',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(ExaminationRegistration::class, 'examination_registration_id');
    }
}
