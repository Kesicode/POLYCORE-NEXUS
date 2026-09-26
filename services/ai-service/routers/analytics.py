"""Analytics router — statistical analysis of numeric data."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np
from scipy import stats

router = APIRouter()


class NumericDataRequest(BaseModel):
    data: List[float] = Field(..., min_length=2, max_length=100000)
    label: Optional[str] = "dataset"


class StatisticsResponse(BaseModel):
    label: str
    count: int
    mean: float
    median: float
    std: float
    variance: float
    min: float
    max: float
    range: float
    q1: float
    q3: float
    iqr: float
    skewness: float
    kurtosis: float
    percentile_90: float
    percentile_95: float
    percentile_99: float


class OutlierResponse(BaseModel):
    method_iqr: List[float]
    method_zscore: List[float]
    count_iqr: int
    count_zscore: int


class DistributionBin(BaseModel):
    bin_start: float
    bin_end: float
    count: int
    frequency: float


class DistributionResponse(BaseModel):
    bins: List[DistributionBin]
    best_fit: str
    fit_params: dict


@router.post("/statistics", response_model=StatisticsResponse)
async def compute_statistics(req: NumericDataRequest):
    """Compute comprehensive statistical summary of a numeric dataset."""
    arr = np.array(req.data, dtype=float)

    if len(arr) < 2:
        raise HTTPException(status_code=400, detail="At least 2 data points required")

    q1, q3 = float(np.percentile(arr, 25)), float(np.percentile(arr, 75))

    return StatisticsResponse(
        label=req.label,
        count=len(arr),
        mean=float(np.mean(arr)),
        median=float(np.median(arr)),
        std=float(np.std(arr, ddof=1)),
        variance=float(np.var(arr, ddof=1)),
        min=float(np.min(arr)),
        max=float(np.max(arr)),
        range=float(np.max(arr) - np.min(arr)),
        q1=q1,
        q3=q3,
        iqr=float(q3 - q1),
        skewness=float(stats.skew(arr)),
        kurtosis=float(stats.kurtosis(arr)),
        percentile_90=float(np.percentile(arr, 90)),
        percentile_95=float(np.percentile(arr, 95)),
        percentile_99=float(np.percentile(arr, 99)),
    )


@router.post("/outliers", response_model=OutlierResponse)
async def detect_outliers(req: NumericDataRequest):
    """Detect outliers using IQR and Z-score methods."""
    arr = np.array(req.data, dtype=float)

    # IQR method
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    iqr_outliers = arr[(arr < lower) | (arr > upper)].tolist()

    # Z-score method (|z| > 3)
    z_scores = np.abs(stats.zscore(arr))
    zscore_outliers = arr[z_scores > 3].tolist()

    return OutlierResponse(
        method_iqr=iqr_outliers,
        method_zscore=zscore_outliers,
        count_iqr=len(iqr_outliers),
        count_zscore=len(zscore_outliers),
    )


@router.post("/distribution", response_model=DistributionResponse)
async def compute_distribution(req: NumericDataRequest):
    """Compute histogram bins and attempt distribution fitting."""
    arr = np.array(req.data, dtype=float)
    n_bins = min(50, max(10, int(np.sqrt(len(arr)))))

    counts, bin_edges = np.histogram(arr, bins=n_bins)
    total = len(arr)

    bins = [
        DistributionBin(
            bin_start=float(bin_edges[i]),
            bin_end=float(bin_edges[i + 1]),
            count=int(counts[i]),
            frequency=round(float(counts[i]) / total, 4),
        )
        for i in range(len(counts))
    ]

    # Try fitting common distributions
    best_fit = "unknown"
    fit_params: dict = {}
    try:
        # Test normal distribution
        stat, p_value = stats.normaltest(arr)
        if p_value > 0.05:
            best_fit = "normal"
            loc, scale = stats.norm.fit(arr)
            fit_params = {"loc": round(loc, 4), "scale": round(scale, 4), "p_value": round(p_value, 4)}
        else:
            best_fit = "non-normal"
            fit_params = {"p_value": round(p_value, 4), "note": "Data does not follow a normal distribution"}
    except Exception:
        best_fit = "undetermined"

    return DistributionResponse(bins=bins, best_fit=best_fit, fit_params=fit_params)


@router.post("/timeseries")
async def analyze_timeseries(req: NumericDataRequest):
    """Analyze time-series data for trends and patterns."""
    arr = np.array(req.data, dtype=float)
    n = len(arr)
    x = np.arange(n)

    # Linear trend
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, arr)
    trend = "increasing" if slope > 0.001 else "decreasing" if slope < -0.001 else "flat"

    # Moving average (window = 10% of data, min 3)
    window = max(3, n // 10)
    moving_avg = np.convolve(arr, np.ones(window) / window, mode="valid").tolist()

    return {
        "trend": trend,
        "slope": round(float(slope), 6),
        "r_squared": round(float(r_value ** 2), 4),
        "p_value": round(float(p_value), 4),
        "is_significant": p_value < 0.05,
        "moving_average": [round(v, 4) for v in moving_avg],
        "moving_average_window": window,
    }
