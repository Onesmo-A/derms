<?php

namespace App\Http\Controllers\Api;

use App\Domains\Reporting\Services\ExecutiveReportingService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ExecutiveReportingController extends Controller
{
    public function __construct(
        private ExecutiveReportingService $reports,
    ) {}

    public function menu(Request $request)
    {
        return response()->json($this->reports->menu($request->user()));
    }

    public function overview(Request $request)
    {
        return response()->json($this->reports->overview($request->user(), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function national(Request $request)
    {
        return response()->json($this->reports->national($request->user(), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function nationalDetails(Request $request)
    {
        return response()->json($this->reports->nationalDetails($request->user(), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function regions(Request $request)
    {
        return response()->json($this->reports->regions($request->user(), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function region(Request $request, string $regionId)
    {
        return response()->json($this->reports->region($request->user(), $regionId, $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function regionDetails(Request $request, string $regionId)
    {
        return response()->json($this->reports->region($request->user(), $regionId, $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function districts(Request $request)
    {
        return response()->json($this->reports->districts($request->user(), $request->query('region_id'), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function district(Request $request, string $districtId)
    {
        return response()->json($this->reports->district($request->user(), $districtId, $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function districtDetails(Request $request, string $districtId)
    {
        return response()->json($this->reports->district($request->user(), $districtId, $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function schools(Request $request)
    {
        return response()->json($this->reports->schools($request->user(), $request->query('district_id'), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function school(Request $request, string $schoolId)
    {
        return response()->json($this->reports->school(
            $request->user(),
            $schoolId,
            $request->query('exam_id'),
            $request->query('class_level_id')
        ));
    }

    public function schoolDetails(Request $request, string $schoolId)
    {
        return response()->json($this->reports->schoolDetails(
            $request->user(),
            $schoolId,
            $request->query('exam_id'),
            $request->query('class_level_id')
        ));
    }

    public function students(Request $request)
    {
        return response()->json($this->reports->students($request->user(), $request->query('school_id'), $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function student(Request $request, string $studentId)
    {
        return response()->json($this->reports->student($request->user(), $studentId, $request->query('exam_id'), $request->query('class_level_id')));
    }

    public function insights(Request $request)
    {
        return response()->json($this->reports->insights($request->user(), $request->query('exam_id'), $request->query('class_level_id')));
    }
}
