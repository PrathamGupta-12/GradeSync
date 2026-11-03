# GradeSync 📊

**GradeSync** is a lightweight, full-stack academic performance analyzer designed to evaluate student exam datasets. Powered by a high-performance **FastAPI** backend and vectorized **Pandas/NumPy** processing, GradeSync provides real-time statistical breakdowns, subject-wise consistency metrics, and dynamic progression trends through a dark-themed visual dashboard.

---

## 🌟 Key Features

* **⚡ Fast Data Processing:** Ingests and processes CSV datasets using vectorized Pandas/NumPy operations.
* **📈 Score Progression Charting:** Native SVG-based trend chart illustrating score trajectories without heavy external charting library dependencies.
* **📚 Subject Breakdown:** Categorized performance metrics with progress bars, weighted totals, and automatic score anomaly detection.
* **🔍 Exam Records Explorer:** Client-side filtering by subject and exam type, real-time search, and smooth pagination.
* **🛡️ Bulletproof Serialization:** Built-in safeguards against `NaN`, infinite values, and mathematical edge cases (e.g., division by zero).

---

## 🛠️ Tech Stack

* **Backend:** Python 3.10+, FastAPI, Uvicorn
* **Data Analysis:** Pandas, NumPy
* **Frontend:** Vanilla HTML5, Hand-crafted CSS3 (CSS Variables, Flexbox/Grid), Modern JavaScript (ES6+)

---

## 📁 Required CSV Format

To analyze data, upload a `.csv` file containing the following exact headers:

```csv
Date,Subject,ExamType,MarksObtained,MaxMarks
2025-10-12,Physics,Unit Test,18,20
2025-10-15,Mathematics,Mid Term,65,70
```

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/GradeSync.git](https://github.com/your-username/GradeSync.git)
cd GradeSync
```

### 2. Set Up the Backend
Create and activate a virtual environment, then install required dependencies:

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install required packages
pip install fastapi uvicorn pandas numpy python-multipart
```

### 3. Run the FastAPI Server
Start the Uvicorn development server:

```bash
uvicorn main:app --reload
```
> The API server will run locally at `http://127.0.0.1:8000`.

### 4. Launch the Frontend
Open `index.html` directly in your browser or run it using a local static server (like VS Code Live Server). Upload a valid CSV file to generate your dashboard!

---

## 📌 API Endpoints

| Method | Endpoint   | Description                                       |
| :---   | :---       | :---                                              |
| `POST` | `/analyze` | Accepts a `.csv` file upload and returns full statistical breakdown |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
