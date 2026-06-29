<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;

class StoreExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'examination_type_id' => ['required', 'uuid', 'exists:examination_types,id'],
            'name' => ['required', 'string', 'max:150'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'class_level_ids' => ['required', 'array', 'min:1'],
            'class_level_ids.*' => ['uuid', 'exists:class_levels,id'],
        ];
    }
}
