<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;

class DistrictIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'region_id' => ['nullable', 'uuid', 'exists:regions,id'],
        ];
    }
}
