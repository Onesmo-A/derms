<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SchoolMapping extends Model
{
    use HasUuids;

    protected $table = 'school_mappings';

    protected $fillable = [
        'source_system',
        'centre_code',
        'school_id',
        'effective_year',
        'status'
    ];
}
