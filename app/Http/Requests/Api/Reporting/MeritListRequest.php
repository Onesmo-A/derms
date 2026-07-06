<?php

namespace App\Http\Requests\Api\Reporting;

use App\DTOs\Reporting\ReportCriteriaData;
use Illuminate\Foundation\Http\FormRequest;

class MeritListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'district_id' => ['nullable', 'uuid', 'exists:districts,id'],
            'region_id' => ['nullable', 'uuid', 'exists:regions,id'],
        ];
    }

    public function toData(string $examId): ReportCriteriaData
    {
        return new ReportCriteriaData(
            examId: $examId,
            classLevelId: $this->string('class_level_id')->toString(),
            schoolId: $this->filled('school_id') ? $this->string('school_id')->toString() : null,
            districtId: $this->filled('district_id') ? $this->string('district_id')->toString() : null,
            regionId: $this->filled('region_id') ? $this->string('region_id')->toString() : null,
        );
    }
}
