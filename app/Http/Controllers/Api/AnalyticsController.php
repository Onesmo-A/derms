<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Examination\Models\Examination;
use App\Domains\Analytics\Services\DistrictAnalyticsService;
use App\Http\Requests\Api\Analytics\DistrictOverviewRequest;

class AnalyticsController extends Controller
{
    public function __construct(
        protected DistrictAnalyticsService $analyticsService
    ) {}

    /**
     * Get district-wide dashboard overview statistics.
     */
    public function getDistrictOverview(DistrictOverviewRequest $request)
    {
        $criteria = $request->toData();
        $exam = Examination::findOrFail($criteria->examinationId);
        $this->authorize('view', $exam);

        $analytics = $this->analyticsService->getDistrictOverview(
            $criteria->examinationId,
            $criteria->classLevelId
        );

        return response()->json($analytics);
    }
}
