from configs.external_results import settings

def get_years_url(exam_type: str) -> str:
    return f"{settings.NECTA_PORTAL_URL}/results/view/{exam_type.lower()}"

def get_centres_index_url(exam_type: str, year: int) -> str:
    return f"{settings.NECTA_ONLINE_SYS_URL}/results/{year}/{exam_type.lower()}/index.htm"

def get_centre_results_url(exam_type: str, year: int, centre_number: str) -> str:
    return f"{settings.NECTA_ONLINE_SYS_URL}/results/{year}/{exam_type.lower()}/results/{centre_number.lower()}.htm"
