<?php

namespace App\Domains\Results\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\School\Models\School;

class NectaIntegrationService
{
    protected string $pythonServiceUrl;

    public function __construct()
    {
        $this->pythonServiceUrl = env('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000');
    }

    public function fetchYears(string $examType): array
    {
        $response = Http::get("{$this->pythonServiceUrl}/api/necta/years", [
            'exam_type' => $examType
        ]);
        return $response->json();
    }

    public function fetchCentres(string $examType, int $year): array
    {
        $response = Http::get("{$this->pythonServiceUrl}/api/necta/centres", [
            'exam_type' => $examType,
            'year' => $year
        ]);
        return $response->json();
    }

    public function scrapeCentre(string $examType, int $year, string $centreNumber): array
    {
        // Get database subjects to pass for normalization mapping
        $subjects = DB::table('subjects')->select('id', 'name', 'code')->get()->toArray();
        $subjectsArray = array_map(function($sub) {
            return (array)$sub;
        }, $subjects);

        $response = Http::post("{$this->pythonServiceUrl}/api/necta/scrape-centre", [
            'exam_type' => $examType,
            'year' => $year,
            'centre_number' => $centreNumber,
            'database_subjects' => $subjectsArray
        ]);

        return $response->json();
    }

    public function compareResults(array $nectaCandidates, array $dbCandidates): array
    {
        $response = Http::post("{$this->pythonServiceUrl}/api/necta/compare", [
            'necta_candidates' => $nectaCandidates,
            'db_candidates' => $dbCandidates
        ]);

        return $response->json();
    }

    /**
     * Promotes Raw NECTA Staging results into official tables
     */
    public function approveAndPromote(string $sessionId): bool
    {
        $session = DB::table('necta_import_sessions')->where('id', $sessionId)->first();
        if (!$session) {
            return false;
        }

        return DB::transaction(function () use ($session, $sessionId) {
            // 1. Get or create NECTA Examination
            $examType = DB::table('examination_types')->where('code', 'NECTA')->first();
            if (!$examType) {
                $examTypeId = Str::uuid()->toString();
                DB::table('examination_types')->insert([
                    'id' => $examTypeId,
                    'name' => 'National Examinations Council of Tanzania',
                    'code' => 'NECTA',
                    'description' => 'Official national level examinations',
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

            // Find class level (e.g. Form Four for CSEE, Form Two for FTNA)
            $classLevelName = 'Form Four'; // Default fallback
            if ($session->exam_type === 'FTNA') {
                $classLevelName = 'Form Two';
            } elseif ($session->exam_type === 'SFNA') {
                $classLevelName = 'Standard Four';
            } elseif ($session->exam_type === 'PSLE') {
                $classLevelName = 'Standard Seven';
            } elseif ($session->exam_type === 'ACSEE') {
                $classLevelName = 'Form Six';
            }
            
            $classLevel = DB::table('class_levels')->where('name', 'like', "%{$classLevelName}%")->first() 
                ?? DB::table('class_levels')->first();
            
            if (!$classLevel) {
                throw new \Exception("Class level setup for {$classLevelName} is missing.");
            }

            $examId = Str::uuid()->toString();
            DB::table('examinations')->insert([
                'id' => $examId,
                'academic_year_id' => $academicYear->id,
                'examination_type_id' => $examTypeId,
                'target_class_level_id' => $classLevel->id,
                'name' => "NECTA {$session->exam_type} {$session->year}",
                'start_date' => now(),
                'end_date' => now(),
                'status' => 'processed',
                'created_by' => $session->started_by,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Link Class Level to Examination
            DB::table('examination_class_levels')->insert([
                'id' => Str::uuid()->toString(),
                'examination_id' => $examId,
                'class_level_id' => $classLevel->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Get all raw results
            $rawResults = DB::table('raw_necta_results')->where('import_session_id', $sessionId)->get();

            foreach ($rawResults as $raw) {
                // Find or create Student
                // Map centre number to school
                $school = School::where('registration_number', 'like', "%{$raw->centre_number}%")
                    ->orWhere('name', 'like', "%{$raw->centre_number}%")->first();
                $schoolId = $school ? $school->id : School::first()->id; // Fallback

                // We try matching student by candidate number/exam number or registration number
                $student = Student::where('school_id', $schoolId)
                    ->where('academic_year_id', $academicYear->id)
                    ->where('current_class_level_id', $classLevel->id)
                    ->where('registration_number', $raw->candidate_number)
                    ->first();
                if (!$student) {
                    $studentId = Str::uuid()->toString();
                    Student::create([
                        'id' => $studentId,
                        'school_id' => $schoolId,
                        'academic_year_id' => $academicYear->id,
                        'current_class_level_id' => $classLevel->id,
                        'registration_number' => $raw->candidate_number,
                        'first_name' => 'Candidate',
                        'last_name' => str_replace('/', '-', $raw->candidate_number),
                        'gender' => $raw->gender ?? 'M',
                        'status' => 'active'
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

                // Create Marks
                $normalizedSubjects = json_decode($raw->normalized_subjects, true) ?? [];
                $totalScore = 0;
                $passedCount = 0;
                $failedCount = 0;
                
                foreach ($normalizedSubjects as $sub) {
                    if (!$sub['subject_id']) {
                        // Find or link a subject by name
                        $dbSub = DB::table('subjects')->where('name', 'like', "%{$sub['subject_name']}%")->first();
                        $subId = $dbSub ? $dbSub->id : null;
                    } else {
                        $subId = $sub['subject_id'];
                    }

                    if (!$subId) {
                        continue;
                    }

                    // Ensure examination subject mapping exists
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
                            'paper_one_weight' => 100.00,
                            'paper_two_weight' => 0.00,
                            'paper_one_max_marks' => 100.00,
                            'paper_two_max_marks' => 0.00,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } else {
                        $examSubId = $examSub->id;
                    }

                    // Insert Mark
                    // Convert NECTA grades to arbitrary score mapping
                    $grade = $sub['grade'];
                    $score = 75.00;
                    if ($grade == 'B') $score = 65.00;
                    elseif ($grade == 'C') $score = 50.00;
                    elseif ($grade == 'D') $score = 35.00;
                    elseif ($grade == 'F') $score = 15.00;

                    if ($grade != 'F') {
                        $passedCount++;
                    } else {
                        $failedCount++;
                    }
                    $totalScore += $score;

                    DB::table('marks')->insert([
                        'id' => Str::uuid()->toString(),
                        'examination_registration_id' => $registrationId,
                        'examination_subject_id' => $examSubId,
                        'final_score' => $score,
                        'grade' => $grade,
                        'points' => $sub['points'],
                        'remarks' => $grade == 'F' ? 'Fail' : 'Pass',
                        'is_validated' => true,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                // Create Student Exam Summary
                $avg = count($normalizedSubjects) > 0 ? ($totalScore / count($normalizedSubjects)) : 0;
                
                DB::table('student_exam_summaries')->insert([
                    'id' => Str::uuid()->toString(),
                    'examination_registration_id' => $registrationId,
                    'total_marks' => $totalScore,
                    'average_marks' => $avg,
                    'gpa' => $raw->points ? ($raw->points / 7) : 0, # Rough division gpa
                    'division' => $raw->division,
                    'division_points' => $raw->points,
                    'passed_subjects_count' => $passedCount,
                    'failed_subjects_count' => $failedCount,
                    'status' => 'processed',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Mark session as verified/completed and raw results as verified
            DB::table('necta_import_sessions')->where('id', $sessionId)->update([
                'status' => 'completed',
                'finished_at' => now()
            ]);

            DB::table('raw_necta_results')->where('import_session_id', $sessionId)->update([
                'is_verified' => true
            ]);

            return true;
        });
    }
}
