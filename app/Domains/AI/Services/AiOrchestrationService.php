<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\Agents\PerformanceAnalysisAgent;
use App\Domains\AI\Agents\StudentRiskAgent;
use App\Domains\AI\Agents\SchoolRecommendationAgent;
use App\Domains\AI\Agents\TrendAnalysisAgent;
use App\Domains\AI\Agents\ExecutiveSummaryAgent;
use Illuminate\Support\Facades\Cache;

/**
 * Central orchestrator for all AI agents.
 * Routes analysis requests to the appropriate agent and manages caching.
 *
 * AI operates in READ-ONLY mode — no data modifications permitted.
 */
class AiOrchestrationService
{
    private const CACHE_TTL = 86400; // 24 hours

    public function __construct(
        private PerformanceAnalysisAgent $performanceAgent,
        private StudentRiskAgent $riskAgent,
        private SchoolRecommendationAgent $recommendationAgent,
        private TrendAnalysisAgent $trendAgent,
        private ExecutiveSummaryAgent $executiveAgent,
    ) {}

    /**
     * Run performance analysis for an examination.
     */
    public function analyzePerformance(string $examId, string $classLevelId, ?string $schoolId = null): array
    {
        $cacheKey = "ai:performance:{$examId}:{$classLevelId}:" . ($schoolId ?? 'district');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($examId, $classLevelId, $schoolId) {
            return $this->performanceAgent->analyze($examId, $classLevelId, $schoolId);
        });
    }

    /**
     * Identify at-risk students.
     */
    public function identifyAtRiskStudents(string $examId, string $classLevelId, ?string $schoolId = null): array
    {
        $cacheKey = "ai:risk:{$examId}:{$classLevelId}:" . ($schoolId ?? 'district');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($examId, $classLevelId, $schoolId) {
            return $this->riskAgent->analyze($examId, $classLevelId, $schoolId);
        });
    }

    /**
     * Generate school-specific improvement recommendations.
     */
    public function getSchoolRecommendations(string $examId, string $schoolId, string $classLevelId): array
    {
        $cacheKey = "ai:recommendations:{$examId}:{$schoolId}:{$classLevelId}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($examId, $schoolId, $classLevelId) {
            return $this->recommendationAgent->analyze($examId, $schoolId, $classLevelId);
        });
    }

    /**
     * Analyze trends across multiple examinations.
     */
    public function analyzeTrends(array $examIds, string $classLevelId, ?string $schoolId = null): array
    {
        $key = implode('-', $examIds);
        $cacheKey = "ai:trends:{$key}:{$classLevelId}:" . ($schoolId ?? 'district');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($examIds, $classLevelId, $schoolId) {
            return $this->trendAgent->analyze($examIds, $classLevelId, $schoolId);
        });
    }

    /**
     * Generate an executive summary briefing for district officers.
     */
    public function generateExecutiveSummary(string $examId, string $classLevelId): array
    {
        $cacheKey = "ai:executive:{$examId}:{$classLevelId}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($examId, $classLevelId) {
            return $this->executiveAgent->analyze($examId, $classLevelId);
        });
    }

    /**
     * Clear all AI caches for a given examination (e.g., after reprocessing).
     */
    public function clearCacheForExam(string $examId): void
    {
        $patterns = ['performance', 'risk', 'recommendations', 'trends', 'executive'];
        foreach ($patterns as $pattern) {
            // In production, use Redis SCAN + DEL pattern. For now, forget known keys.
            Cache::forget("ai:{$pattern}:{$examId}:*");
        }
    }
}
