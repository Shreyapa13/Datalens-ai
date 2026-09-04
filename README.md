# 🔍 DataLens AI — Intelligent Data Analysis Platform

**DataLens AI** is an AI-powered data analysis platform designed to simplify the process of understanding, cleaning, and preparing datasets for machine learning and analytics.

The platform allows users to upload a dataset and automatically analyze important aspects of the data, including **missing values, data quality, and outliers**, while providing recommendations to help users prepare their datasets for further analysis.

---

## 🚀 Project Overview

Working with real-world datasets often involves dealing with missing values, inconsistent data, and outliers before meaningful analysis or machine learning can be performed.

**DataLens AI** aims to automate and simplify this initial data-analysis workflow.

Instead of manually inspecting every column, users can upload their dataset and receive an automated analysis of its data quality.

### ✨ Key Features

* 📂 **Dataset Upload**

  * Upload datasets for automated analysis.

* 🔎 **Data Quality Analysis**

  * Examine the structure and quality of the uploaded dataset.

* ❌ **Missing Value Analysis**

  * Identify columns containing missing values.
  * Calculate missing-value percentages.
  * Provide recommendations for handling missing data.

* 📊 **Outlier Analysis**

  * Detect potential outliers using the **IQR (Interquartile Range)** method.
  * Calculate outlier counts and percentages.
  * Provide recommendations such as keeping or reviewing detected values.

* 🧹 **Data Cleaning Insights**

  * Generate recommendations to help users understand potential data-cleaning requirements.

* 📈 **Interactive Analysis Dashboard**

  * Present dataset analysis in an easy-to-understand interface.

---

## 🧠 Analysis Workflow

```text
             Dataset Upload
                   │
                   ▼
          Dataset Inspection
                   │
          ┌────────┴────────┐
          ▼                 ▼
   Missing Values       Outlier Analysis
          │                 │
          ▼                 ▼
    Recommendations   IQR-Based Detection
          │                 │
          └────────┬────────┘
                   ▼
          Data Quality Insights
                   │
                   ▼
          Ready for Analysis
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS

### Backend

* Python
* FastAPI
* Pandas
* NumPy

### Data Analysis

* Pandas DataFrames
* NumPy
* IQR-based outlier detection
* Missing-value analysis

---

## 📁 Project Structure

```text
DataLens-AI/
│
├── backend/
│   ├── services/
│   │   └── ...
│   ├── main.py
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── ...
│   │   └── App.jsx
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

> The exact structure may vary depending on the current version of the project.

---

## 📊 Missing Value Analysis

DataLens AI examines each column in the dataset and identifies missing values.

The analysis can provide information such as:

* Column name
* Number of missing values
* Missing-value percentage
* Recommended action

The system is designed to **analyze the dataset without unnecessarily modifying the original data during the analysis stage**.

---

## 📉 Outlier Detection

DataLens AI uses the **Interquartile Range (IQR)** approach to identify potential outliers.

The general process is:

```text
Q1 ─────────────── Q2 ─────────────── Q3
│                  │                  │
└──── Normal Range ┴──────────────────┘
```

Values outside the calculated IQR boundaries can be flagged for further inspection.

The system provides information including:

* Number of detected outliers
* Outlier percentage
* Lower bound
* Upper bound
* Detection method
* Recommended action

---

## 🎯 Objectives

The main objectives of DataLens AI are to:

1. Automate initial dataset inspection.
2. Make data-quality problems easier to understand.
3. Detect missing values automatically.
4. Identify potential outliers.
5. Provide useful data-cleaning recommendations.
6. Create a simple interface for interacting with dataset analysis.
7. Reduce the amount of manual work required before performing data analysis or machine learning.

---

## 💡 Why DataLens AI?

Traditional data analysis often requires users to manually inspect datasets using Python scripts or spreadsheet tools.

DataLens AI brings these initial checks together into a single platform.

### Without DataLens AI

```text
Upload Dataset
      ↓
Write Python Code
      ↓
Check Missing Values
      ↓
Check Outliers
      ↓
Analyze Results
      ↓
Decide What to Do
```

### With DataLens AI

```text
Upload Dataset
      ↓
DataLens AI
      ↓
Automated Analysis
      ↓
Insights + Recommendations
```

---

## 🔮 Future Enhancements

Potential future improvements include:

* 🤖 AI-generated dataset insights
* 📊 Advanced visualizations
* 🧹 Automated data-cleaning options
* 🔄 Multiple dataset formats
* 📈 Statistical analysis
* 🔗 Correlation analysis
* 🧠 Machine-learning model recommendations
* 📋 Automated analysis reports
* 💾 Exportable data-quality reports

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

* Python
* Node.js
* npm

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will run locally on:

```text
http://127.0.0.1:8000
```

### Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will then be available through the local Vite development URL shown in the terminal.

---

## 🔐 Environment Variables

If environment variables are required by the project, create a `.env` file and add the required configuration.

**Do not commit `.env` files or sensitive credentials to GitHub.**

---

## 📌 Project Status

🚧 **Currently in Development**

DataLens AI is being developed as an intelligent dataset-analysis platform, with additional analytics and AI capabilities planned for future versions.

---

## 👩‍💻 Author

**Shreya Parulekar**

BE Computer Science Engineering
Artificial Intelligence & Machine Learning

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
