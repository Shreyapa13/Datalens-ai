import pandas as pd
import numpy as np

def detect_target(df: pd.DataFrame):
    """
    Automatically detect a likely target column.
    """

    # Common target names
    preferred_names = [
        "target",
        "label",
        "survived",
        "outcome",
        "result",
        "y",
        "churn",
        "default",
        "fraud",
        "price",
        "sales"
    ]

    column_lookup = {
        column.lower(): column
        for column in df.columns
    }

    for name in preferred_names:
        if name in column_lookup:
            return column_lookup[name]

    # Look for binary columns as possible targets
    binary_columns = []

    for column in df.columns:
        unique_count = df[column].nunique(dropna=True)

        if unique_count == 2:
            binary_columns.append(column)

    if len(binary_columns) == 1:
        return binary_columns[0]

    return None

def generate_eda(df: pd.DataFrame, target: str = None):
    
    if target is None:
        target = detect_target(df)
    """
    Generate exploratory data analysis information.
    """

    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_columns = df.select_dtypes(
        exclude=[np.number]
    ).columns.tolist()

    # -----------------------------
    # NUMERIC STATISTICS
    # -----------------------------
    numeric_statistics = {}

    for column in numeric_columns:
        series = df[column]

        numeric_statistics[column] = {
            "mean": round(float(series.mean()), 2),
            "median": round(float(series.median()), 2),
            "std": round(float(series.std()), 2),
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
        }

    # -----------------------------
    # CATEGORICAL STATISTICS
    # -----------------------------
    categorical_statistics = {}

    for column in categorical_columns:
        series = df[column]

        value_counts = series.value_counts(dropna=False).head(10)

        top_values = []

        for value, count in value_counts.items():
            if pd.isna(value):
                value = "Missing"

            top_values.append({
                "value": str(value),
                "count": int(count)
            })

        categorical_statistics[column] = {
            "unique_values": int(series.nunique(dropna=True)),
            "top_values": top_values
        }

    # -----------------------------
    # MISSING VALUES
    # -----------------------------
    missing_values = {}

    for column in df.columns:
        missing_count = int(df[column].isna().sum())

        if missing_count > 0:
            missing_values[column] = {
                "count": missing_count,
                "percentage": round(
                    (missing_count / len(df)) * 100, 2
                )
            }

    # -----------------------------
    # CORRELATION MATRIX
    # -----------------------------
    correlation_matrix = {}

    if len(numeric_columns) >= 2:
        correlation_df = df[numeric_columns].corr()

        for column in correlation_df.columns:
            correlation_matrix[column] = {}

            for other_column in correlation_df.columns:
                value = correlation_df.loc[column, other_column]

                if pd.notna(value):
                    correlation_matrix[column][other_column] = round(
                        float(value), 3
                    )
                else:
                    correlation_matrix[column][other_column] = None

    # -----------------------------
    # TARGET DISTRIBUTION
    # -----------------------------
    target_distribution = {}

    if target is not None and target in df.columns:
        counts = df[target].value_counts(dropna=False)

        for value, count in counts.items():
            if pd.isna(value):
                value = "Missing"

            target_distribution[str(value)] = int(count)

    # -----------------------------
    # AUTOMATIC INSIGHTS
    # -----------------------------
    insights = []

    # Skew detection
    for column in numeric_columns:
        series = df[column].dropna()

        if not series.empty:
            skewness = float(series.skew())

            if abs(skewness) > 1:
                direction = "right" if skewness > 0 else "left"

                insights.append({
                    "type": "skewness",
                    "column": column,
                    "message": (
                        f"{column} is strongly skewed to the {direction}."
                    )
                })

    # Class imbalance detection
    for column in categorical_columns:
        value_counts = df[column].value_counts(normalize=True)

        if not value_counts.empty:
            largest_percentage = float(value_counts.iloc[0])

            if largest_percentage > 0.80:
                insights.append({
                    "type": "class_imbalance",
                    "column": column,
                    "message": (
                        f"{column} has a dominant category "
                        f"representing {round(largest_percentage * 100, 2)}% "
                        f"of the data."
                    )
                })

    # Strong correlation detection
    if len(numeric_columns) >= 2:
        checked_pairs = set()

        for column in numeric_columns:
            for other_column in numeric_columns:
                if column == other_column:
                    continue

                pair = tuple(sorted([column, other_column]))

                if pair in checked_pairs:
                    continue

                checked_pairs.add(pair)

                correlation = correlation_df.loc[column, other_column]

                if pd.notna(correlation) and abs(float(correlation)) >= 0.70:
                    insights.append({
                        "type": "strong_correlation",
                        "columns": [column, other_column],
                        "correlation": round(float(correlation), 3),
                        "message": (
                            f"{column} and {other_column} have a strong "
                            f"correlation of {round(float(correlation), 3)}."
                        )
                    })

    # Missing-value insights
    for column, information in missing_values.items():
        percentage = information["percentage"]

        if percentage >= 50:
            insights.append({
                "type": "missing_values",
                "column": column,
                "message": (
                    f"{column} contains {percentage}% missing values."
                )
            })

    # -----------------------------
    # FINAL RESULT
    # -----------------------------
    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "numeric_statistics": numeric_statistics,
        "categorical_statistics": categorical_statistics,
        "missing_values": missing_values,
        "correlation_matrix": correlation_matrix,
        "target_distribution": target_distribution,
        "insights": insights
    }