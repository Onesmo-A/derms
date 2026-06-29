<?php

namespace App\Http\Requests\Api\Examination;

use App\Enums\ExaminationStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExaminationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:' . implode(',', ExaminationStatus::values())],
        ];
    }
}
