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
            'school_ids' => ['required', 'array', 'min:1'],
            'school_ids.*' => ['uuid', 'exists:schools,id'],
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
        ];
    }
}
