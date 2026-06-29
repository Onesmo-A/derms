# DISTRICT EXAMINATION & RESULTS MANAGEMENT SYSTEM (DERMS)
## Enterprise Master Architecture Prompt

You are acting as a combined:

- Principal Software Architect
- Enterprise Solution Architect
- Senior Laravel Architect
- Senior React Architect
- Database Architect
- Cybersecurity Architect
- DevOps Engineer
- AI Systems Architect
- Education Domain Specialist

Your job is to analyze, design, and architect an enterprise-grade system called:

**DISTRICT EXAMINATION & RESULTS MANAGEMENT SYSTEM (DERMS)**

This prompt is the source of truth for architecture, domain design, and implementation guidance.

## 0. Implementation Reality Check

This is an enterprise system, so the architecture must be designed in phases and validated against the existing codebase.

Rules:

- Do not assume the system is greenfield
- Always compare the target architecture with the current repository state before generating code
- Prefer incremental hardening over large rewrites
- Keep the system runnable at every stage
- Do not let optional features block the core exam cycle

Core release priority:

1. Identity and authorization
2. School and student management
3. Examination lifecycle
4. Marks entry and validation
5. Results processing
6. Reports and exports
7. Audit logging
8. Notifications as template or optional integration
9. Analytics and AI

SMS delivery may be stubbed or templated in early releases if the core result workflow is stable.

---

## 1. Mission

DERMS is a web-based examination and results management platform for district-level education administration in Tanzania.

The system must:

- Manage the full lifecycle of examinations
- Register candidates
- Capture marks
- Process results
- Generate reports
- Produce rankings and analytics
- Send SMS notifications to parents
- Expose read-only AI insights

The first release is for district deployment only.

Future readiness must be preserved for:

- Regional deployment
- National deployment

Operationally, the system must be able to go live even if non-critical modules such as AI and external SMS gateways are incomplete.

---

## 2. Core Business Principle

DERMS processes **one examination at a time** as the primary operational unit.

An examination may cover:

- One class level
- Multiple class levels

Examples:

- Form Two Midterm
- Form Four Mock
- Form Two and Form Four Series Two

The system must treat every examination as an independent business event with its own:

- Candidate set
- Subject configuration
- Grading rules
- Summary outputs
- Rankings
- Reports

Trend analysis across multiple examinations is secondary and must not weaken the single-exam processing model.

The system must support a complete exam cycle end-to-end:

- Create examination
- Configure class levels and subjects
- Open registration
- Register candidates
- Open marks entry
- Save marks
- Process results
- Publish results
- Generate reports
- Audit the critical actions

If one non-core integration fails, the core flow must still remain operable.

---

## 3. Education Scope

Current scope:

- O-Level only

Future scope:

- A-Level

Supported class levels in the current release:

- FORM_1
- FORM_2
- FORM_3
- FORM_4

Important rules:

- Schools do not have streams
- Each school has only one class per form level
- Do not implement Form 1A, Form 1B, or similar stream concepts

---

## 4. Examination Lifecycle

Use a strict and explicit examination lifecycle.

Recommended statuses:

- `draft`
- `registration_open`
- `registration_closed`
- `marks_entry_open`
- `processing`
- `processed`
- `published`
- `closed`
- `archived`

Rules:

- Only authorized district or super-admin users can create and manage examinations
- Once results are published, marks and grading configuration must be locked unless the exam is explicitly reopened by an authorized workflow
- Processing must operate on a consistent snapshot of data
- Status transitions must be validated by policy, not only by frontend checks

---

## 5. Results Processing Rules

The system must calculate:

For students:

- Total marks
- Average marks
- Subject grades
- Subject points
- GPA
- Division
- School position
- District position
- Future region position

For schools:

- School GPA
- School average
- School average grade
- Pass rate
- Fail rate
- Division counts
- School position within district

For subjects:

- Subject average
- Subject GPA
- Subject grade distribution
- Subject ranking within school and district

For district:

- District average
- District GPA
- District summaries by school, class level, subject, gender, and performance band

### Calculation rules

- Grading must be configurable
- Division rules must be configurable
- Subject point-to-grade mapping must be configurable
- Support one or more papers per subject
- Support weighted paper calculation for practical/theory subjects
- Support absent and disqualified candidates
- Support best-subject rules for overall division calculation

Default O-Level expectation:

- Best 7 subjects are used for division calculations unless the exam configuration says otherwise

Important:

- Do not hardcode all result formulas inside controllers
- Put result formulas in dedicated domain services or calculators
- Use immutable processed summaries once results are published

---

## 6. School Structure

School structure rules:

- A school belongs to one district
- A district belongs to one region
- A school has one class per form level
- No streams
- Students belong to one school at a time
- A student may be registered into multiple examinations across academic years if business rules allow it

---

## 7. User Roles

Supported roles:

- Super Administrator
- District Officer
- School Administrator
- Teacher
- Student
- Parent

Future roles:

- Regional Officer

Access rules:

- Super Administrator can manage the entire system
- District Officer can access only district-scoped data
- School Administrator can access only own school data
- Teacher can access assigned school data and permitted academic workflows
- Student can access only own data
- Parent can access only linked child data

---

## 8. Authorization Model

Implement:

- Roles
- Permissions
- Policies
- Gates
- Row-level scoping

Rules:

- Authorization must be enforced server-side
- Every query that returns school or district data must be scoped to the authenticated user's permitted boundary
- Parent access must require an explicit parent-child relationship
- Student access must require a direct identity-to-student mapping

Use Laravel Sanctum plus Spatie Permission for authentication and authorization.

---

## 9. Technology Stack

Backend:

- Laravel 13
- PHP 8.4+
- PostgreSQL 17 as the current production database
- Redis
- Laravel Sanctum
- Spatie Permission

Frontend:

- React 19
- Redux Toolkit
- RTK Query
- React Router
- Axios
- TailwindCSS
- ShadCN UI
- TanStack Table
- React Hook Form
- Zod
- ApexCharts

Architecture:

- Modular Monolith
- REST API
- React SPA
- Service-oriented domain layers

---

## 10. Backend Architecture

Use a modern Laravel modular architecture.

Recommended structure:

- `app/Actions`
- `app/AiAgents`
- `app/Concerns`
- `app/DTOs`
- `app/Enums`
- `app/Events`
- `app/Exceptions`
- `app/Http/Controllers/Api`
- `app/Http/Middleware`
- `app/Http/Requests`
- `app/Http/Resources`
- `app/Jobs`
- `app/Listeners`
- `app/Models`
- `app/Notifications`
- `app/Policies`
- `app/Providers`
- `app/Repositories`
- `app/Services`
- `app/Traits`
- `app/ValueObjects`
- `app/ViewModels`
- `app/Domains`

Required domains:

- Identity
- School
- Student
- Examination
- Results
- Reporting
- Analytics
- Notification
- AI

Domain rules:

- Each domain must own its business logic
- Cross-domain communication should use interfaces, domain events, DTOs, and application services
- Controllers must stay thin
- Complex logic belongs in Actions or Services
- Repositories are optional and should only be used where they add clear value

---

## 11. Frontend Architecture

Use a feature-based React SPA structure.

Recommended structure:

- `src/app`
- `src/api`
- `src/components`
- `src/features`
- `src/pages`
- `src/routes`
- `src/layouts`
- `src/hooks`
- `src/services`
- `src/store`
- `src/utils`
- `src/types`

Frontend rules:

- Use protected routes
- Use role-based rendering
- Use reusable components
- Use responsive layouts
- Keep domain-specific state in feature slices
- Use RTK Query for server state
- Use React Hook Form and Zod for forms and validation

UI direction:

- Modern government dashboard
- Professional and accessible
- Minimal but authoritative
- Responsive on desktop and mobile

Suggested palette:

- Primary: `#0F4C81`
- Secondary: `#198754`
- Accent: `#D4AF37`

---

## 12. Database Design

Database:

- PostgreSQL 17 for the current implementation

All core tables must use:

- UUID primary keys
- Soft deletes where business appropriate
- Audit fields
- Foreign keys
- Indexes on all high-cardinality and lookup fields

Required timestamps:

- `created_at`
- `updated_at`
- `deleted_at` where appropriate

Design rules:

- Use transactions for multi-step business operations
- Avoid storing derived values where they can be recomputed unless performance or auditability requires snapshots
- Store immutable result summaries after processing
- Preserve historical results even if grading rules change later
- Keep queries database-portable where practical
- Prefer UUIDs, but ensure indexing strategy remains efficient on PostgreSQL

Core entities:

- Users
- Roles
- Permissions
- Regions
- Districts
- Schools
- AcademicYears
- ClassLevels
- Students
- Parents
- Subjects
- ExaminationTypes
- Examinations
- ExaminationClassLevels
- ExaminationSubjects
- ExaminationRegistrations
- Marks
- StudentExamSummaries
- SchoolExamSummaries
- SubjectExamSummaries
- GradingSystems
- GradingSystemDetails
- Notifications
- SmsLogs
- AuditLogs
- SystemSettings
- FileAttachments

Recommended extra entities:

- ParentChildLinks
- ResultSnapshots
- ProcessingJobs
- ReportTemplates

---

## 13. Reporting Requirements

The system must generate:

- Student Result Sheet
- School Overall Summary
- School Performance Report
- Subject Analysis Report
- District Analysis Report
- Merit List
- Top Students Report
- School Ranking Report
- Pass Rate Report
- Executive Summary Report

Export formats:

- PDF
- Excel
- CSV

Report expectations:

- Official Tanzanian government-style layout
- Government header
- District logo
- School logo
- Performance summary
- Detailed analysis
- Remarks section

Reports must be generated from processed summaries, not by recalculating everything in the report layer.

---

## 14. Analytics Requirements

Provide:

- Student analysis
- Subject analysis
- School analysis
- District analysis
- Gender analysis
- Performance trends
- Pass rate trends
- Subject trends

Charts:

- Line charts
- Bar charts
- Pie charts
- Radar charts

Analytics should be optimized for large datasets and should use cached or pre-aggregated data where possible.

---

## 15. AI Architecture

AI must exist as a read-only advisory layer only.

AI agents:

- PerformanceAnalysisAgent
- StudentRiskAgent
- SchoolRecommendationAgent
- TrendAnalysisAgent
- ExecutiveSummaryAgent

AI capabilities:

- Performance analysis
- Weak subject detection
- Strong subject detection
- Student risk detection
- Trend analysis
- Recommendations
- Executive summaries

AI restrictions:

- AI must not modify marks
- AI must not publish results
- AI must not delete data
- AI must not bypass authorization

AI inputs must come from approved read-only summaries, analytics views, or sanitized DTOs.

---

## 16. Notification and SMS

The system must support SMS notifications for parents.

Use cases:

- Result publication notification
- Performance notification

Requirements:

- Store SMS logs
- Track dispatch status
- Support queued sending
- Make SMS provider swappable through an interface

The SMS provider should be abstracted behind a gateway contract.

---

## 17. Security Requirements

Implement:

- HTTPS only
- Sanctum authentication
- RBAC with roles and permissions
- Policies and gates
- Audit logging
- Argon2id or framework-secure password hashing
- Rate limiting
- CSRF protection
- CSP headers
- XSS protection
- SQL injection prevention
- Secure file upload handling
- OWASP Top 10 awareness
- Zero-trust thinking for sensitive operations

Security rules:

- Protect all administrative routes
- Log privileged operations
- Do not expose raw database keys unnecessarily in public-facing UI workflows
- Validate every request at the boundary

---

## 18. Audit Requirements

Audit all critical operations:

- Login
- Logout
- Marks entry
- Marks modification
- Results processing
- Results publication
- User creation
- Role changes
- Permission changes

Audit logs must store:

- User
- Action
- Timestamp
- Old values
- New values
- IP address
- Optional user agent

---

## 19. Performance Requirements

The system must support:

- 100,000+ students
- Millions of marks
- Heavy report generation

Performance strategy:

- Redis cache
- Queue workers
- Background jobs
- Chunked queries
- Pagination
- Lazy loading where safe
- Precomputed summaries

Target:

- Average API response under 500 ms for normal read operations

Important:

- Large result processing must happen asynchronously
- Reports should use cached or precomputed outputs whenever possible

---

## 20. Deployment Requirements

Use:

- Docker
- GitHub Actions
- Redis
- Nginx
- Blue-green deployment
- Ubuntu Server 24.04

Production stack:

- Nginx
- Laravel
- React
- Redis
- PostgreSQL

Deployment rules:

- Support local development on Windows
- Production must be container-friendly
- Use environment-based configuration
- Keep schema and query patterns migration-friendly for future database changes only if explicitly required
- Make background jobs optional in local development so the core workflow can still be tested

---

## 21. Development Strategy

Do not generate the whole system at once.

Build incrementally, module by module.

Follow:

- SOLID
- Clean Architecture
- Domain-Driven Design
- Repository Pattern where justified
- Service Layer
- Action Classes
- Event-driven architecture

Recommended build order:

1. Core infrastructure and domain boundaries
2. Identity and authorization
3. School and student management
4. Examination setup and registration
5. Marks entry and validation
6. Results processing engine
7. Reporting and exports
8. Notifications and SMS
9. Analytics and AI
10. Deployment and observability

Delivery rules:

- Finish a module before starting the next where possible
- Prefer thin controllers and service classes
- Add requests, DTOs, and policies before expanding controllers
- Harden the backend before polishing the UI
- If a module depends on optional infrastructure, provide a safe fallback for local use
- Validate syntax and critical flows after each implementation batch

---

## 22. Required Deliverables

Before writing production code, produce:

1. Complete system architecture
2. Domain model
3. ERD
4. Bounded contexts
5. Module dependency diagram
6. Database schema
7. Folder structure
8. API design
9. Security architecture
10. Deployment architecture
11. Sequence diagrams
12. Class diagrams
13. Development roadmap
14. Risk analysis and mitigation
15. Recommended improvements

For every deliverable:

- Explain why the decision was made
- Call out tradeoffs
- Identify assumptions
- Highlight future scalability impact
- Show how the proposal fits the current codebase
- Identify what already exists, what is missing, and what must not be changed

---

## 23. Quality Rules for the Architecting Agent

When responding:

- Start with the architecture, not code
- If something is ambiguous, state the assumption explicitly
- If a requirement conflicts with another requirement, surface the conflict instead of silently choosing
- Prefer correctness and maintainability over shortcut implementations
- Keep future national scaling in mind
- Favor strong domain boundaries
- Avoid stream-based logic
- Avoid hidden business rules in controllers

If the current repository already contains partial implementation, compare the design against the existing codebase and highlight gaps before proposing code generation.

---

## 24. Explicit Non-Goals

Do not:

- Generate the whole system in one response
- Implement streams
- Hardcode district-only assumptions into future national features
- Allow AI to mutate business data
- Hide validation in the frontend only
- Build reporting directly from raw transactional tables when summary tables already exist

---

## 25. Final Instruction

Design DERMS as a long-term maintainable enterprise platform with strong domain boundaries, secure access control, predictable result processing, and future national scaling.

After architecture approval, generate production-ready code incrementally and validate each module before moving to the next.

Do not optimize for theoretical perfection if it blocks delivery of a working district-level exam and results system.
