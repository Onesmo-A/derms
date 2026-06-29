<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentStoreRequest extends FormRequest
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
            'registration_number' => ['required', 'string', 'max:50', 'unique:students,registration_number'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'gender' => ['required', Rule::in(['M', 'F'])],
            'date_of_birth' => ['nullable', 'date'],
            'parent_name' => ['nullable', 'string', 'max:150'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ];
    }
}
