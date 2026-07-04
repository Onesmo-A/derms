<?php

namespace App\Domains\Results\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RawSummary extends Model
{
    use HasUuids;

    protected $table = 'raw_summaries';

    protected $fillable = [
        'import_session_id',
        'centre_number',
        'division_i_count',
        'division_ii_count',
        'division_iii_count',
        'division_iv_count',
        'division_zero_count',
        'sat_candidates',
        'absent_candidates'
    ];
}
