<?php

namespace App\Http\Requests\Api\Marks;

use App\Enums\ExaminationRegistrationStatus;
use Illuminate\Foundation\Http\FormRequest;

class BulkSaveMarksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'examination_subject_id' => ['required', 'uuid', 'exists:examination_subjects,id'],
            'marks' => ['required', 'array', 'min:1'],
            'marks.*.examination_registration_id' => ['required', 'uuid', 'exists:examination_registrations,id'],
            'marks.*.registration_status' => ['required', 'in:' . implode(',', ExaminationRegistrationStatus::values())],
            'marks.*.paper_one_score' => ['nullable', 'numeric', 'min:0'],
            'marks.*.paper_two_score' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
