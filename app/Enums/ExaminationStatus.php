<?php

namespace App\Enums;

enum ExaminationStatus: string
{
    case Draft = 'draft';
    case RegistrationOpen = 'registration_open';
    case RegistrationClosed = 'registration_closed';
    case MarksEntryOpen = 'marks_entry_open';
    case Processing = 'processing';
    case Processed = 'processed';
    case Published = 'published';
    case Closed = 'closed';
    case Archived = 'archived';

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

    /**
     * Define valid next steps for exam lifecycle transitions.
     *
     * @return array<string, array<int, string>>
     */
    public static function transitions(): array
    {
        return [
            self::Draft->value => [
                self::RegistrationOpen->value,
                self::Archived->value,
            ],
            self::RegistrationOpen->value => [
                self::RegistrationClosed->value,
                self::Archived->value,
            ],
            self::RegistrationClosed->value => [
                self::MarksEntryOpen->value,
                self::Archived->value,
            ],
            self::MarksEntryOpen->value => [
                self::Processing->value,
                self::Archived->value,
            ],
            self::Processing->value => [
                self::Processed->value,
                self::Archived->value,
            ],
            self::Processed->value => [
                self::Published->value,
                self::Closed->value,
            ],
            self::Published->value => [
                self::Processed->value,
                self::Closed->value,
                self::Archived->value,
            ],
            self::Closed->value => [
                self::Archived->value,
            ],
            self::Archived->value => [],
        ];
    }

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::transitions()[$from] ?? [], true);
    }
}
