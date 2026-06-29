<?php

namespace App\DTOs\Reporting;

class StudentSlipCriteriaData
{
    public function __construct(
        public readonly string $examId,
        public readonly string $registrationId,
    ) {}
}
