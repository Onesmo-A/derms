<?php

namespace App\DTOs\Analytics;

class DistrictOverviewCriteriaData
{
    public function __construct(
        public readonly string $examinationId,
        public readonly string $classLevelId,
    ) {}
}
