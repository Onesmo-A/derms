<?php

namespace App\Http\Requests\Api\Student;

use App\Domains\Student\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('registration_number')) {
            $registrationNumber = strtoupper(trim((string) $this->input('registration_number')));
            if (preg_match('/^([SP]\d{4})\/F\d+\/(\d{4})$/', $registrationNumber, $matches)) {
                $registrationNumber = $matches[1] . '/' . $matches[2];
            }

            $this->merge([
                'registration_number' => $registrationNumber,
            ]);
        }
    }

    public function rules(): array
    {
        $studentId = $this->route('id');
        $student = $studentId ? Student::find($studentId) : null;
        $schoolId = (string) ($this->input('school_id', $student?->school_id) ?? '');
        $academicYearId = (string) ($this->input('academic_year_id', $student?->academic_year_id) ?? '');
        $classLevelId = (string) ($this->input('current_class_level_id', $student?->current_class_level_id) ?? '');

        return [
            'school_id' => ['sometimes', 'required', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['sometimes', 'required', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['sometimes', 'required', 'uuid', 'exists:class_levels,id'],
            'registration_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                'regex:/^[SP]\\d{4}\\/\\d{4}$/',
                Rule::unique('students', 'registration_number')
                    ->ignore($studentId)
                    ->where(function ($query) use ($schoolId, $academicYearId, $classLevelId) {
                        $query->where('school_id', $schoolId)
                            ->where('academic_year_id', $academicYearId)
                            ->where('current_class_level_id', $classLevelId);
                    }),
            ],
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['sometimes', 'required', Rule::in(['M', 'F'])],
            'date_of_birth' => ['nullable', 'date'],
            'parent_name' => ['nullable', 'string', 'max:150'],
            'parent_phone' => ['sometimes', 'required', 'string', 'max:20'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'transferred', 'completed'])],
        ];
    }

    public function messages(): array
    {
        return [
            'registration_number.regex' => 'Registration number must look like S0101/0001.',
            'registration_number.unique' => 'That registration number is already used in the selected school, class, and academic year.',
            'current_class_level_id.exists' => 'The selected class level is invalid.',
            'gender.in' => 'Gender must be Male or Female.',
            'status.in' => 'Status must be Active, Transferred, or Completed.',
        ];
    }
}
