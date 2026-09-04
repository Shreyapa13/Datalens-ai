import pandas as pd
import os


def load_dataset(file_path):

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".csv":
        df = pd.read_csv(file_path)

    elif extension in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)

    else:
        raise ValueError(
            "Unsupported file format. Please upload CSV or Excel."
        )

    return df
"""
This allows:
.csv
.xlsx
.xls

"""