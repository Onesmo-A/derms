<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;

class ConfigureSubjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
            'subjects' => ['required', 'array', 'min:1'],
            'subjects.*.subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'subjects.*.max_marks' => ['required', 'numeric', 'min:1'],
            'subjects.*.pass_marks' => ['required', 'numeric', 'min:1', 'lte:subjects.*.max_marks'],
            'subjects.*.paper_one_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'subjects.*.paper_two_weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
