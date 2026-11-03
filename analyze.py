import pandas as pd
import numpy as np
from io import BytesIO

def checkExtension(fileName):

    extension = ''
    found = False

    for pointer in fileName:
        if found:
            extension += pointer

        if pointer == '.':
            found = True


    return extension.lower()

def identifyGradeColumns(df):
    
    columnAliases = {
        "Date": [
            "date",
            "exam date",
            "exam_date",
            "test date",
            "test_date",
            "date of exam"
        ],
        "Subject": [
            "subject",
            "course",
            "paper",
            "subject name",
            "subject_name"
        ],
        "Exam Type": [
            "exam type",
            "exam_type",
            "type",
            "test type",
            "assessment",
            "evaluation"
        ],
        "Marks Obtained": [
            "marks obtained",
            "marks_obtained",
            "marks",
            "score",
            "obtained marks",
            "obtained_marks",
            "points"
        ],
        "Maximum Marks": [
            "maximum marks",
            "maximum_marks",
            "max marks",
            "max_marks",
            "total marks",
            "total_marks",
            "out of",
            "total"
        ]
    }

    # Normalize DataFrame column names (strip whitespace, lowercase, clean separators)
    normalizedColumns = {}
    for column in df.columns:
        normalizedColumn = (
            str(column)
            .strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )
        normalizedColumn = " ".join(normalizedColumn.split())
        normalizedColumns[column] = normalizedColumn

    detectedColumns = {}
    usedColumns = set()

    # Match columns against aliases
    for requiredColumn, aliases in columnAliases.items():
        for originalColumn, normalizedColumn in normalizedColumns.items():
            if originalColumn in usedColumns:
                continue

            if normalizedColumn in aliases:
                detectedColumns[requiredColumn] = originalColumn
                usedColumns.add(originalColumn)
                break

    # Check for missing columns
    requiredColumns = list(columnAliases.keys())
    missingColumns = [col for col in requiredColumns if col not in detectedColumns]

    if missingColumns:
        return {
            "success": False,
            "message": "Could not identify all required examination columns.",
            "missingColumns": missingColumns,
            "detectedColumns": detectedColumns
        }

    # Rename columns to standard internal names
    renameMap = {originalName: standardName for standardName, originalName in detectedColumns.items()}
    df = df.rename(columns=renameMap)

    return {
        "success": True,
        "message": "Grade columns identified and validated successfully.",
        "detectedColumns": detectedColumns,
        "data": df
    }

def getOverview(dataframe):

    tRows = dataframe.shape[0]
    tColumns = dataframe.shape[1]
    tNunValues = dataframe.isnull().sum().sum()

    tDuplicateRows = dataframe.duplicated().sum()
    invalid_mask = dataframe['Date'].notna() & pd.to_datetime(dataframe['Date'], errors='coerce').isna()

    tInvalidDates = invalid_mask.sum()

    mask = dataframe['Marks Obtained'].notna() & pd.to_numeric(dataframe['Marks Obtained'], errors='coerce').isna()
    tNonNumericMarks = mask.sum()

    invalid_Marks_Mask = dataframe['Marks Obtained'] > dataframe['Maximum Marks']
    tInvalidMarks = invalid_Marks_Mask.sum()

    return {
        'totalRows' : int(tRows),
        'totalColumns' : int(tColumns),
        'totalNullValues' : int(tNunValues),
        'totalDuplicateRows' : int(tDuplicateRows),
        'totalInvalidDates' : int(tInvalidDates),
        'totalNonNumericMarks' : int(tNonNumericMarks),
        'totalInvalidMarks' : int(tInvalidMarks),
    }

def getScoreProgression(dataframe):

    dataframe['Date'] = pd.to_datetime(dataframe['Date'])

    df_sorted = dataframe.sort_values(by='Date').reset_index(drop=True)
    df_sorted['Percentage'] = (df_sorted['Marks Obtained'] / df_sorted['Maximum Marks']) * 100
    df_sorted['Percentage'] = df_sorted['Percentage'].round(1)

    df_sorted['Date'] = df_sorted['Date'].dt.strftime('%Y-%m-%d')
    sorted_records = df_sorted.to_dict(orient='records')

    grouped_data = dataframe.groupby(['Subject', 'Exam Type'])[['Marks Obtained', 'Maximum Marks']].mean().reset_index().to_dict(orient='records')

    return {
        'sortedByDateAndMarks' : sorted_records,
        'ExamTypeGrouped' : grouped_data
    }

def getSubjectAnalysis(dataframe):

    subjectSummaryTable = dataframe.groupby('Subject').agg(
        Total=('Marks Obtained', 'sum'),
        TotalMaximumMarks=('Maximum Marks', 'sum'),
        ExamCount=('Exam Type', 'count')
    )

    subjectSummaryTable['AveragePercentage'] = (subjectSummaryTable['Total'] / subjectSummaryTable['TotalMaximumMarks']) * 100

    bottomSubject = subjectSummaryTable['AveragePercentage'].idxmin()

    bottomSubjectSummary = (
        subjectSummaryTable.loc[bottomSubject].to_dict()
    )

    highestSubject = subjectSummaryTable['AveragePercentage'].idxmax()

    highestSubjectSummary = (
        subjectSummaryTable.loc[highestSubject].to_dict()
    )

    totalEvaluation = dataframe['Marks Obtained'].sum()

    subjectSummaryTable['Contribution'] = (
        subjectSummaryTable['Total'] / totalEvaluation
    ) * 100

    subjectContributions = (
        subjectSummaryTable['Contribution'].to_dict()
    )

    return {
        'subjectSummaryTable': subjectSummaryTable.to_dict(orient='index'),

        'bottomSubjectInfo': {
            'bottomSubjectName': bottomSubject,
            'bottomSubjectSummary': bottomSubjectSummary
        },

        'highestSubjectInfo': {
            'highestSubjectName': highestSubject,
            'highestSubjectSummary': highestSubjectSummary
        },

        'subjectContributions': subjectContributions
    }

def getUnusualRecords(dataframe):

    dataframe['Outlier Score'] = (dataframe['Marks Obtained'] - dataframe['Marks Obtained'].mean()) / dataframe['Marks Obtained'].std()

    abnormalRecords = dataframe[(dataframe['Outlier Score'].abs() >= 2)].to_dict(orient='records')

    df_sorted = dataframe.sort_values('Date').reset_index(drop=True)

    df_sorted['Mark_Change'] = df_sorted['Marks Obtained'].diff()

    sudden_spikes = df_sorted[df_sorted['Mark_Change'] > 15]
    sudden_drops = df_sorted[df_sorted['Mark_Change'] < -15]

    sudden_spikes = sudden_spikes[['Date', 'Subject', 'Exam Type', 'Marks Obtained', 'Mark_Change']].to_dict(orient='records')
    sudden_drops = sudden_drops[['Date', 'Subject', 'Exam Type', 'Marks Obtained', 'Mark_Change']].to_dict(orient='records')

    return {
        'abnormalRecords' : abnormalRecords,
        'totalAbnormalRecords' : len(abnormalRecords),
        'suddenSpikes' : sudden_spikes,
        'totalSuddenSpikes' : len(sudden_spikes),
        'suddenDepressions' : sudden_drops,
        'totalSuddenDepressions' : len(sudden_drops)
    }

def recordsConversions(df):

    df['Date'] = pd.to_datetime(df['Date'])
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
    df['Percentage'] = (df['Marks Obtained'] / df['Maximum Marks']) * 100

    return df.to_dict(orient='records')

def getStatisticalAnalysis(dataframe):

    marksObtainedArray = np.array(dataframe['Marks Obtained'])

    meanScore = float(marksObtainedArray.mean())
    medianScore = float(np.median(marksObtainedArray))

    standardDeviationScore = float(marksObtainedArray.std())
    variationScore = float(marksObtainedArray.var())

    absoluteMinimumScore = float(marksObtainedArray.min())
    absoluteMaximumScore = float(marksObtainedArray.max())

    labels = ['25th Quartile' , '50th Quartile' , '75th Quartile']
    scoreQuartiles = np.percentile(marksObtainedArray , [25 , 50 , 75])
    quartileSeries = pd.Series(scoreQuartiles , index=labels).to_dict()

    return {
        'meanScore' : meanScore,
        'medianScore' : medianScore,
        'standardDeviationScore' : standardDeviationScore,
        'variationScore' : variationScore,
        'absoluteMinimumScore' : absoluteMinimumScore,
        'absoluteMaximumScore' : absoluteMaximumScore,
        'scoreQuartiles' : quartileSeries
    }

def getoverallPerformanceOverview(dataframe):

    tRecords = len(dataframe)
    overallPercentage = float((dataframe['Marks Obtained'].sum() / dataframe['Maximum Marks'].sum()) * 100)
    maximumMarks = float(dataframe['Marks Obtained'].max())
    minimumMarks = float(dataframe['Marks Obtained'].min())

    dataframe['Date'] = pd.to_datetime(dataframe['Date'])

    earliest = dataframe['Date'].min().strftime('%Y-%m-%d')
    latest = dataframe['Date'].max().strftime('%Y-%m-%d')

    return {
        'totalRecords' : tRecords,
        'overallPercentage' : overallPercentage,
        'maximumMarks' : maximumMarks,
        'minimumMarks' : minimumMarks,
        'evaluationDateRange' : {
            'earliest' : earliest,
            'latest' : latest
        }
    }

def getCategories(dataframe):

    subjects = dataframe['Subject'].unique().tolist()
    examTypes = dataframe['Exam Type'].unique().tolist()

    return {
        'subjects' : subjects,
        'examTypes' : examTypes
    }

class GradeAnalyzer:

    async def fileAnalyzer(self , file):
        file_content = await file.read()

        extension = checkExtension(file.filename)

        if (extension != 'csv'):
            return {
                'error': 'Unsupported file format'
            }

        df = pd.read_csv(BytesIO(file_content))

        dataResult = identifyGradeColumns(df)
        if not dataResult['success']:
            return dataResult

        dataFrame = dataResult['data']

        basicDatasetOverview = getOverview(dataFrame)
        overallPerformanceOverview = getoverallPerformanceOverview(dataFrame)

        subjectWiseBreakdown = getSubjectAnalysis(dataFrame)
        statisticalBreakdown = getStatisticalAnalysis(dataFrame)

        chronologicalBreakdown = getScoreProgression(dataFrame)
        abnormalRecords = getUnusualRecords(dataFrame)

        convertedRecords = recordsConversions(dataFrame)
        categoricalAnalysis = getCategories(dataFrame)

        return {
            'success' : True,
            'basicDatasetOverview' : basicDatasetOverview,
            'overallPerformanceOverview' : overallPerformanceOverview,
            'subjectWiseBreakdown' : subjectWiseBreakdown,
            'statisticalBreakdown' : statisticalBreakdown,
            'chronologicalBreakdown' : chronologicalBreakdown,
            'abnormalRecords' : abnormalRecords,
            'convertedRecords' : convertedRecords,
            'categories' : categoricalAnalysis
        }


        