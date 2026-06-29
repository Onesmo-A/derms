<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Foundation\Http\FormRequest;

class StudentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['nullable', 'uuid', 'exists:class_levels,id'],
            'search' => ['nullable', 'string', 'max:150'],
        ];
    }
}
