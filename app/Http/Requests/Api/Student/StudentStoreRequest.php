<?php

namespace App\Http\Requests\Api\Student;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\ClassLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentStoreRequest extends FormRequest
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

        $suffix = preg_replace('/\D+/', '', (string) $this->input('registration_suffix', ''));

        if ($suffix !== '' && !$this->filled('registration_number')) {
            $school = School::find($this->input('school_id'));
            $classLevel = ClassLevel::find($this->input('current_class_level_id'));

            if ($school && $classLevel) {
                $this->merge([
                    'registration_number' => $school->buildStudentRegistrationNumber($classLevel, $suffix),
                ]);
            }
        }
    }

    public function rules(): array
    {
        $schoolId = (string) $this->input('school_id', '');
        $academicYearId = (string) $this->input('academic_year_id', '');
        $classLevelId = (string) $this->input('current_class_level_id', '');

        return [
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'current_class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
            'registration_number' => [
                'required',
                'string',
                'max:50',
                'regex:/^[SP]\\d{4}\\/\\d{4}$/',
                Rule::unique('students', 'registration_number')
                    ->where(function ($query) use ($schoolId, $academicYearId, $classLevelId) {
                        $query->where('school_id', $schoolId)
                            ->where('academic_year_id', $academicYearId)
                            ->where('current_class_level_id', $classLevelId);
                    }),
            ],
            'registration_suffix' => ['nullable', 'string', 'max:4', 'regex:/^\\d{1,4}$/'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'gender' => ['required', Rule::in(['M', 'F'])],
            'date_of_birth' => ['nullable', 'date'],
            'parent_name' => ['nullable', 'string', 'max:150'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'Please select a school.',
            'academic_year_id.required' => 'Please select an academic year.',
            'current_class_level_id.required' => 'Please select a class level.',
            'registration_number.required' => 'Registration number is required.',
            'registration_number.regex' => 'Registration number must look like S0101/0001.',
            'registration_number.unique' => 'That registration number already exists in the selected school, class, and academic year.',
            'registration_suffix.regex' => 'Student_reg must contain only digits.',
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'gender.required' => 'Please select gender.',
            'gender.in' => 'Gender must be Male or Female.',
            'parent_phone.required' => 'Parent phone is required.',
        ];
    }
}
