<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentBulkStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
            'students' => ['required', 'array', 'min:1'],
            'students.*.registration_number' => ['required', 'string', 'max:50', 'distinct', 'unique:students,registration_number'],
            'students.*.first_name' => ['required', 'string', 'max:100'],
            'students.*.middle_name' => ['nullable', 'string', 'max:100'],
            'students.*.last_name' => ['required', 'string', 'max:100'],
            'students.*.gender' => ['required', Rule::in(['M', 'F'])],
            'students.*.parent_name' => ['nullable', 'string', 'max:150'],
            'students.*.parent_phone' => ['required', 'string', 'max:20'],
        ];
    }
}
