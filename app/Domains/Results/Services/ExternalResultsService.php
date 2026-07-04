<?php

namespace App\Domains\Results\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Domains\Results\Models\ImportSession;
use App\Domains\Results\Models\RawCandidate;
use App\Domains\Results\Models\RawSubject;
use App\Domains\Results\Models\RawSummary;

class ExternalResultsService
{
    protected string $pythonServiceUrl;

    public function __construct()
    {
        $this->pythonServiceUrl = env('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000');
    }

    public function fetchYears(string $source, string $examType): array
    {
        $response = Http::get("{$this->pythonServiceUrl}/api/v1/imports/years", [
            'source' => $source,
            'exam_type' => $examType
        ]);
        return $response->json();
    }

    public function fetchCentres(string $source, string $examType, int $year): array
    {
        $response = Http::get("{$this->pythonServiceUrl}/api/v1/imports/centres", [
            'source' => $source,
            'exam_type' => $examType,
            'year' => $year
        ]);
        return $response->json();
    }

    public function processCentre(string $source, string $examType, int $year, string $centreNumber): array
    {
        // Get all dynamic subject mappings from database
        $mappings = DB::table('subject_mappings')
            ->select('subject_mappings.external_code', 'subject_mappings.subject_id', 'subjects.name as subject_name')
            ->join('subjects', 'subjects.id', '=', 'subject_mappings.subject_id')
            ->where('subject_mappings.source_system', $source)
            ->get()
            ->toArray();

        $response = Http::post("{$this->pythonServiceUrl}/api/v1/imports/process-centre", [
            'source_system' => $source,
            'exam_type' => $examType,
            'year' => $year,
            'centre_number' => $centreNumber,
            'subject_mappings' => array_map(function($m) { return (array)$m; }, $mappings)
        ]);

        return $response->json();
    }

    public function compareResults(array $stagedCandidates, array $dbCandidates): array
    {
        $response = Http::post("{$this->pythonServiceUrl}/api/v1/comparisons", [
            'staged_candidates' => $stagedCandidates,
            'db_candidates' => $dbCandidates
        ]);
        return $response->json();
    }

    /**
     * Create raw staging snapshot JSON backup file before promoting
     */
    public function createSnapshot(string $sessionId): string
    {
        $session = ImportSession::findOrFail($sessionId);
        $candidates = RawCandidate::where('import_session_id', $sessionId)->with('subjects')->get();
        $summaries = RawSummary::where('import_session_id', $sessionId)->get();

        $snapshotData = [
            'session' => $session->toArray(),
            'candidates' => $candidates->toArray(),
            'summaries' => $summaries->toArray()
        ];

        $filename = "snapshots/import_snapshot_{$sessionId}_" . time() . ".json";
        Storage::disk('local')->put($filename, json_encode($snapshotData));
        
        $fullPath = Storage::disk('local')->path($filename);
        $checksum = hash_file('sha256', $fullPath);

        DB::table('import_snapshots')->insert([
            'id' => Str::uuid()->toString(),
            'session_id' => $sessionId,
            'snapshot_type' => 'PRE_PROMOTION',
            'storage_path' => $filename,
            'checksum' => $checksum,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return $filename;
    }

    /**
     * Resolve or auto-create a school for a given centre number
     */
    private function resolveSchoolId(string $centreNumber, string $sourceSystem, int $year, string $schoolName = null): string
    {
        $mapped = DB::table('school_mappings')
            ->where('source_system', $sourceSystem)
            ->where('centre_code', $centreNumber)
            ->where('effective_year', $year)
            ->where('status', 'active')
            ->first();
            
        if ($mapped) {
            return $mapped->school_id;
        }

        $school = DB::table('schools')->where('registration_number', $centreNumber)->first();
        if ($school) {
            return $school->id;
        }

        $schoolId = Str::uuid()->toString();
        $district = DB::table('districts')->first();
        
        DB::table('schools')->insert([
            'id' => $schoolId,
            'district_id' => $district ? $district->id : null,
            'name' => $schoolName ?: "Imported Centre {$centreNumber}",
            'registration_number' => $centreNumber,
            'type' => str_starts_with(strtoupper($centreNumber), 'P') ? 'private' : 'government',
            'level' => 'secondary',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        return $schoolId;
    }

    /**
     * Promote staged raw results to official tables
     */
    public function promoteStagedResults(string $sessionId): bool
    {
        $session = ImportSession::findOrFail($sessionId);
        
        // 1. Create a Snapshot recovery backup first
        $this->createSnapshot($sessionId);

        return DB::transaction(function () use ($session, $sessionId) {
            // Find or create external result Examination Type record
            $examType = DB::table('examination_types')->where('code', $session->source_system)->first();
            if (!$examType) {
                $examTypeId = Str::uuid()->toString();
                DB::table('examination_types')->insert([
                    'id' => $examTypeId,
                    'name' => "External {$session->source_system} Importer",
                    'code' => $session->source_system,
                    'description' => "Staged imports from {$session->source_system}",
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $examTypeId = $examType->id;
            }

            $academicYear = DB::table('academic_years')->where('is_active', true)->first() 
                ?? DB::table('academic_years')->first();
            
            if (!$academicYear) {
                throw new \Exception("Academic year setup is missing.");
            }

            // Maps appropriate class levels
            $classLevelName = 'Form Four';
            if ($session->exam_type === 'FTNA') $classLevelName = 'Form Two';
            elseif ($session->exam_type === 'SFNA') $classLevelName = 'Standard Four';
            elseif ($session->exam_type === 'PSLE') $classLevelName = 'Standard Seven';
            elseif ($session->exam_type === 'ACSEE') $classLevelName = 'Form Six';

            $classLevel = DB::table('class_levels')->where('name', 'like', "%{$classLevelName}%")->first() 
                ?? DB::table('class_levels')->first();
            
            if (!$classLevel) {
                throw new \Exception("Class level setup for {$classLevelName} is missing.");
            }

            // Create Examination entry
            $examId = Str::uuid()->toString();
            DB::table('examinations')->insert([
                'id' => $examId,
                'academic_year_id' => $academicYear->id,
                'examination_type_id' => $examTypeId,
                'name' => "{$session->source_system} {$session->exam_type} {$session->year}",
                'start_date' => now(),
                'end_date' => now(),
                'status' => 'processed',
                'created_by' => $session->started_by,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Link Class Level
            DB::table('examination_class_levels')->insert([
                'id' => Str::uuid()->toString(),
                'examination_id' => $examId,
                'class_level_id' => $classLevel->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Promote raw candidates
            $rawCandidates = RawCandidate::where('import_session_id', $sessionId)->with('subjects')->get();

            foreach ($rawCandidates as $raw) {
                // Resolve or auto-create distinct school for this centre
                $schoolId = $this->resolveSchoolId($raw->centre_number, $session->source_system, $session->year);

                if (!$schoolId) {
                    throw new \Exception("No matching school configured for centre: {$raw->centre_number}");
                }

                // Match student record
                $student = DB::table('students')->where('registration_number', $raw->candidate_number)->first();
                if (!$student) {
                    $studentId = Str::uuid()->toString();
                    DB::table('students')->insert([
                        'id' => $studentId,
                        'school_id' => $schoolId,
                        'academic_year_id' => $academicYear->id,
                        'current_class_level_id' => $classLevel->id,
                        'registration_number' => $raw->candidate_number,
                        'first_name' => 'Candidate',
                        'last_name' => str_replace('/', '-', $raw->candidate_number),
                        'gender' => $raw->gender ?? 'M',
                        'parent_phone' => '+255000000000',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                } else {
                    $studentId = $student->id;
                }

                // Create Examination Registration
                $registrationId = Str::uuid()->toString();
                DB::table('examination_registrations')->insert([
                    'id' => $registrationId,
                    'examination_id' => $examId,
                    'student_id' => $studentId,
                    'class_level_id' => $classLevel->id,
                    'exam_number' => $raw->candidate_number,
                    'status' => 'registered',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Create candidate Marks
                $totalScore = 0;
                $passedCount = 0;
                $failedCount = 0;

                foreach ($raw->subjects as $sub) {
                    $subId = $sub->subject_id;
                    if (!$subId) {
                        // Fallback mapping via database mapped list
                        $mappedSub = DB::table('subject_mappings')
                            ->where('source_system', $session->source_system)
                            ->where('external_code', $sub->subject_code)
                            ->first();
                        $subId = $mappedSub ? $mappedSub->subject_id : null;
                    }

                    if (!$subId) {
                        continue;
                    }

                    // Link Examination Subject
                    $examSub = DB::table('examination_subjects')
                        ->where('examination_id', $examId)
                        ->where('class_level_id', $classLevel->id)
                        ->where('subject_id', $subId)
                        ->first();

                    if (!$examSub) {
                        $examSubId = Str::uuid()->toString();
                        DB::table('examination_subjects')->insert([
                            'id' => $examSubId,
                            'examination_id' => $examId,
                            'class_level_id' => $classLevel->id,
                            'subject_id' => $subId,
                            'max_marks' => 100.00,
                            'pass_marks' => 30.00,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } else {
                        $examSubId = $examSub->id;
                    }

                    $grade = $sub->grade;
                    $score = 75.00; // Standard mappings
                    if ($grade == 'B') $score = 65.00;
                    elseif ($grade == 'C') $score = 50.00;
                    elseif ($grade == 'D') $score = 35.00;
                    elseif ($grade == 'F') $score = 15.00;

                    if ($grade != 'F') $passedCount++;
                    else $failedCount++;

                    $totalScore += $score;

                    DB::table('marks')->insert([
                        'id' => Str::uuid()->toString(),
                        'examination_registration_id' => $registrationId,
                        'examination_subject_id' => $examSubId,
                        'final_score' => $score,
                        'grade' => $grade,
                        'points' => $sub->points,
                        'remarks' => $grade == 'F' ? 'Fail' : 'Pass',
                        'is_validated' => true,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                $avg = count($raw->subjects) > 0 ? ($totalScore / count($raw->subjects)) : 0;

                DB::table('student_exam_summaries')->insert([
                    'id' => Str::uuid()->toString(),
                    'examination_registration_id' => $registrationId,
                    'total_marks' => $totalScore,
                    'average_marks' => $avg,
                    'gpa' => $raw->points ? ($raw->points / 7) : 0,
                    'division' => $raw->division,
                    'division_points' => $raw->points,
                    'passed_subjects_count' => $passedCount,
                    'failed_subjects_count' => $failedCount,
                    'status' => 'processed',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Promote Summaries
            $rawSummaries = RawSummary::where('import_session_id', $sessionId)->get();
            foreach ($rawSummaries as $sum) {
                $schoolId = $this->resolveSchoolId($sum->centre_number, $session->source_system, $session->year, $sum->school_name);

                $existing = DB::table('school_exam_summaries')
                    ->where('examination_id', $examId)
                    ->where('school_id', $schoolId)
                    ->where('class_level_id', $classLevel->id)
                    ->first();

                if ($existing) {
                    DB::table('school_exam_summaries')
                        ->where('id', $existing->id)
                        ->update([
                            'registered_candidates' => $existing->registered_candidates + $sum->sat_candidates + $sum->absent_candidates,
                            'sat_candidates' => $existing->sat_candidates + $sum->sat_candidates,
                            'absent_candidates' => $existing->absent_candidates + $sum->absent_candidates,
                            'division_i_count' => $existing->division_i_count + $sum->division_i_count,
                            'division_ii_count' => $existing->division_ii_count + $sum->division_ii_count,
                            'division_iii_count' => $existing->division_iii_count + $sum->division_iii_count,
                            'division_iv_count' => $existing->division_iv_count + $sum->division_iv_count,
                            'division_zero_count' => $existing->division_zero_count + $sum->division_zero_count,
                            'updated_at' => now()
                        ]);
                } else {
                    DB::table('school_exam_summaries')->insert([
                        'id' => Str::uuid()->toString(),
                        'examination_id' => $examId,
                        'school_id' => $schoolId,
                        'class_level_id' => $classLevel->id,
                        'registered_candidates' => $sum->sat_candidates + $sum->absent_candidates,
                        'sat_candidates' => $sum->sat_candidates,
                        'absent_candidates' => $sum->absent_candidates,
                        'division_i_count' => $sum->division_i_count,
                        'division_ii_count' => $sum->division_ii_count,
                        'division_iii_count' => $sum->division_iii_count,
                        'division_iv_count' => $sum->division_iv_count,
                        'division_zero_count' => $sum->division_zero_count,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            // Mark session as promoted and clean up staging data
            $session->update([
                'status' => 'promoted',
                'finished_at' => now()
            ]);

            // Clear the raw data since it's already in production. Deleting RawCandidate will cascade delete raw_subjects.
            RawCandidate::where('import_session_id', $sessionId)->delete();
            RawSummary::where('import_session_id', $sessionId)->delete();
            
            return true;
        });
    }
}
