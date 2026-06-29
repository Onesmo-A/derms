<?php

namespace App\Http\Requests\Api\Examination;

use Illuminate\Foundation\Http\FormRequest;

class ProcessResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
        ];
    }
}
