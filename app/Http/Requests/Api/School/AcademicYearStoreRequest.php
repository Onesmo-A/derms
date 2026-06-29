<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;

class AcademicYearStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true; // policy handled in controller
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
?>
