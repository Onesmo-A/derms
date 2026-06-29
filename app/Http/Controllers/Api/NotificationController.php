<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Notification\Jobs\SendStudentResultSmsJob;
use App\Domains\Notification\Models\SmsLog;
use App\Http\Requests\Api\Notification\DispatchResultSmsRequest;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Dispatch result SMS notifications for all candidates in an examination/class level.
     */
    public function dispatchResultSms(DispatchResultSmsRequest $request, string $examId, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $registrations = ExaminationRegistration::query()
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $request->class_level_id)
            ->whereHas('student', function ($query) {
                $query->whereNotNull('parent_phone');
            })
            ->pluck('id');

        foreach ($registrations as $registrationId) {
            if (app()->environment(['local', 'testing'])) {
                SendStudentResultSmsJob::dispatchSync($registrationId);
            } else {
                SendStudentResultSmsJob::dispatch($registrationId);
            }
        }

        $auditLogger->log(
            action: 'sms.dispatch.batch',
            description: 'Batch result SMS jobs were dispatched.',
            user: $request->user(),
            newValues: [
                'examination_id' => $exam->id,
                'class_level_id' => $request->class_level_id,
                'count' => $registrations->count(),
            ],
            request: $request
        );

        return response()->json([
            'message' => $registrations->count() . ' SMS jobs dispatched successfully.',
        ], 202);
    }

    /**
     * List SMS logs.
     */
    public function logs(Request $request)
    {
        $user = $request->user();
        abort_unless(
            $user->hasAnyRole(['Super Administrator', 'District Officer']),
            403,
            'Unauthorized to view SMS logs.'
        );

        $query = SmsLog::with(['student', 'registration.examination']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('examination_registration_id')) {
            $query->where('examination_registration_id', $request->examination_registration_id);
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate(20)
        );
    }
}
