<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('registration_number')) {
            $this->merge([
                'registration_number' => strtoupper(trim((string) $this->input('registration_number'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'district_id' => ['required', 'uuid', 'exists:districts,id'],
            'name' => ['required', 'string', 'max:150'],
            'registration_number' => ['required', 'string', 'max:50', 'regex:/^[SP]\d{4}$/', 'unique:schools,registration_number'],
            'type' => ['required', Rule::in(['government', 'private'])],
            'level' => ['required', Rule::in(['primary', 'secondary'])],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string'],
        ];
    }
}
