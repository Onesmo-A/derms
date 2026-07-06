<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $examId = $this->route('id');

        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'examination_type_id' => ['required', 'uuid', 'exists:examination_types,id'],
            'code' => ['required', 'string', 'max:30', Rule::unique('examinations', 'code')->ignore($examId)],
            'name' => ['required', 'string', 'max:150'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
            'class_level_ids' => ['sometimes', 'array', 'min:1'],
            'class_level_ids.*' => ['uuid', 'exists:class_levels,id'],
        ];
    }
}
