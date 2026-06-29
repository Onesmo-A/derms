<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;

class SchoolIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'district_id' => ['nullable', 'uuid', 'exists:districts,id'],
            'type' => ['nullable', 'in:government,private'],
            'level' => ['nullable', 'in:primary,secondary'],
            'search' => ['nullable', 'string', 'max:150'],
        ];
    }
}
