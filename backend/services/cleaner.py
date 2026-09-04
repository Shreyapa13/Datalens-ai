import numpy as np
import pandas as pd

HIGH_MISSING_THRESHOLD = 70.0


# =========================================================
# MISSING VALUE ANALYSIS
# =========================================================

def analyze_missing_values(df: pd.DataFrame):
    """Detect missing values and provide recommendations.

    Does NOT modify the dataset.
    """
    missing_report = []

    for column in df.columns:
        missing_count = int(df[column].isna().sum())

        if missing_count == 0:
            continue

        percentage = round((missing_count / len(df)) * 100, 2)

        if percentage >= HIGH_MISSING_THRESHOLD:
            recommended_action = "remove_column"
            reason = (
                f"{percentage}% of values are missing. "
                "Removing the column is recommended."
            )
        elif pd.api.types.is_numeric_dtype(df[column]):
            recommended_action = "median"
            reason = (
                "Numeric column with missing values. "
                "Median filling is recommended."
            )
        else:
            recommended_action = "mode"
            reason = (
                "Categorical column with missing values. "
                "Mode filling is recommended."
            )

        missing_report.append({
            "column": column,
            "missing": missing_count,
            "percentage": percentage,
            "data_type": str(df[column].dtype),
            "recommended_action": recommended_action,
            "reason": reason,
        })

    return missing_report


# =========================================================
# APPLY MISSING VALUE ACTION
# =========================================================

def apply_missing_value_action(
    df: pd.DataFrame, column: str, action: str
) -> pd.DataFrame:
    """Safely apply a missing value strategy without mutating input in-place."""
    if column not in df.columns:
        raise ValueError(f"Column '{column}' does not exist.")

    df_copy = df.copy()

    # Remove entire column
    if action == "remove_column":
        df_copy = df_copy.drop(columns=[column])

    # Remove rows containing missing value
    elif action == "remove_rows":
        df_copy = df_copy.dropna(subset=[column])

    # Fill numeric values with mean
    elif action == "mean":
        if not pd.api.types.is_numeric_dtype(df_copy[column]):
            raise ValueError(
                f"Mean filling can only be used with numeric column '{column}'."
            )

        mean_value = df_copy[column].mean()
        if pd.isna(mean_value):
            mean_value = 0

        df_copy[column] = df_copy[column].fillna(mean_value)

    # Fill numeric values with median
    elif action == "median":
        if not pd.api.types.is_numeric_dtype(df_copy[column]):
            raise ValueError(
                f"Median filling can only be used with numeric column '{column}'."
            )

        median_value = df_copy[column].median()
        if pd.isna(median_value):
            median_value = 0

        df_copy[column] = df_copy[column].fillna(median_value)

    # Fill categorical values with mode
    elif action == "mode":
        mode_values = df_copy[column].mode()

        if mode_values.empty:
            fill_value = "Unknown"
        else:
            fill_value = mode_values.iloc[0]

        df_copy[column] = df_copy[column].fillna(fill_value)

    # Keep missing values
    elif action == "keep":
        pass

    else:
        raise ValueError(f"Unknown missing-value action: {action}")

    return df_copy


# =========================================================
# OUTLIER DETECTION
# =========================================================

def analyze_outliers(df: pd.DataFrame):
    """Detect numerical outliers using the IQR method.

    Outliers are ONLY detected here. They are NOT automatically removed.
    """
    outlier_report = []
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()

    for column in numeric_columns:
        series = df[column].dropna()

        if len(series) < 4:
            continue

        unique_values = series.nunique()
        if unique_values <= 2:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1

        # Skip zero IQR cases where bounds expand infinitely or collapse
        if iqr == 0:
            continue

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_mask = (series < lower_bound) | (series > upper_bound)
        outlier_count = int(outlier_mask.sum())
        percentage = round((outlier_count / len(series)) * 100, 2)

        if outlier_count > 0:
            recommendation = "review"
            reason = (
                "Potential outliers detected using "
                "the IQR method. Review before removing."
            )
        else:
            recommendation = "keep"
            reason = "No significant IQR outliers detected."

        outlier_report.append({
            "column": column,
            "outliers": outlier_count,
            "percentage": percentage,
            "lower_bound": round(float(lower_bound), 4),
            "upper_bound": round(float(upper_bound), 4),
            "method": "IQR",
            "recommended_action": recommendation,
            "reason": reason,
        })

    return outlier_report


# =========================================================
# APPLY OUTLIER ACTION
# =========================================================

def apply_outlier_action(
    df: pd.DataFrame, column: str, action: str
) -> pd.DataFrame:
    if column not in df.columns:
        raise ValueError(f"Column '{column}' does not exist.")

    if not pd.api.types.is_numeric_dtype(df[column]):
        raise ValueError(
            f"Outlier treatment is only supported for numeric column '{column}'."
        )

    df_copy = df.copy()

    if action == "keep":
        return df_copy

    series = df_copy[column].dropna()
    if len(series) < 4:
        return df_copy

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1

    if iqr == 0:
        return df_copy

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    # Remove rows outside boundary bounds
    if action == "remove_rows":
        mask = (
            df_copy[column].isna()
            | (df_copy[column] >= lower_bound)
            & (df_copy[column] <= upper_bound)
        )
        return df_copy.loc[mask].copy()

    # Cap continuous range
    if action == "cap":
        df_copy[column] = df_copy[column].clip(
            lower=lower_bound, upper=upper_bound
        )
        return df_copy

    raise ValueError(f"Unknown outlier action: {action}")


# =========================================================
# COMPLETE CLEANING PIPELINE
# =========================================================

def clean_dataset(
    df: pd.DataFrame,
    missing_actions: dict = None,
    outlier_actions: dict = None,
):
    df_clean = df.copy()

    original_rows = len(df_clean)
    original_columns = len(df_clean.columns)

    missing_values_before = int(df_clean.isna().sum().sum())

    duplicates_removed = int(df_clean.duplicated().sum())
    df_clean = df_clean.drop_duplicates().copy()

    missing_report = analyze_missing_values(df_clean)

    columns_removed = []
    missing_values_filled = 0
    actions_applied = []

    # APPLY MISSING VALUE ACTIONS
    if missing_actions:
        for column, action in missing_actions.items():
            if column not in df_clean.columns:
                continue

            before_missing = int(df_clean[column].isna().sum())

            df_clean = apply_missing_value_action(df_clean, column, action)

            if action == "remove_column":
                columns_removed.append(column)
            elif action in ["mean", "median", "mode"]:
                after_missing = (
                    int(df_clean[column].isna().sum())
                    if column in df_clean.columns
                    else 0
                )
                missing_values_filled += before_missing - after_missing

            actions_applied.append({
                "column": column,
                "action": action,
                "missing_before": before_missing,
            })

       # OUTLIER DETECTION AND TREATMENT
    outlier_report = analyze_outliers(df_clean)
    outlier_actions_applied = []

    if outlier_actions:
        for column, action in outlier_actions.items():

            if column not in df_clean.columns:
                continue

            # Get original outlier information
            outlier_info = next(
                (
                    item
                    for item in outlier_report
                    if item["column"] == column
                ),
                None,
            )

            if not outlier_info:
                continue

            before_rows = len(df_clean)

            # Calculate how many values are actually affected
            outlier_count = outlier_info["outliers"]

            lower_bound = outlier_info["lower_bound"]
            upper_bound = outlier_info["upper_bound"]

            # Count values that will be capped
            values_capped = 0

            if action == "cap":

                series = df_clean[column].dropna()

                values_capped = int(
                    (
                        (series < lower_bound)
                        | (series > upper_bound)
                    ).sum()
                )

            # Apply selected treatment
            df_clean = apply_outlier_action(
                df_clean,
                column,
                action
            )

            after_rows = len(df_clean)

            rows_removed = before_rows - after_rows

            # Human-readable action
            if action == "keep":
                status = "Kept unchanged"

            elif action == "remove_rows":
                status = "Rows removed"

            elif action == "cap":
                status = "Values capped"

            else:
                status = "Applied"

            outlier_actions_applied.append({
                "column": column,
                "action": action,
                "outliers_before": outlier_count,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "rows_removed": rows_removed,
                "values_capped": values_capped,
                "status": status,
            })

    missing_values_after = int(df_clean.isna().sum().sum())

    high_missing_columns = [
        {
            "column": item["column"],
            "missing": item["missing"],
            "percentage": item["percentage"],
            "recommended_action": "remove_column",
            "reason": item["reason"],
        }
        for item in missing_report
        if item["percentage"] >= HIGH_MISSING_THRESHOLD
    ]

    final_outliers = analyze_outliers(df_clean)

    return df_clean, {
        "original_rows": original_rows,
        "original_columns": original_columns,
        "duplicates_removed": duplicates_removed,
        "missing_values_before": missing_values_before,
        "missing_values_filled": missing_values_filled,
        "missing_values_after": missing_values_after,
        "missing_value_options": missing_report,
        "actions_applied": actions_applied,
        "columns_removed": columns_removed,
        "high_missing_columns": high_missing_columns,
        "outliers_detected": final_outliers,
        "outlier_actions_applied": outlier_actions_applied,
        "final_rows": len(df_clean),
        "final_columns": len(df_clean.columns),
        "high_missing_policy": {
            "threshold": HIGH_MISSING_THRESHOLD,
            "mode": "user_choice",
            "description": (
                "Columns with 70% or more missing values receive a "
                "removal recommendation, but the user chooses the final action."
            ),
        },
    }