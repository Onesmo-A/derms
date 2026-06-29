<?php

namespace App\Http\Requests\Api\School;

use Illuminate\Foundation\Http\FormRequest;

class SubjectImportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Adjust authorization as needed; for now allow any authenticated user
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ];
    }
}
?>
