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
            'region_id' => ['nullable', 'uuid', 'exists:regions,id'],
            'district_id' => ['nullable', 'uuid', 'exists:districts,id'],
            'type' => ['nullable', 'in:government,private'],
            'level' => ['nullable', 'in:primary,secondary'],
            'enrolment_category' => ['nullable', 'in:below_40,40_and_above'],
            'search' => ['nullable', 'string', 'max:150'],
        ];
    }
}
