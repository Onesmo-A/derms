<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $studentId = $this->route('id');

        return [
            'school_id' => ['sometimes', 'required', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['sometimes', 'required', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['sometimes', 'required', 'uuid', 'exists:class_levels,id'],
            'registration_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('students', 'registration_number')->ignore($studentId),
            ],
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['sometimes', 'required', Rule::in(['M', 'F'])],
            'date_of_birth' => ['nullable', 'date'],
            'parent_name' => ['nullable', 'string', 'max:150'],
            'parent_phone' => ['sometimes', 'required', 'string', 'max:20'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'transferred', 'completed'])],
        ];
    }
}
