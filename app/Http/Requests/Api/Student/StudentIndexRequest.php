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
            'region_id' => ['nullable', 'uuid', 'exists:regions,id'],
            'district_id' => ['nullable', 'uuid', 'exists:districts,id'],
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['nullable', 'uuid', 'exists:class_levels,id'],
            'gender' => ['nullable', 'string', 'in:M,F'],
            'status' => ['nullable', 'string', 'in:active,transferred,completed'],
            'search' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}
