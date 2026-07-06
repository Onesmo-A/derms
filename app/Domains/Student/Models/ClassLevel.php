<?php

namespace App\Domains\Student\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassLevel extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'class_levels';

    protected $fillable = [
        'name',
        'numeric_level',
    ];

    public function registrationCode(): string
    {
        $code = strtoupper(trim((string) ($this->code ?? '')));

        if ($code !== '' && preg_match('/^F\d+$/', $code)) {
            return $code;
        }

        if (!empty($this->numeric_level)) {
            return 'F' . (int) $this->numeric_level;
        }

        if (preg_match('/FORM\s*(\d+)/i', (string) $this->name, $matches)) {
            return 'F' . $matches[1];
        }

        return 'CL';
    }
}
