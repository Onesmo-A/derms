<?php

namespace App\Domains\Notification\Services;

use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Notification\Models\SmsLog;
use App\Services\AuditLogger;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SmsDispatcherService
{
    public function __construct(
        protected SmsGatewayInterface $gateway,
        protected AuditLogger $auditLogger,
    )
    {
    }

    /**
     * Dispatch result SMS notification to parent.
     */
    public function dispatchResultSms(string $registrationId): bool
    {
        $registration = ExaminationRegistration::with(['student', 'examination'])->findOrFail($registrationId);
        $student = $registration->student;
        $exam = $registration->examination;

        // Skip if parent phone is empty
        if (empty($student->parent_phone)) {
            Log::warning("Skipped SMS dispatch for candidate {$registration->exam_number}: Parent phone is empty.");
            $this->auditLogger->log(
                action: 'sms.dispatch.skipped',
                description: 'SMS dispatch skipped because parent phone is missing.',
                newValues: [
                    'examination_registration_id' => $registration->id,
                    'exam_number' => $registration->exam_number,
                ]
            );
            return false;
        }

        // Fetch student results summary
        $summary = StudentExamSummary::where('examination_registration_id', $registration->id)->first();
        if (! $summary) {
            Log::warning("Skipped SMS dispatch for candidate {$registration->exam_number}: Summary results not processed.");
            $this->auditLogger->log(
                action: 'sms.dispatch.skipped',
                description: 'SMS dispatch skipped because summary results are unavailable.',
                newValues: [
                    'examination_registration_id' => $registration->id,
                    'exam_number' => $registration->exam_number,
                ]
            );
            return false;
        }

        // Build list of subject grades
        $marks = Mark::join('examination_subjects', 'marks.examination_subject_id', '=', 'examination_subjects.id')
            ->join('subjects', 'examination_subjects.subject_id', '=', 'subjects.id')
            ->where('marks.examination_registration_id', $registration->id)
            ->select('marks.grade', 'subjects.name as subject_name')
            ->get();

        $gradesString = $marks->map(function ($mark) {
            $shortName = substr($mark->subject_name, 0, 4);
            return "{$shortName}={$mark->grade}";
        })->implode(', ');

        // Swahili message construction
        $studentName = $student->first_name . ' ' . $student->last_name;
        $message = "Matokeo ya {$studentName} - {$exam->name}: {$gradesString}. Div: {$summary->division} (Pnt: {$summary->division_points}, GPA: {$summary->gpa}). Nafasi Shuleni: {$summary->school_position}. Wilayani: {$summary->district_position}. DERMS.";

        $log = SmsLog::create([
            'id' => (string) Str::uuid(),
            'student_id' => $student->id,
            'examination_registration_id' => $registration->id,
            'phone_number' => $student->parent_phone,
            'message' => $message,
            'status' => 'pending',
        ]);

        $result = $this->gateway->send($student->parent_phone, $message);

        $status = Arr::get($result, 'status') === 'success' ? 'sent' : 'failed';
        $errorMessage = $status === 'failed' ? Arr::get($result, 'error', 'Unknown gateway error.') : null;

        $log->update([
            'status' => $status,
            'error_message' => $errorMessage,
            'sent_at' => $status === 'sent' ? now() : null,
        ]);

        $this->auditLogger->log(
            action: $status === 'sent' ? 'sms.dispatch.sent' : 'sms.dispatch.failed',
            description: $status === 'sent'
                ? 'SMS sent successfully.'
                : 'SMS dispatch failed.',
            newValues: [
                'examination_registration_id' => $registration->id,
                'phone_number' => $student->parent_phone,
                'sms_log_id' => $log->id,
                'status' => $status,
            ]
        );

        return $status === 'sent';
    }
}
