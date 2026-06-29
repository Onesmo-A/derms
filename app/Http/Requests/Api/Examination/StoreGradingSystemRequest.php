<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradingSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'class_level_id' => ['nullable', 'uuid', 'exists:class_levels,id'],
            'type' => ['required', 'in:subject,division'],
            'details' => ['required', 'array', 'min:1'],
            'details.*.grade' => ['required', 'string', 'max:5'],
            'details.*.min_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'details.*.max_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'details.*.points' => ['required', 'integer', 'min:0'],
            'details.*.min_points' => ['nullable', 'integer', 'min:0'],
            'details.*.max_points' => ['nullable', 'integer', 'min:0'],
            'details.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
