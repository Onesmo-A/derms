# DERMS - District Examination & Results Management System
## Complete Architecture & Design Diagrams

> **Version:** 1.0 | **Stack:** Laravel 13 + React 19 + PostgreSQL 17 | **Pattern:** Modular Monolith + REST API + SPA

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```
+------------------------------------------------------------------+
|                        USER INTERFACES                           |
|                                                                  |
|  +-----------+  +-----------+  +-----------+  +-----------+     |
|  |Super Admin|  |District   |  |School     |  |Teacher /  |     |
|  |Dashboard  |  |Officer    |  |Admin      |  |Data Entry |     |
|  +-----------+  +-----------+  +-----------+  +-----------+     |
+------------------------------+-----------------------------------+
                               |
                     React 19 SPA (Vite)
               Redux Toolkit + RTK Query + React Router
               Tailwind v4 + ShadCN UI + TanStack Table
                               |
                          HTTPS / JSON
                               |
+------------------------------+-----------------------------------+
|                  LARAVEL 13 MODULAR MONOLITH                     |
|  +----------+ +----------+ +----------+ +------------------+    |
|  | Sanctum  | | Spatie   | | Policies | | Rate Limiting    |    |
|  | Auth     | | Permission| | & Gates  | | & Throttle       |    |
|  +----------+ +----------+ +----------+ +------------------+    |
|                                                                  |
|  +-----------------------------------------------------------+  |
|  |              DOMAIN MODULES (app/Domains/)                 |  |
|  |  Identity | School | Student | Examination | Results       |  |
|  |  Reporting | Analytics | Notification | AI                 |  |
|  +-----------------------------------------------------------+  |
|  +-------------+  +----------------------+  +----------------+  |
|  | Redis Cache |  |   Queue Workers       |  | Background Jobs|  |
|  | Sessions    |  | Results Processing    |  | ProcessExamJob |  |
|  | Rate Limit  |  | SMS Dispatch          |  | SendSmsJob     |  |
|  +-------------+  | Report Generation     |  | GeneratePdfJob |  |
|                   +----------------------+   +----------------+  |
+------------------------------+-----------------------------------+
                               |
           +-------------------+-------------------+
           |                   |                   |
   +-------+------+   +--------+-------+   +-------+--------+
   | PostgreSQL 17  |   | Redis 7.x       |   | File Storage   |
   | (Current)      |   | Cache + Queues  |   | PDFs + Exports |
   | Production DB  |   +-----------------+   +----------------+
   +--------------+
```

---

## 2. COMPLETE DATABASE SCHEMA (ERD)

```mermaid
erDiagram
    regions {
        uuid id PK
        string name
        string code
        timestamps ts
    }
    districts {
        uuid id PK
        uuid region_id FK
        string name
        string code
        timestamps ts
    }
    schools {
        uuid id PK
        uuid district_id FK
        string name
        string registration_number
        string type
        string level
        string address
        string phone
        string email
        timestamps ts
    }
    academic_years {
        uuid id PK
        string name
        date start_date
        date end_date
        boolean is_active
        timestamps ts
    }
    class_levels {
        uuid id PK
        string name
        string code
        integer sort_order
        timestamps ts
    }
    users {
        uuid id PK
        string name
        string email
        string password
        uuid school_id FK
        uuid district_id FK
        boolean is_active
        timestamps ts
    }
    students {
        uuid id PK
        uuid school_id FK
        uuid class_level_id FK
        uuid academic_year_id FK
        string first_name
        string last_name
        string gender
        string admission_number
        string national_id
        string parent_phone
        date date_of_birth
        timestamps ts
    }
    subjects {
        uuid id PK
        string name
        string code
        boolean has_practical
        boolean is_compulsory
        timestamps ts
    }
    grading_systems {
        uuid id PK
        string name
        string exam_type
        timestamps ts
    }
    grading_system_details {
        uuid id PK
        uuid grading_system_id FK
        string grade
        decimal min_mark
        decimal max_mark
        integer points
        timestamps ts
    }
    examination_types {
        uuid id PK
        string name
        string code
        timestamps ts
    }
    examinations {
        uuid id PK
        uuid academic_year_id FK
        uuid examination_type_id FK
        uuid grading_system_id FK
        string name
        date start_date
        date end_date
        string status
        boolean is_published
        timestamps ts
    }
    examination_class_levels {
        uuid id PK
        uuid examination_id FK
        uuid class_level_id FK
        timestamps ts
    }
    examination_subjects {
        uuid id PK
        uuid examination_id FK
        uuid class_level_id FK
        uuid subject_id FK
        decimal paper1_weight
        decimal paper2_weight
        integer max_marks
        timestamps ts
    }
    examination_registrations {
        uuid id PK
        uuid examination_id FK
        uuid student_id FK
        uuid class_level_id FK
        string exam_number
        string status
        timestamps ts
    }
    marks {
        uuid id PK
        uuid examination_registration_id FK
        uuid examination_subject_id FK
        decimal paper1_marks
        decimal paper2_marks
        decimal final_marks
        string grade
        integer points
        boolean is_absent
        boolean is_disqualified
        timestamps ts
    }
    student_exam_summaries {
        uuid id PK
        uuid examination_registration_id FK
        decimal total_marks
        decimal average_marks
        decimal gpa
        integer division_points
        string division
        integer school_position
        integer district_position
        integer region_position
        timestamps ts
    }
    school_exam_summaries {
        uuid id PK
        uuid examination_id FK
        uuid school_id FK
        uuid class_level_id FK
        integer total_candidates
        integer total_passed
        decimal pass_rate
        decimal average_gpa
        integer div1_count
        integer div2_count
        integer div3_count
        integer div4_count
        integer div0_count
        integer school_position_district
        timestamps ts
    }
    subject_exam_summaries {
        uuid id PK
        uuid examination_id FK
        uuid examination_subject_id FK
        uuid school_id FK
        uuid class_level_id FK
        decimal average_marks
        decimal average_gpa
        integer total_sat
        integer total_passed
        timestamps ts
    }
    sms_logs {
        uuid id PK
        uuid student_id FK
        string recipient_phone
        text message
        string status
        string gateway_message_id
        timestamps ts
    }
    audit_logs {
        uuid id PK
        uuid user_id FK
        string event
        string auditable_type
        uuid auditable_id
        json old_values
        json new_values
        string ip_address
        timestamps ts
    }

    regions ||--o{ districts : "has"
    districts ||--o{ schools : "has"
    districts ||--o{ users : "assigned"
    schools ||--o{ users : "assigned"
    schools ||--o{ students : "enrolls"
    schools ||--o{ school_exam_summaries : "has"
    class_levels ||--o{ students : "classifies"
    academic_years ||--o{ students : "belongs"
    academic_years ||--o{ examinations : "belongs"
    examination_types ||--o{ examinations : "classifies"
    grading_systems ||--o{ examinations : "uses"
    grading_systems ||--o{ grading_system_details : "defines"
    examinations ||--o{ examination_class_levels : "covers"
    examinations ||--o{ examination_subjects : "has"
    examinations ||--o{ examination_registrations : "has"
    examinations ||--o{ school_exam_summaries : "has"
    examinations ||--o{ subject_exam_summaries : "has"
    class_levels ||--o{ examination_class_levels : "in"
    class_levels ||--o{ examination_subjects : "for"
    subjects ||--o{ examination_subjects : "tested_in"
    students ||--o{ examination_registrations : "registers"
    examination_registrations ||--o{ marks : "has"
    examination_registrations ||--|| student_exam_summaries : "has"
    examination_subjects ||--o{ marks : "recorded"
    examination_subjects ||--o{ subject_exam_summaries : "analyzed"
    students ||--o{ sms_logs : "notified"
    users ||--o{ audit_logs : "generates"
```

---

## 3. DOMAIN MODULE ARCHITECTURE

```mermaid
graph TB
    subgraph Domains["app/Domains/"]
        subgraph ID["Identity"]
            ID_M[User Model]
            ID_S[AuthService]
            ID_P[UserPolicy]
        end
        subgraph SCH["School"]
            SCH_M[Region - District - School Models]
            SCH_S[SchoolService]
            SCH_R[SchoolRepository]
        end
        subgraph STU["Student"]
            STU_M[Student Model]
            STU_S[StudentService]
            STU_J[BulkImportJob]
        end
        subgraph EXAM["Examination"]
            EXAM_M[Examination - Subject - Grading Models]
            EXAM_S[CandidateRegistrationService]
            EXAM_A[RegisterCandidateAction]
        end
        subgraph RES["Results"]
            RES_M[Mark - StudentSummary - SchoolSummary]
            RES_S[ResultsProcessingService]
            RES_J[ProcessExamResultsJob]
            RES_R[RankCalculator]
        end
        subgraph REP["Reporting"]
            REP_S[PdfReportService]
            REP_X[ExcelExportService]
            REP_J[GenerateReportJob]
        end
        subgraph NOT["Notification"]
            NOT_G[SmsGatewayInterface]
            NOT_B[BeemSmsGateway]
            NOT_S[SmsDispatcherService]
            NOT_J[SendSmsJob]
        end
        subgraph AIModule["AI"]
            AI_1[PerformanceAnalysisAgent]
            AI_2[StudentRiskAgent]
            AI_3[SchoolRecommendationAgent]
            AI_4[TrendAnalysisAgent]
            AI_5[ExecutiveSummaryAgent]
        end
        subgraph ANA["Analytics"]
            ANA_S[DistrictAnalyticsService]
            ANA_V[AnalyticsViewModel]
        end
    end
    RES_S --> EXAM_M
    RES_S --> STU_M
    RES_S --> RES_M
    REP_S --> RES_M
    REP_X --> RES_M
    NOT_S --> NOT_G
    NOT_B --> NOT_G
    NOT_J --> NOT_S
    AI_1 --> ANA_S
    AI_2 --> RES_M
    AI_3 --> SCH_M
    AI_4 --> RES_M
    AI_5 --> ANA_S
```

---

## 4. EXAMINATION LIFECYCLE STATE MACHINE

```mermaid
stateDiagram-v2
    [*] --> Draft : Create Examination
    Draft --> RegistrationOpen : Open Registration
    RegistrationOpen --> RegistrationClosed : Close Registration
    RegistrationClosed --> MarksEntryOpen : Start Marks Entry
    MarksEntryOpen --> Processing : Submit for Processing
    Processing --> Processed : Processing Complete
    Processed --> Published : Publish Results
    Published --> Closed : Close Results
    Closed --> Archived : Archive Exam
    Draft --> Archived : Archive Draft
    RegistrationOpen --> Archived : Archive Registration
    RegistrationClosed --> Archived : Archive Registration
    MarksEntryOpen --> Archived : Archive Marks Entry
    Processing --> Archived : Archive Processing
    Processed --> Archived : Archive Processed
    Published --> Archived : Archive Published
```

---

## 5. RESULTS PROCESSING ENGINE FLOW

```mermaid
flowchart TD
    A([ProcessExamResultsJob - Redis Queue]) --> B
    B[Load ExaminationRegistrations] --> C{For each Registration}
    C --> D[Load Marks for registration]
    D --> E{Subject has practical?}
    E -- Yes --> F["Final = P1 x weight + P2 x weight"]
    E -- No --> G["Final = Paper1 marks only"]
    F --> H[Lookup Grade from GradingSystemDetails]
    G --> H
    H --> I[Save Mark - grade, points, final_marks]
    I --> C
    C -- Done --> J["Best 7 subjects rule - Tanzania"]
    J --> K[Sum division points from best 7]
    K --> L{Determine Division}
    L --> L1["DIV I: 7-17 pts"]
    L --> L2["DIV II: 18-21 pts"]
    L --> L3["DIV III: 22-25 pts"]
    L --> L4["DIV IV: 26-33 pts"]
    L --> L5["DIV 0: 34+ or failed"]
    L1 & L2 & L3 & L4 & L5 --> M[Calculate GPA]
    M --> N[Save StudentExamSummary]
    N --> O[RankCalculator]
    O --> O1[school_position]
    O --> O2[district_position]
    O1 & O2 --> P[Compute SchoolExamSummary]
    P --> Q[Compute SubjectExamSummaries]
    Q --> R[Examination status = processed]
    R --> S([Results Ready to Publish])
```

---

## 6. REST API ENDPOINTS

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/user

GET    /api/v1/regions
POST   /api/v1/regions
GET    /api/v1/districts
POST   /api/v1/districts
GET    /api/v1/schools
POST   /api/v1/schools
GET    /api/v1/schools/{id}
PUT    /api/v1/schools/{id}
DELETE /api/v1/schools/{id}

GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/{id}
PUT    /api/v1/students/{id}
DELETE /api/v1/students/{id}
POST   /api/v1/students/bulk-import

GET    /api/v1/examinations
POST   /api/v1/examinations
GET    /api/v1/examinations/{id}
PUT    /api/v1/examinations/{id}
GET    /api/v1/examinations/{id}/subjects
POST   /api/v1/examinations/{id}/subjects
POST   /api/v1/examinations/{id}/open-registration
POST   /api/v1/examinations/{id}/close-registration

GET    /api/v1/examinations/{id}/registrations
POST   /api/v1/examinations/{id}/registrations
DELETE /api/v1/examinations/{id}/registrations/{regId}

GET    /api/v1/marks
POST   /api/v1/marks/bulk-save
POST   /api/v1/marks/import-excel
GET    /api/v1/marks/export-template

POST   /api/v1/examinations/{id}/process
POST   /api/v1/examinations/{id}/publish
POST   /api/v1/examinations/{id}/unpublish
GET    /api/v1/examinations/{id}/processing-status

GET    /api/v1/reports/{examId}/merit-list
GET    /api/v1/reports/{examId}/merit-list/pdf
GET    /api/v1/reports/{examId}/merit-list/excel
GET    /api/v1/reports/{examId}/student-slip/{regId}
GET    /api/v1/reports/{examId}/student-slip/{regId}/pdf
GET    /api/v1/reports/{examId}/school-summary/{schoolId}/{classLevelId}
GET    /api/v1/reports/{examId}/school-summary/{schoolId}/{classLevelId}/pdf
GET    /api/v1/reports/{examId}/district-summary/{classLevelId}
GET    /api/v1/reports/{examId}/district-summary/{classLevelId}/pdf

GET    /api/v1/analytics/{examId}/overview
GET    /api/v1/analytics/{examId}/subject-performance
POST   /api/v1/ai/performance-analysis
POST   /api/v1/ai/student-risk
POST   /api/v1/ai/school-recommendations
POST   /api/v1/ai/trend-analysis
POST   /api/v1/ai/executive-summary

POST   /api/v1/notifications/sms/dispatch
GET    /api/v1/notifications/sms/logs
```

---

## 7. SECURITY ARCHITECTURE

```mermaid
flowchart LR
    subgraph Client["Client React SPA"]
        CL1[React App]
        CL2[CSRF Token]
        CL3[Sanctum Cookie]
    end
    subgraph Gateway["Security Gateway"]
        GW1[Nginx HTTPS Only]
        GW2[CORS Policy]
        GW3[Rate Limiter 60/min]
        GW4[CSP Headers]
    end
    subgraph LaravelSec["Laravel Security"]
        L1[auth:sanctum Middleware]
        L2[Spatie Permission]
        L3[Policies and Gates]
        L4[Form Request Validation]
        L5[Audit Logger]
    end
    subgraph DB["Database"]
        D1[Eloquent ORM Parameterized]
        D2[UUID Primary Keys]
        D3[Soft Deletes]
    end
    CL1 --> GW1 --> GW2 --> GW3 --> GW4
    GW4 --> L1 --> L2 --> L3 --> L4 --> L5
    L5 --> D1 --> D2 --> D3
```

---

## 8. AI AGENTS ARCHITECTURE

```mermaid
graph TD
    REQ["POST /api/v1/ai/..."] --> ORCH[AiOrchestrationService]
    ORCH --> PA[PerformanceAnalysisAgent]
    ORCH --> SR[StudentRiskAgent]
    ORCH --> SCR[SchoolRecommendationAgent]
    ORCH --> TA[TrendAnalysisAgent]
    ORCH --> ES[ExecutiveSummaryAgent]
    PA & SR & SCR & TA & ES --> OAI[OpenAI GPT-4o]
    OAI --> CACHE[Redis Cache 24hr TTL]
    CACHE --> RESP[JSON Response]
    NOTE["READ-ONLY mode - No data modifications"]
```

---

## 9. SMS NOTIFICATION SEQUENCE

```mermaid
sequenceDiagram
    participant Admin as District Officer
    participant API as Laravel API
    participant Queue as Redis Queue
    participant Job as SendSmsJob
    participant Beem as Beem SMS Gateway
    participant Parent as Parent Phone

    Admin->>API: POST /api/v1/notifications/sms/dispatch
    API->>API: Fetch candidates with parent_phone
    API->>Queue: Dispatch SendStudentResultSmsJob
    API-->>Admin: 202 Accepted - queued N messages
    Queue->>Job: Process job
    Job->>Job: Build Swahili SMS message
    Job->>Beem: POST send-sms
    Beem-->>Job: success + messageId
    Job->>Job: Save SmsLog to database
    Beem->>Parent: SMS Delivered
```

---

## 10. DEVOPS AND CI/CD PIPELINE

```mermaid
graph LR
    subgraph DEV["Development"]
        D1["git push origin feature/branch"]
    end
    subgraph CI["GitHub Actions CI"]
        CI1[PHP Unit Tests Pest]
        CI2[PHPStan Analysis]
        CI3[ESLint TypeScript]
        CI4[npm run build]
    end
    subgraph CD["GitHub Actions CD"]
        CD1[Build Docker Image]
        CD2["Push to ghcr.io/org/derms"]
        CD3[Blue-Green Switch via Nginx]
    end
    subgraph PROD["Production"]
        P1[Blue Server - Live]
        P2[Green Server - Deploy]
        LB[Nginx Load Balancer]
        REDIS[Redis 7.x]
        DB[(Postgre)]
    end
    D1 --> CI1 --> CI2 --> CI3 --> CI4
    CI4 --> CD1 --> CD2 --> CD3
    CD3 --> P2 --> LB --> P1
    P1 & P2 --> REDIS
    P1 & P2 --> DB
```

---

## 11. IMPLEMENTATION ROADMAP

```mermaid
gantt
    title DERMS Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 Core Setup
    Folder Structure and Migrations      :done, p1a, 2026-06-01, 3d
    DomainServiceProvider and Routing    :done, p1b, after p1a, 2d
    Redux and Tailwind Frontend Setup    :done, p1c, after p1b, 2d
    section Phase 2 Admin Modules
    Identity Domain Auth and Roles       :done, p2a, after p1c, 3d
    School Domain CRUD                   :done, p2b, after p2a, 2d
    Student Domain Bulk Import           :done, p2c, after p2b, 3d
    section Phase 3 Examinations
    Exam Models and Migrations           :done, p3a, after p2c, 3d
    Grading System Configurator          :done, p3b, after p3a, 2d
    Candidate Registration Flow          :done, p3c, after p3b, 2d
    section Phase 4 Marks Entry
    Spreadsheet Marks Grid React         :done, p4a, after p3c, 3d
    Excel Import and Export              :done, p4b, after p4a, 2d
    Server-side Validation               :done, p4c, after p4b, 2d
    section Phase 5 Results Engine
    ResultsProcessingService             :done, p5a, after p4c, 3d
    RankCalculator                       :done, p5b, after p5a, 2d
    Redis Queue Worker Jobs              :done, p5c, after p5b, 2d
    section Phase 6 Reporting and SMS
    PDF Reports DomPDF                   :active, p6a, after p5c, 3d
    Excel Reports Maatwebsite            :p6b, after p6a, 2d
    SMS Dispatcher Beem Africa           :p6c, after p6b, 2d
    section Phase 7 AI and DevOps
    AI Agents OpenAI GPT-4o              :p7a, after p6c, 4d
    Analytics Dashboard React            :p7b, after p7a, 3d
    Docker and GitHub Actions CI-CD      :p7c, after p7b, 3d
```

---

## 12. USER ROLES AND PERMISSIONS

| Permission              | Super Admin | District Officer | School Admin | Teacher |
|-------------------------|-------------|------------------|--------------|---------|
| Manage Users            | YES         | NO               | NO           | NO      |
| Manage Schools          | YES         | YES              | NO           | NO      |
| Create Examination      | YES         | YES              | NO           | NO      |
| Register Candidates     | YES         | YES              | YES          | NO      |
| Enter Marks             | YES         | YES              | YES          | YES     |
| Process Results         | YES         | YES              | NO           | NO      |
| Publish Results         | YES         | YES              | NO           | NO      |
| View Merit List         | YES         | YES              | YES          | YES     |
| Download PDF Reports    | YES         | YES              | YES          | YES     |
| Send SMS Notifications  | YES         | YES              | NO           | NO      |
| View AI Insights        | YES         | YES              | YES          | NO      |
| System Settings         | YES         | NO               | NO           | NO      |
| View Audit Logs         | YES         | YES              | NO           | NO      |

---

## 13. KEY ARCHITECTURAL DECISIONS

| Decision                | Choice                    | Reason                                        |
|-------------------------|---------------------------|-----------------------------------------------|
| Architecture Pattern    | Modular Monolith          | Balance between simplicity and modularity     |
| Database Development    | PostgreSQL 17             | Matches current workspace and local stack     |
| Database Production     | PostgreSQL 17             | Same engine for dev and production            |
| Authentication          | Laravel Sanctum           | SPA and API token support                     |
| Authorization           | Spatie Permission         | Role and Permission granularity               |
| Queue Driver            | Redis                     | Reliable fast supports batching               |
| PDF Generation          | barryvdh/laravel-dompdf   | Laravel native uses Blade templates           |
| Excel Export            | maatwebsite/excel         | Laravel native supports streaming             |
| SMS Gateway             | Beem Africa               | Tanzania-local SMS provider                   |
| AI Provider             | OpenAI GPT-4o             | Best reasoning for education analytics        |
| Primary Keys            | UUID                      | Security no sequential ID enumeration         |
| Soft Deletes            | All tables                | Audit compliance and data recovery            |
| Frontend State          | Redux Toolkit + RTK Query | Predictable state DevTools built-in caching   |
| UI Components           | ShadCN UI + Tailwind v4   | Accessible customizable modern look           |
| Data Tables             | TanStack Table            | Virtual scrolling for 100k row datasets       |

---

*File: ARCHITECTURE.md | Location: C:\xampp\htdocs\DERMS\ARCHITECTURE.md*
*Last Updated: June 2026 | Status: Current*
