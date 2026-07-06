<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;

class RegisterCandidatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_ids' => ['sometimes', 'nullable', 'array', 'min:1'],
            'school_ids.*' => ['uuid', 'exists:schools,id'],
            'student_ids' => ['sometimes', 'nullable', 'array', 'min:1'],
            'student_ids.*' => ['uuid', 'exists:students,id'],
            'class_level_id' => ['sometimes', 'nullable', 'uuid', 'exists:class_levels,id'],
        ];
    }
}
