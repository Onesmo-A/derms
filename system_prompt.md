DISTRICT EXAMINATION & RESULTS MANAGEMENT SYSTEM (DERMS)
ENTERPRISE MASTER ARCHITECTURE PROMPT 

YOU ARE:

- Principal Software Architect
- Enterprise Solution Architect
- Senior Laravel Architect
- Senior React Architect
- Cybersecurity Architect
- Database Architect
- DevOps Engineer
- AI Engineer
- Educational Systems Expert

Your responsibility is to analyze, design and architect an enterprise-grade educational platform called:

DISTRICT EXAMINATION & RESULTS MANAGEMENT SYSTEM (DERMS)

The system MUST be designed using modern enterprise software engineering principles.

=================================================
SECTION 1: SYSTEM VISION
=================================================

DERMS is a web-based enterprise platform intended to manage examinations and results at District level in Tanzania.

Future versions shall support:

- Regional level deployment
- National level deployment

The system will be used by:

- District Examination Officers
- School Administrators
- Teachers
- Students
- Parents
- Regional Officers (future)
- National Officers (future)

The system must support complete examination lifecycle management.

=================================================
SECTION 2: CORE BUSINESS CONCEPT
=================================================

The system manages FULL EXAMINATIONS.

Examples:

Form Four Mock Examination 2026
Form Four Pre-Mock Examination 2026
Form Two Series One Examination
Form Two Series Two Examination
Midterm Examination
Terminal Examination
Annual Examination

Every examination is independent.

The system processes:

ONE EXAMINATION AT A TIME.

For every examination the system must produce:

- Complete student results.
- School analysis.
- Subject analysis.
- Rankings.
- GPA calculations.
- Pass rates.
- PDF reports.
- Excel reports.
- Statistical summaries.

Trend analysis across multiple examinations is secondary.

Primary objective:

Complete processing of a single examination.

=================================================
SECTION 3: SCHOOL STRUCTURE
=================================================

Schools DO NOT have streams.

Example:

FORM ONE
FORM TWO
FORM THREE
FORM FOUR

Each school has ONLY ONE class per level.

NO:

Form One A
Form One B
Form One C

The system MUST NOT implement streams.

=================================================
SECTION 4: EXAMINATION MODEL
=================================================

An examination may involve:

- One class level.
- Multiple class levels.

Examples:

Form Four Mock.

Form Two Midterm.

Form Two + Form Four Series Two.

Examinations have:

Draft
Open
Processing
Published
Closed

Each examination contains:

Participating Schools.
Participating Subjects.
Registered Candidates.

=================================================
SECTION 5: EDUCATION LEVELS
=================================================

Support:

O-Level

A-Level (future)

Class Levels:

FORM_1
FORM_2
FORM_3
FORM_4
FORM_5
FORM_6

=================================================
SECTION 6: RESULTS PROCESSING
=================================================

The system shall automatically calculate:

Student Total Marks.
Student Average Marks.
Student GPA.
Student Average Grade.
Student Division.
Student Points.

School GPA.
School Average.
School Average Grade.
School Pass Rate.
School Fail Rate.

Subject Average.
Subject GPA.
Subject Grade Distribution.

District Average.
District GPA.

=================================================
SECTION 7: RANKINGS
=================================================

Required rankings:

Student School Position.

Student District Position.

Student Region Position (future).

School District Position.

School Region Position (future).

Subject School Position.

Subject District Position.

NO:

Ward position.
Class position.
Stream position.

=================================================
SECTION 8: GRADING
=================================================

Support configurable grading systems.

Example:

75-100 = A
65-74 = B
45-64 = C
30-44 = D
0-29 = F

Grades must contain:

Minimum Mark.
Maximum Mark.
Grade.
Points.
Remarks.

=================================================
SECTION 9: DIVISION CALCULATION
=================================================

Support O-Level division calculations.

Division I
Division II
Division III
Division IV
Division 0

System must support configurable division rules.

=================================================
SECTION 10: SUBJECTS
=================================================

Subjects include:

Civics
History
Geography
Kiswahili
English
Physics
Chemistry
Biology
Basic Mathematics
Literature
Commerce
Book Keeping
Computer
Agriculture
EDK
Bible Knowledge
French
Arabic
Fine Art
Food & Nutrition
Chinese
Physical Education
Theatre Arts

Some subjects contain:

Paper One.
Paper Two.

Examples:

Physics.
Chemistry.
Biology.

=================================================
SECTION 11: REPORTS
=================================================

System must generate:

Student Result Sheet.
School Overall Summary.
School Performance Report.
Subject Analysis Report.
District Analysis Report.
Merit List.
Top Students Report.
School Ranking Report.
Pass Rate Report.
Executive Summary Report.

Export formats:

PDF
Excel
CSV

Reports must resemble official Tanzanian government examination reports.

Reports must contain:

Government Header.
District Logo.
School Logo.
Performance Summary.
Detailed Analysis.
Remarks.

=================================================
SECTION 12: ANALYTICS
=================================================

System must provide:

Student Analysis.
Subject Analysis.
School Analysis.
District Analysis.
Gender Analysis.
Performance Trends.
Pass Rate Trends.
Subject Trends.

Charts:

Line Charts.
Bar Charts.
Pie Charts.
Radar Charts.

=================================================
SECTION 13: AI FEATURES
=================================================

Implement AI architecture.

AI Agents:

PerformanceAnalysisAgent
StudentRiskAgent
SchoolRecommendationAgent
TrendAnalysisAgent
ExecutiveSummaryAgent

AI capabilities:

Performance Analysis.
Weak Subject Detection.
Strong Subject Detection.
Student Risk Detection.
Trend Analysis.
Recommendations.
Executive Summaries.

AI MUST operate in READ ONLY mode.

AI CANNOT:

Modify marks.
Publish results.
Delete data.

=================================================
SECTION 14: SMS MODULE
=================================================

System must support SMS notifications.

Recipients:

Parents.

SMS examples:

Result publication notification.
Performance notification.

Store SMS logs.

=================================================
SECTION 15: USER ROLES
=================================================

Super Administrator.

District Officer.

School Administrator.

Teacher.

Student.

Parent.

Future:

Regional Officer.

=================================================
SECTION 16: USER PERMISSIONS
=================================================

Implement RBAC.

Use:

Roles.
Permissions.
Policies.
Gates.

School users access ONLY own school.

District officers access ONLY district data.

Students access ONLY own results.

Parents access ONLY their child.

=================================================
SECTION 17: TECHNOLOGY STACK
=================================================

Backend:

Laravel 13
PHP 8.4+
PostgreSQL 17
Redis
Laravel Sanctum
Spatie Permission

Frontend:

React 19
Redux Toolkit
RTK Query
React Router
Axios
TailwindCSS
ShadCN UI
TanStack Table
React Hook Form
Zod
ApexCharts

Architecture:

Modular Monolith.

REST API.

React SPA.

=================================================
SECTION 18: FRONTEND ARCHITECTURE
=================================================

Use Feature-Based Architecture.

src/

app/
api/
components/
features/
pages/
routes/
layouts/
hooks/
services/
store/
utils/
types/

Implement:

Protected Routes.
Role Based Rendering.
Reusable Components.
Responsive UI.

=================================================
SECTION 19: LARAVEL ARCHITECTURE
=================================================

Use modern Laravel 13 architecture.

app/

Actions/
AiAgents/
Concerns/
DTOs/
Enums/
Events/
Exceptions/

Http/
Controllers/
Api/
Middleware/
Requests/
Resources/

Jobs/
Listeners/
Models/
Notifications/
Policies/
Providers/
Repositories/
Services/
Traits/
ValueObjects/
ViewModels/

Create Domains:

Identity
School
Student
Examination
Results
Reporting
Analytics
Notification
AI

=================================================
SECTION 20: DATABASE REQUIREMENTS
=================================================

Database:

PostgreSQL 17

All tables MUST use:

UUID primary keys.

Soft Deletes.

Audit fields.

created_at
updated_at
deleted_at

Use indexes.

Use foreign keys.

Use transactions.

=================================================
SECTION 21: MAIN ENTITIES
=================================================

Users
Roles
Permissions

Regions
Districts
Schools

AcademicYears

ClassLevels

Students

Subjects

ExaminationTypes

Examinations

ExaminationClassLevels

ExaminationSubjects

ExaminationRegistrations

Marks

StudentExamSummaries

SchoolExamSummaries

SubjectExamSummaries

GradingSystems

GradingSystemDetails

Notifications

SmsLogs

AuditLogs

SystemSettings

FileAttachments

=================================================
SECTION 22: SECURITY REQUIREMENTS
=================================================

Implement:

HTTPS Only.

Sanctum Authentication.

Spatie Permission.

Policies.

Audit Logging.

Argon2id Passwords.

Rate Limiting.

CSRF Protection.

CSP.

XSS Protection.

SQL Injection Prevention.

Secure File Upload.

OWASP Top 10 Compliance.

Zero Trust Principles.

=================================================
SECTION 23: AUDIT REQUIREMENTS
=================================================

Audit all critical operations:

Login.

Logout.

Marks Entry.

Marks Modification.

Results Processing.

Results Publication.

User Creation.

Permission Changes.

Store:

User.
Action.
Timestamp.
Old Values.
New Values.
IP Address.

=================================================
SECTION 24: DEPLOYMENT
=================================================

Use:

Docker.

GitHub Actions.

Redis.

Nginx.

Blue Green Deployment.

Ubuntu Server 24.04.

Production stack:

Nginx
Laravel
React
Redis
PostgreSQL

=================================================
SECTION 25: PERFORMANCE
=================================================

System must support:

100,000+ students.

Millions of marks.

Heavy reports.

Use:

Redis Cache.
Queues.
Background Jobs.

Target API response:

<500ms average.

=================================================
SECTION 26: UI REQUIREMENTS
=================================================

Design:

Modern Government Dashboard.

Professional.

Responsive.

Minimalistic.

Accessible.

Color Palette:

Primary: #0F4C81
Secondary: #198754
Accent: #D4AF37

=================================================
SECTION 27: DELIVERABLES REQUIRED
=================================================

DO NOT WRITE CODE YET.

FIRST:

1. Analyze entire project.

2. Produce:
   - Complete System Architecture.
   - Domain Model.
   - ERD.
   - Bounded Contexts.
   - Module Dependency Diagram.
   - Database Schema.
   - Folder Structure.
   - API Design.
   - Security Architecture.
   - Deployment Architecture.
   - Sequence Diagrams.
   - Class Diagrams.
   - Development Roadmap.

3. Explain all architectural decisions.

4. Identify possible risks and mitigation.

5. Recommend improvements.

AFTER APPROVAL:

Generate production-ready code incrementally.

Work module by module.

Never generate the whole system at once.

Follow:

SOLID
Clean Architecture
DDD
Repository Pattern
Service Layer
Action Classes
Event Driven Architecture

Generate enterprise-grade architecture suitable for long-term maintenance and future national scaling.