import { useState } from "react";
import axios from "axios";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calculator,
  BarChart3,
  Sparkles,
  Loader2,
  Download,
  RotateCcw,
  ShieldAlert,
  Scissors,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [cleaningResult, setCleaningResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState("");

  const [missingActions, setMissingActions] = useState({});
  const [outlierActions, setOutlierActions] = useState({});

  // ---------------------------------------------------------
  // FILE SELECT & RESET
  // ---------------------------------------------------------

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setAnalysis(null);
    setCleaningResult(null);
    setMissingActions({});
    setOutlierActions({});
    setError("");
  };

  const resetAll = () => {
    setFile(null);
    setAnalysis(null);
    setCleaningResult(null);
    setMissingActions({});
    setOutlierActions({});
    setError("");
  };

  // ---------------------------------------------------------
  // ANALYZE DATASET
  // ---------------------------------------------------------

  const analyzeDataset = async () => {
    if (!file) {
      setError("Please select a CSV or Excel file first.");
      return;
    }

    setLoading(true);
    setError("");
    setCleaningResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/analyze`,
        formData
      );

      setAnalysis(response.data);

      // Missing value recommendations
      const recommendedActions = {};

      response.data?.missing_analysis?.forEach((item) => {
        recommendedActions[item.column] =
          item.recommended_action;
      });

      setMissingActions(recommendedActions);

      // Outlier recommendations
      const recommendedOutlierActions = {};

      response.data?.outlier_analysis?.forEach((item) => {
        recommendedOutlierActions[item.column] =
          item.outliers > 0 ? "keep" : "keep";
      });

      setOutlierActions(recommendedOutlierActions);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to analyze the dataset."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // CHANGE MISSING VALUE ACTION
  // ---------------------------------------------------------

  const handleActionChange = (column, action) => {
    setMissingActions((previous) => ({
      ...previous,
      [column]: action,
    }));
  };

  // ---------------------------------------------------------
  // CHANGE OUTLIER ACTION
  // ---------------------------------------------------------

  const handleOutlierActionChange = (column, action) => {
    setOutlierActions((previous) => ({
      ...previous,
      [column]: action,
    }));
  };

  // ---------------------------------------------------------
  // CLEAN DATASET
  // ---------------------------------------------------------

  const cleanDataset = async () => {
    if (!file) return;

    setCleaning(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "missing_actions",
        JSON.stringify(missingActions)
      );

      formData.append(
        "outlier_actions",
        JSON.stringify(outlierActions)
      );

      const response = await axios.post(
        `${API_URL}/clean`,
        formData
      );

      setCleaningResult(response.data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to clean the dataset."
      );
    } finally {
      setCleaning(false);
    }
  };

  // ---------------------------------------------------------
  // DOWNLOAD CLEANED FILE
  // ---------------------------------------------------------

  const downloadCleanedFile = () => {
    if (!cleaningResult?.preview) return;

    const preview = cleaningResult.preview;

    if (preview.length === 0) return;

    const headers = Object.keys(preview[0]);

    const csvRows = [
      headers.join(","),

      ...preview.map((row) =>
        headers
          .map((fieldName) =>
            JSON.stringify(row[fieldName] ?? "")
          )
          .join(",")
      ),
    ];

    const blob = new Blob(
      [csvRows.join("\n")],
      { type: "text/csv" }
    );

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.setAttribute("href", url);

    a.setAttribute(
      "download",
      `cleaned_${file?.name || "dataset.csv"}`
    );

    a.click();

    window.URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------
  // MISSING ACTION BUTTON
  // ---------------------------------------------------------

  const ActionButton = ({
    column,
    action,
    label,
    icon,
    disabled = false,
  }) => {
    const selected =
      missingActions[column] === action;

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          handleActionChange(column, action)
        }
        className={`
          flex items-center gap-2 rounded-xl px-4 py-2.5
          text-sm font-medium transition-all duration-200 border
          ${
            selected
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
          }
          ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : ""
          }
        `}
      >
        {icon}
        {label}
      </button>
    );
  };

  // ---------------------------------------------------------
  // OUTLIER ACTION BUTTON
  // ---------------------------------------------------------

  const OutlierActionButton = ({
    column,
    action,
    label,
    icon,
  }) => {
    const selected =
      outlierActions[column] === action;

    return (
      <button
        type="button"
        onClick={() =>
          handleOutlierActionChange(
            column,
            action
          )
        }
        className={`
          flex items-center gap-2 rounded-xl px-4 py-2.5
          text-sm font-medium transition-all duration-200 border
          ${
            selected
              ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-slate-50"
          }
        `}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <BarChart3 size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                DataLens AI
              </h1>

              <p className="text-xs text-slate-500">
                AI-powered data analysis
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">

            <Sparkles size={16} />

            Intelligent Data Cleaning

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* PAGE TITLE */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Data Preparation
            </p>

            <h2 className="text-3xl font-bold tracking-tight">
              Clean your dataset
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              DataLens AI detects missing values and
              potential outliers and recommends suitable
              treatments. You stay in control of every
              cleaning decision.
            </p>

          </div>

          {file && (
            <button
              onClick={resetAll}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Reset All
            </button>
          )}

        </div>


        {/* =================================================
            UPLOAD CARD
        ================================================= */}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

                <FileSpreadsheet
                  size={24}
                  className="text-slate-600"
                />

              </div>

              <div>

                <p className="font-semibold">
                  {file
                    ? file.name
                    : "Upload your dataset"}
                </p>

                <p className="text-sm text-slate-500">
                  CSV or Excel files
                </p>

              </div>

            </div>


            <div className="flex gap-3">

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">

                <Upload size={17} />

                Choose File

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

              </label>


              <button
                onClick={analyzeDataset}
                disabled={!file || loading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 size={17} />

                    Analyze Dataset
                  </>
                )}

              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>

          </div>
        )}


        {/* =================================================
            DATASET SUMMARY
        ================================================= */}

        {analysis && (

          <div className="mb-8 grid gap-4 md:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Rows
              </p>

              <p className="mt-1 text-2xl font-bold">
                {analysis.profile?.rows ?? "-"}
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Columns
              </p>

              <p className="mt-1 text-2xl font-bold">
                {analysis.profile?.columns ?? "-"}
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Missing Value Columns
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-600">
                {analysis.missing_analysis?.length ?? 0}
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Outlier Columns
              </p>

              <p className="mt-1 text-2xl font-bold text-purple-600">

                {analysis.outlier_analysis?.filter(
                  (item) => item.outliers > 0
                ).length ?? 0}

              </p>

            </div>

          </div>
        )}


        {/* =================================================
            MISSING VALUES ANALYSIS
        ================================================= */}

        {analysis?.missing_analysis &&
          analysis.missing_analysis.length > 0 && (

          <section>

            <div className="mb-5 flex items-end justify-between">

              <div>

                <h3 className="text-xl font-bold">
                  Missing Values
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Review DataLens AI recommendations
                  and choose how each column should be
                  handled.
                </p>

              </div>

              <div className="hidden rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 md:block">
                Recommendations selected automatically
              </div>

            </div>


            <div className="space-y-5">

              {analysis.missing_analysis.map(
                (item) => {

                  const isHighMissing =
                    item.percentage >= 70;

                  const dataTypeLower =
                    String(
                      item.data_type
                    ).toLowerCase();

                  const isNumeric =
                    dataTypeLower.includes("int") ||
                    dataTypeLower.includes("float");

                  return (

                    <div
                      key={item.column}
                      className={`rounded-2xl border bg-white p-6 shadow-sm ${
                        isHighMissing
                          ? "border-orange-200"
                          : "border-slate-200"
                      }`}
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-3">

                            <h4 className="text-lg font-bold">
                              {item.column}
                            </h4>

                            {isHighMissing && (

                              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">

                                <AlertTriangle size={13} />

                                High Missingness

                              </span>

                            )}

                          </div>

                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">

                            <span>
                              {item.missing} missing values
                            </span>

                            <span>•</span>

                            <span>
                              {item.percentage}%
                            </span>

                            <span>•</span>

                            <span>
                              {item.data_type}
                            </span>

                          </div>

                        </div>


                        <div
                          className={`rounded-xl px-4 py-3 ${
                            isHighMissing
                              ? "bg-orange-50"
                              : "bg-blue-50"
                          }`}
                        >

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            AI Recommendation
                          </p>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              isHighMissing
                                ? "text-orange-700"
                                : "text-blue-700"
                            }`}
                          >

                            {isHighMissing
                              ? "Remove Column"
                              : item.recommended_action ===
                                "median"
                              ? "Fill with Median"
                              : item.recommended_action ===
                                "mean"
                              ? "Fill with Mean"
                              : item.recommended_action ===
                                "mode"
                              ? "Fill with Mode"
                              : item.recommended_action}

                          </p>

                        </div>

                      </div>


                      <div className="mt-5 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm leading-6 text-slate-600">

                          <span className="font-semibold text-slate-800">
                            Why:
                          </span>{" "}

                          {item.reason}

                        </p>

                      </div>


                      <div className="mt-5">

                        <p className="mb-3 text-sm font-semibold text-slate-700">
                          Choose action
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {isHighMissing ? (

                            <>

                              <ActionButton
                                column={item.column}
                                action="remove_column"
                                label="Remove Column"
                                icon={
                                  <Trash2 size={15} />
                                }
                              />

                              <ActionButton
                                column={item.column}
                                action="keep"
                                label="Keep Missing"
                                icon={
                                  <CheckCircle2
                                    size={15}
                                  />
                                }
                              />

                            </>

                          ) : (

                            <>

                              <ActionButton
                                column={item.column}
                                action="remove_rows"
                                label="Remove Rows"
                                icon={
                                  <Trash2 size={15} />
                                }
                              />

                              {isNumeric && (

                                <>

                                  <ActionButton
                                    column={item.column}
                                    action="mean"
                                    label="Mean"
                                    icon={
                                      <Calculator
                                        size={15}
                                      />
                                    }
                                  />

                                  <ActionButton
                                    column={item.column}
                                    action="median"
                                    label="Median"
                                    icon={
                                      <Calculator
                                        size={15}
                                      />
                                    }
                                  />

                                </>

                              )}

                              <ActionButton
                                column={item.column}
                                action="mode"
                                label="Mode"
                                icon={
                                  <Calculator size={15} />
                                }
                              />

                              <ActionButton
                                column={item.column}
                                action="keep"
                                label="Keep Missing"
                                icon={
                                  <CheckCircle2
                                    size={15}
                                  />
                                }
                              />

                            </>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </section>

        )}


        {/* =================================================
            NO MISSING VALUES
        ================================================= */}

        {analysis?.missing_analysis &&
          analysis.missing_analysis.length === 0 && (

          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">

            <CheckCircle2
              size={42}
              className="mx-auto text-green-600"
            />

            <h3 className="mt-4 text-xl font-bold text-green-900">
              No Missing Values Found
            </h3>

            <p className="mt-2 text-sm text-green-700">
              Your dataset is ready for the next stage
              of analysis.
            </p>

          </div>

        )}


        {/* =================================================
            OUTLIER DETECTION & TREATMENT
        ================================================= */}

        {analysis?.outlier_analysis &&
          analysis.outlier_analysis.length > 0 && (

          <section className="mt-10">

            <div className="mb-5 flex items-end justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <h3 className="text-xl font-bold">
                    Outlier Detection & Treatment
                  </h3>

                  <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">

                    <ShieldAlert size={13} />

                    IQR Method

                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Potential numerical outliers are detected
                  using the Interquartile Range method.
                  Choose how you want to handle them.
                </p>

              </div>

              <div className="hidden rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 md:block">
                No outliers are removed automatically
              </div>

            </div>


            <div className="space-y-5">

             {analysis.outlier_analysis.filter((item) => item.outliers > 0).map(
                (item) => {

                  const hasOutliers =
                    item.outliers > 0;

                  return (

                    <div
                      key={item.column}
                      className={`rounded-2xl border bg-white p-6 shadow-sm ${
                        hasOutliers
                          ? "border-purple-200"
                          : "border-slate-200"
                      }`}
                    >

                      {/* TOP */}

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h4 className="text-lg font-bold">
                              {item.column}
                            </h4>

                            {hasOutliers ? (

                              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">

                                <AlertTriangle
                                  size={13}
                                />

                                Potential Outliers

                              </span>

                            ) : (

                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                <CheckCircle2
                                  size={13}
                                />

                                No Outliers

                              </span>

                            )}

                          </div>


                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">

                            <span>
                              {item.outliers} outliers
                            </span>

                            <span>•</span>

                            <span>
                              {item.percentage}%
                            </span>

                            <span>•</span>

                            <span>
                              Method: {item.method}
                            </span>

                          </div>

                        </div>


                        <div
                          className={`rounded-xl px-4 py-3 ${
                            hasOutliers
                              ? "bg-purple-50"
                              : "bg-green-50"
                          }`}
                        >

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Recommendation
                          </p>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              hasOutliers
                                ? "text-purple-700"
                                : "text-green-700"
                            }`}
                          >

                            {hasOutliers
                              ? "Review Outliers"
                              : "Keep Values"}

                          </p>

                        </div>

                      </div>


                      {/* IQR INFORMATION */}

                      <div className="mt-5 grid gap-3 md:grid-cols-3">

                        <div className="rounded-xl bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Lower Bound
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-800">
                            {item.lower_bound}
                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Upper Bound
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-800">
                            {item.upper_bound}
                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Outlier Percentage
                          </p>

                          <p className="mt-1 text-lg font-bold text-purple-700">
                            {item.percentage}%
                          </p>

                        </div>

                      </div>


                      {/* REASON */}

                      <div className="mt-5 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm leading-6 text-slate-600">

                          <span className="font-semibold text-slate-800">
                            Analysis:
                          </span>{" "}

                          {item.reason}

                        </p>

                      </div>


                      {/* ACTIONS */}

                      <div className="mt-5">

                        <p className="mb-3 text-sm font-semibold text-slate-700">
                          Choose treatment
                        </p>

                        <div className="flex flex-wrap gap-2">

                          <OutlierActionButton
                            column={item.column}
                            action="keep"
                            label="Keep"
                            icon={
                              <CheckCircle2
                                size={15}
                              />
                            }
                          />

                          {hasOutliers && (

                            <>

                              <OutlierActionButton
                                column={item.column}
                                action="remove_rows"
                                label="Remove Rows"
                                icon={
                                  <Scissors
                                    size={15}
                                  />
                                }
                              />

                              <OutlierActionButton
                                column={item.column}
                                action="cap"
                                label="Cap Values"
                                icon={
                                  <ShieldAlert
                                    size={15}
                                  />
                                }
                              />

                            </>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </section>

        )}


        {/* =================================================
            APPLY CLEANING
        ================================================= */}

        {analysis && (
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:flex-row">

            <div>

              <h4 className="font-bold text-blue-900">
                Ready to clean your dataset?
              </h4>

              <p className="mt-1 text-sm text-blue-700">
                Your selected missing-value and outlier
                treatments will be applied.
              </p>

            </div>


            <button
              onClick={cleanDataset}
              disabled={cleaning}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {cleaning ? (

                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Cleaning...

                </>

              ) : (

                <>
                  <CheckCircle2 size={18} />

                  Apply Cleaning

                </>

              )}

            </button>

          </div>
        )}


        {/* =================================================
            CLEANING RESULT
        ================================================= */}

        {cleaningResult?.success && (

          <section className="mt-10">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold">
                  Cleaning Complete
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Here's what changed after applying
                  your selected actions.
                </p>

              </div>


              <button
                onClick={downloadCleanedFile}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-green-700"
              >

                <Download size={18} />

                Export Cleaned CSV

              </button>

            </div>


            {/* CLEANING SUMMARY */}

            <div className="grid gap-4 md:grid-cols-5">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-slate-500">
                  Original Rows
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {cleaningResult.cleaning?.original_rows ?? "-"}
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-slate-500">
                  Final Rows
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {cleaningResult.cleaning?.final_rows ?? "-"}
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-slate-500">
                  Columns Removed
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {cleaningResult.cleaning?.columns_removed?.length ?? 0}
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-slate-500">
                  Missing Values Filled
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {cleaningResult.cleaning?.missing_values_filled ?? 0}
                </p>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-slate-500">
                  Outlier Detected
                </p>

                <p className="mt-1 text-2xl font-bold text-purple-600">
                  {cleaningResult.cleaning?.outlier_actions_applied?.reduce(
                    (total, item) => total + (item.outliers_before || 0),
                    0
                 ) ?? 0}
                </p>

              </div>

            </div>

            {/* OUTLIER TREATMENT DETAILS */}

{Array.isArray(
  cleaningResult.cleaning?.outlier_actions_applied
) &&
  cleaningResult.cleaning.outlier_actions_applied.length > 0 && (

    <div className="mt-6 rounded-2xl border border-purple-200 bg-white shadow-sm">

      <div className="border-b border-purple-100 bg-purple-50 p-5">

        <div className="flex items-center gap-3">

          <ShieldAlert
            size={20}
            className="text-purple-600"
          />

          <div>

            <h4 className="font-bold text-purple-900">
              Outlier Treatment Details
            </h4>

            <p className="mt-1 text-sm text-purple-700">
              Detailed summary of how each selected
              outlier treatment was applied.
            </p>

          </div>

        </div>

      </div>


      <div className="divide-y divide-slate-100">

        {cleaningResult.cleaning.outlier_actions_applied.map(
          (item, index) => {

            const actionLabel =
              item.action === "remove_rows"
                ? "Remove Rows"
                : item.action === "cap"
                ? "Cap Values"
                : "Keep";

            const actionDescription =
              item.action === "remove_rows"
                ? `${item.rows_removed} row${
                    item.rows_removed === 1 ? "" : "s"
                  } removed because they contained outlier values.`
                : item.action === "cap"
                ? `${item.values_capped} outlier value${
                    item.values_capped === 1 ? "" : "s"
                  } capped within the IQR boundaries.`
                : "Outlier values were kept unchanged.";

            const isApplied =
              item.action !== "keep";

            return (

              <div
                key={`${item.column}-${index}`}
                className="p-5"
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  {/* COLUMN INFO */}

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h5 className="text-lg font-bold text-slate-900">
                        {item.column}
                      </h5>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isApplied
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isApplied
                          ? "Treatment Applied"
                          : "Kept Unchanged"}
                      </span>

                    </div>


                    <div className="mt-2 text-sm text-slate-500">

                      {item.outliers_before} potential outliers detected

                    </div>

                  </div>


                  {/* ACTION */}

                  <div className="rounded-xl bg-purple-50 px-4 py-3">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Treatment
                    </p>

                    <p className="mt-1 text-sm font-bold text-purple-700">
                      {actionLabel}
                    </p>

                  </div>

                </div>


                {/* DETAILS */}

                <div className="mt-4 grid gap-3 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Outliers Detected
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {item.outliers_before}
                    </p>

                  </div>


                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Rows Removed
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {item.rows_removed}
                    </p>

                  </div>


                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Values Capped
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {item.values_capped}
                    </p>

                  </div>

                </div>


                {/* IQR BOUNDS */}

                <div className="mt-3 grid gap-3 md:grid-cols-2">

                  <div className="rounded-xl border border-slate-100 bg-white p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lower IQR Bound
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {item.lower_bound}
                    </p>

                  </div>


                  <div className="rounded-xl border border-slate-100 bg-white p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Upper IQR Bound
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {item.upper_bound}
                    </p>

                  </div>

                </div>


                {/* EXPLANATION */}

                <div className="mt-4 rounded-xl bg-slate-50 p-4">

                  <p className="text-sm leading-6 text-slate-600">

                    <span className="font-semibold text-slate-800">
                      Result:
                    </span>{" "}

                    {actionDescription}

                  </p>

                </div>

              </div>

            );

          }
        )}

      </div>

    </div>

  )}

            {/* CLEANED PREVIEW */}

            {Array.isArray(cleaningResult.preview) &&
              cleaningResult.preview.length > 0 && (

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-5">

                  <h4 className="font-bold">
                    Cleaned Dataset Preview
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    First 10 rows after cleaning
                  </p>

                </div>


                <div className="overflow-x-auto">

                  <table className="min-w-full border-collapse text-left text-sm">

                    <thead className="bg-slate-50">

                      <tr>

                        {Object.keys(
                          cleaningResult.preview[0] || {}
                        ).map((column) => (

                          <th
                            key={column}
                            className="whitespace-nowrap border-b border-slate-200 px-5 py-3 font-semibold text-slate-600"
                          >
                            {column}
                          </th>

                        ))}

                      </tr>

                    </thead>


                    <tbody>

                      {cleaningResult.preview.map(
                        (row, rowIndex) => (

                        <tr
                          key={`row-${rowIndex}`}
                          className="border-t border-slate-100"
                        >

                          {Object.values(row).map(
                            (value, cellIndex) => (

                            <td
                              key={`cell-${rowIndex}-${cellIndex}`}
                              className="whitespace-nowrap border-b border-slate-100 px-5 py-3 text-slate-600"
                            >

                              {value === null ||
                              value === undefined
                                ? ""
                                : String(value)}

                            </td>

                          ))}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </section>

        )}

      </main>

    </div>
  );
}

export default App;