def profile_dataset(df):

    profile = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": list(df.columns),
        "duplicates": int(df.duplicated().sum()),
        "missing_values": int(df.isnull().sum().sum()),
        "memory_usage": int(df.memory_usage(deep=True).sum())
    }

    columns = []

    for column in df.columns:

        columns.append({
            "name": column,
            "dtype": str(df[column].dtype),
            "missing": int(df[column].isnull().sum()),
            "unique": int(df[column].nunique()),
            "numeric": bool(df[column].dtype.kind in "biufc")
        })

    profile["columns_info"] = columns

    return profile
"""
Now the frontend can display:

Rows             10,420
Columns              18
Missing Values      124
Duplicates           31

"""