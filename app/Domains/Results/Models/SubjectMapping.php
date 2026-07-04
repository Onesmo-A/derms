<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SubjectMapping extends Model
{
    use HasUuids;

    protected $table = 'subject_mappings';

    protected $fillable = [
        'source_system',
        'external_code',
        'subject_id'
    ];
}
