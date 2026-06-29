<?php

namespace App\Enums;

enum ExaminationRegistrationStatus: string
{
    case Registered = 'registered';
    case Absent = 'absent';
    case Disqualified = 'disqualified';

    /**
     * Get all supported status values for validation.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $status): string => $status->value,
            self::cases(),
        );
    }
}
