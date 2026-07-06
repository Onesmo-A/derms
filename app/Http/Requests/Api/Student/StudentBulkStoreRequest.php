<?php

namespace App\Http\Requests\Api\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentBulkStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $students = $this->input('students', []);

        if (!is_array($students)) {
            return;
        }

        foreach ($students as $index => $student) {
            if (empty($student['registration_number'])) {
                continue;
            }

            $registrationNumber = strtoupper(trim((string) $student['registration_number']));
            if (preg_match('/^([SP]\d{4})\/F\d+\/(\d{4})$/', $registrationNumber, $matches)) {
                $registrationNumber = $matches[1] . '/' . $matches[2];
            }

            $students[$index]['registration_number'] = $registrationNumber;
        }

        $this->merge(['students' => $students]);
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
            'students' => ['required', 'array', 'min:1'],
            'students.*.registration_number' => [
                'required',
                'string',
                'max:50',
                'distinct',
                'regex:/^[SP]\\d{4}\\/\\d{4}$/',
                Rule::unique('students', 'registration_number')
                    ->where(function ($query) use ($schoolId, $academicYearId, $classLevelId) {
                        $query->where('school_id', $schoolId)
                            ->where('academic_year_id', $academicYearId)
                            ->where('current_class_level_id', $classLevelId);
                    }),
            ],
            'students.*.first_name' => ['required', 'string', 'max:100'],
            'students.*.middle_name' => ['nullable', 'string', 'max:100'],
            'students.*.last_name' => ['required', 'string', 'max:100'],
            'students.*.gender' => ['required', Rule::in(['M', 'F'])],
            'students.*.parent_name' => ['nullable', 'string', 'max:150'],
            'students.*.parent_phone' => ['required', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'Please select a school for the batch.',
            'academic_year_id.required' => 'Please select an academic year for the batch.',
            'current_class_level_id.required' => 'Please select a class level for the batch.',
            'students.required' => 'Please add at least one student row.',
            'students.*.registration_number.regex' => 'Each registration number must look like S0101/0001.',
            'students.*.registration_number.unique' => 'One or more registration numbers already exist in the selected school, class, and academic year.',
            'students.*.gender.in' => 'Each gender must be Male or Female.',
            'students.*.parent_phone.required' => 'Each student must have a parent phone number.',
        ];
    }
}
