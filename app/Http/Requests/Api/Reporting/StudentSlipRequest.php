<?php

namespace App\Http\Requests\Api\Reporting;

use App\DTOs\Reporting\StudentSlipCriteriaData;
use Illuminate\Foundation\Http\FormRequest;

class StudentSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'exam_id' => $this->route('examId'),
            'registration_id' => $this->route('registrationId'),
        ]);
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['required', 'uuid', 'exists:examinations,id'],
            'registration_id' => ['required', 'uuid', 'exists:examination_registrations,id'],
        ];
    }

    public function toData(string $examId, string $registrationId): StudentSlipCriteriaData
    {
        return new StudentSlipCriteriaData($examId, $registrationId);
    }
}
