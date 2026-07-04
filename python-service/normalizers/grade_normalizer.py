class GradeNormalizer:
    GRADE_POINTS = {
        "A": 1, "B": 2, "C": 3, "D": 4, "F": 5, "S": 5, "X": 0
    }

    @staticmethod
    def get_points(grade: str) -> int:
        return GradeNormalizer.GRADE_POINTS.get(grade.upper().strip(), 5)
