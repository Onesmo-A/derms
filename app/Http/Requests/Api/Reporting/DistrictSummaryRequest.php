<?php

namespace App\Http\Requests\Api\Reporting;

use App\DTOs\Reporting\ReportCriteriaData;
use Illuminate\Foundation\Http\FormRequest;

class DistrictSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'exam_id' => $this->route('examId'),
            'class_level_id' => $this->route('classLevelId'),
        ]);
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['required', 'uuid', 'exists:examinations,id'],
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
        ];
    }

    public function toData(string $examId, string $classLevelId): ReportCriteriaData
    {
        return new ReportCriteriaData($examId, $classLevelId);
    }
}
