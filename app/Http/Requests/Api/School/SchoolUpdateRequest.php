<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->route('id');

        return [
            'district_id' => ['sometimes', 'required', 'uuid', 'exists:districts,id'],
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'registration_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('schools', 'registration_number')->ignore($schoolId),
            ],
            'type' => ['sometimes', 'required', Rule::in(['government', 'private'])],
            'level' => ['sometimes', 'required', Rule::in(['primary', 'secondary'])],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string'],
        ];
    }
}
