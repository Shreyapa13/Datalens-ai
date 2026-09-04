import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor
)
from sklearn.neighbors import KNeighborsClassifier


# ---------------------------------------------------------
# TARGET LEAKAGE
# ---------------------------------------------------------

def detect_target_leakage(df, target):

    leakage_columns = []

    target_series = df[target]

    for column in df.columns:

        if column == target:
            continue

        try:

            col = df[column]

            target_string = (
                target_series
                .astype(str)
                .str.lower()
                .str.strip()
            )

            col_string = (
                col
                .astype(str)
                .str.lower()
                .str.strip()
            )

            # Direct equality
            if target_string.equals(col_string):

                leakage_columns.append({
                    "column": column,
                    "reason": "Column contains the same values as the target"
                })

                continue

            # Perfect binary mapping
            if target_series.nunique() == 2 and col.nunique() == 2:

                mapping = {}
                valid = True

                for value in col.dropna().unique():

                    corresponding = target_series[
                        col == value
                    ].dropna().unique()

                    if len(corresponding) != 1:
                        valid = False
                        break

                    mapping[value] = corresponding[0]

                if valid and len(mapping) == 2:

                    predictions = col.map(mapping)

                    if predictions.equals(target_series):

                        leakage_columns.append({
                            "column": column,
                            "reason": "Column perfectly predicts the target"
                        })

        except Exception:
            continue

    return leakage_columns


# ---------------------------------------------------------
# REDUNDANT FEATURE DETECTION
# ---------------------------------------------------------

def detect_redundant_features(df):

    redundant_features = []

    columns = df.columns.tolist()

    for i in range(len(columns)):

        for j in range(i + 1, len(columns)):

            col1 = columns[i]
            col2 = columns[j]

            try:

                # Compare categorical/numeric representations
                a = df[col1].astype(str).str.lower().str.strip()
                b = df[col2].astype(str).str.lower().str.strip()

                # Check if each value of col1 maps to exactly
                # one value of col2 and vice versa.
                mapping1 = df.groupby(col1, dropna=False)[col2].nunique()

                mapping2 = df.groupby(col2, dropna=False)[col1].nunique()

                if (
                    len(mapping1) > 1
                    and
                    len(mapping2) > 1
                    and
                    mapping1.max() == 1
                    and
                    mapping2.max() == 1
                ):

                    redundant_features.append({
                        "column": col2,
                        "duplicate_of": col1,
                        "reason": "Feature contains equivalent information"
                    })

            except Exception:
                continue

    return redundant_features


# ---------------------------------------------------------
# TRAIN MODELS
# ---------------------------------------------------------

def train_models(df, target, problem_type):

    if target not in df.columns:
        raise ValueError(
            f"Target column '{target}' not found."
        )

    # Remove missing target rows
    df = df.dropna(subset=[target]).copy()

    # -----------------------------------------------------
    # TARGET LEAKAGE
    # -----------------------------------------------------

    leakage_info = detect_target_leakage(
        df,
        target
    )

    leakage_columns = [
        item["column"]
        for item in leakage_info
    ]

    # -----------------------------------------------------
    # REDUNDANT FEATURES
    # -----------------------------------------------------

    redundant_info = detect_redundant_features(
        df.drop(columns=[target])
    )

    redundant_columns = [
        item["column"]
        for item in redundant_info
    ]

    # Don't accidentally remove leakage twice
    redundant_columns = [
        col
        for col in redundant_columns
        if col not in leakage_columns
    ]

    # -----------------------------------------------------
    # CREATE X / Y
    # -----------------------------------------------------

    columns_to_drop = (
        [target]
        + leakage_columns
        + redundant_columns
    )

    X = df.drop(
        columns=columns_to_drop,
        errors="ignore"
    )

    y = df[target]

    # -----------------------------------------------------
    # CONSTANT FEATURES
    # -----------------------------------------------------

    constant_columns = [
        column
        for column in X.columns
        if X[column].nunique(dropna=False) <= 1
    ]

    if constant_columns:

        X = X.drop(
            columns=constant_columns
        )

    # -----------------------------------------------------
    # DATA TYPES
    # -----------------------------------------------------

    numeric_columns = X.select_dtypes(
        include=["number", "bool"]
    ).columns.tolist()

    categorical_columns = X.select_dtypes(
        exclude=["number", "bool"]
    ).columns.tolist()

    # -----------------------------------------------------
    # PREPROCESSING
    # -----------------------------------------------------

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "scaler",
                StandardScaler()
            )
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent")
            ),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore"
                )
            )
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                numeric_columns
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_columns
            )
        ]
    )

    # -----------------------------------------------------
    # TRAIN TEST SPLIT
    # -----------------------------------------------------

    stratify_value = None

    if problem_type == "classification":

        if y.value_counts().min() >= 2:
            stratify_value = y

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=stratify_value
    )

    # -----------------------------------------------------
    # MODELS
    # -----------------------------------------------------

    if problem_type == "classification":

        models = {

            "Logistic Regression":
                LogisticRegression(
                    max_iter=2000
                ),

            "Decision Tree":
                DecisionTreeClassifier(
                    random_state=42,
                    max_depth=8
                ),

            "Random Forest":
                RandomForestClassifier(
                    n_estimators=200,
                    random_state=42,
                    max_depth=10
                ),

            "Gradient Boosting":
                GradientBoostingClassifier(
                    random_state=42
                ),

            "KNN":
                KNeighborsClassifier(
                    n_neighbors=5
                )
        }

    elif problem_type == "regression":

        models = {

            "Linear Regression":
                LinearRegression(),

            "Decision Tree":
                DecisionTreeRegressor(
                    random_state=42,
                    max_depth=8
                ),

            "Random Forest":
                RandomForestRegressor(
                    n_estimators=200,
                    random_state=42,
                    max_depth=10
                ),

            "Gradient Boosting":
                GradientBoostingRegressor(
                    random_state=42
                )
        }

    else:

        raise ValueError(
            "problem_type must be 'classification' or 'regression'."
        )

    # -----------------------------------------------------
    # TRAIN + EVALUATE
    # -----------------------------------------------------

    results = []

    for model_name, model in models.items():

        try:

            pipeline = Pipeline(
                steps=[
                    (
                        "preprocessor",
                        preprocessor
                    ),
                    (
                        "model",
                        model
                    )
                ]
            )

            pipeline.fit(
                X_train,
                y_train
            )

            predictions = pipeline.predict(
                X_test
            )

            if problem_type == "classification":

                from sklearn.metrics import (
                    accuracy_score,
                    precision_score,
                    recall_score,
                    f1_score
                )

                accuracy = accuracy_score(
                    y_test,
                    predictions
                )

                precision = precision_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0
                )

                recall = recall_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0
                )

                f1 = f1_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0
                )

                results.append({
                    "model": model_name,
                    "accuracy": round(float(accuracy), 4),
                    "precision": round(float(precision), 4),
                    "recall": round(float(recall), 4),
                    "f1": round(float(f1), 4)
                })

            else:

                from sklearn.metrics import (
                    r2_score,
                    mean_squared_error,
                    mean_absolute_error
                )

                r2 = r2_score(
                    y_test,
                    predictions
                )

                rmse = np.sqrt(
                    mean_squared_error(
                        y_test,
                        predictions
                    )
                )

                mae = mean_absolute_error(
                    y_test,
                    predictions
                )

                results.append({
                    "model": model_name,
                    "r2": round(float(r2), 4),
                    "rmse": round(float(rmse), 4),
                    "mae": round(float(mae), 4)
                })

        except Exception as error:

            results.append({
                "model": model_name,
                "error": str(error)
            })

    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {

        "results": results,

        "leakage_detected": leakage_info,

        "leakage_columns_removed": leakage_columns,

        "redundant_features_detected": redundant_info,

        "redundant_columns_removed": redundant_columns,

        "constant_columns_removed": constant_columns,

        "features_used": X.columns.tolist()
    }