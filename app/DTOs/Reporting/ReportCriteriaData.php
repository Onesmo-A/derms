<?php

namespace App\DTOs\Reporting;

class ReportCriteriaData
{
    public function __construct(
        public readonly string $examId,
        public readonly string $classLevelId,
        public readonly ?string $schoolId = null,
    ) {}
}
