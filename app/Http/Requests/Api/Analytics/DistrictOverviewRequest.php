<?php

namespace App\Http\Requests\Api\Analytics;

use App\DTOs\Analytics\DistrictOverviewCriteriaData;
use Illuminate\Foundation\Http\FormRequest;

class DistrictOverviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'examination_id' => ['required', 'uuid', 'exists:examinations,id'],
            'class_level_id' => ['required', 'uuid', 'exists:class_levels,id'],
        ];
    }

    public function toData(): DistrictOverviewCriteriaData
    {
        return new DistrictOverviewCriteriaData(
            examinationId: $this->string('examination_id')->toString(),
            classLevelId: $this->string('class_level_id')->toString(),
        );
    }
}
