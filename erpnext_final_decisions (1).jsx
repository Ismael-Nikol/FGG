import { useState } from "react";

const VERDICT = {
  OOB:        { label: "OOB",                icon: "✅", color: "#166534", bg: "#dcfce7", border: "#86efac", desc: "Out-of-the-Box" },
  WORKAROUND: { label: "Workaround",         icon: "⚙️", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", desc: "Config / Workaround" },
  CUSTOM:     { label: "Custom Dev",         icon: "🔧", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", desc: "Requires Development" },
  CLARIFY:    { label: "Needs Clarification",icon: "❓", color: "#1e40af", bg: "#dbeafe", border: "#93c5fd", desc: "Pending Client Input" },
};
const EFFORT = {
  Low:    { color: "#166534", bg: "#dcfce7" },
  Medium: { color: "#92400e", bg: "#fef3c7" },
  High:   { color: "#991b1b", bg: "#fee2e2" },
  TBD:    { color: "#475569", bg: "#f1f5f9" },
};

const screen1 = [
  {
    module: "1. Business Development (CRM)",
    items: [
      { id:"BD-01", process:"Lead to Opportunity", verdict:"CLARIFY", effort:"Low",
        erpnextDocs:["CRM → Lead","CRM → Opportunity"],
        decision:"ERPNext v15 CRM supports Lead → Opportunity → Quotation natively. However, FG has not defined what qualifies as a Lead vs an Opportunity in their construction context. Mapping is on hold until qualification criteria, required fields, and responsible users are confirmed.",
        implementation:[],customization:[],
        openItems:["Define Lead vs Opportunity in construction context (bid invitation? RFQ?)","Identify required custom fields (Project Type, Location, Client Agency, Bid Deadline)","Confirm who creates and owns Leads — BD Team or Project Head?"] },
      { id:"BD-02", process:"Bid Awarded → Notify Department Heads & Project Head", verdict:"OOB", effort:"Low",
        erpnextDocs:["CRM → Opportunity (status: Won)","Project → Project (auto-create)","Settings → Notification"],
        decision:"When an Opportunity is marked as Won, ERPNext's Notification module triggers an automated email to all defined recipients. A Project record is auto-created from the Opportunity. Fully OOB via Email Alert configuration.",
        implementation:["Configure Email Alert: trigger on Opportunity status = Won","Recipients: All Department Heads (by role) + Assigned Project Head (by user)","Project auto-created from Opportunity using OOB 'Create Project' button or Workflow action"],
        customization:[],openItems:["Confirm list of Department Heads to notify — role-based or specific users?"] },
      { id:"BD-03", process:"Bid Awarded → Create Project Memo", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Project → Project (parent link)"],
        decision:"ERPNext has no native Memo DocType. A custom DocType 'Project Memo' is required, linked to the Project record, with a defined approval workflow and print format for distribution.",
        implementation:["Custom DocType: 'Project Memo' linked to Project","Fields: Project Name, Client, Scope Summary, Assigned Project Head, Date Awarded, Attachments","Workflow: Draft → Submitted → Distributed","Print Format for formal Memo distribution"],
        customization:["Custom DocType: Project Memo","Custom Print Format","Workflow: 3-step approval"],
        openItems:["Define Memo content — what constitutes 'surface level' project details?","Does the Memo require formal approval signatures before distribution?","Who drafts the Memo — Office Engineer or Project Head?"] },
    ],
  },
  {
    module: "2. Request Materials",
    items: [
      { id:"RM-01", process:"Material Request → PO → Purchase Receipt (Main Warehouse)", verdict:"OOB", effort:"Low",
        erpnextDocs:["Stock → Material Request","Buying → Purchase Order","Stock → Purchase Receipt"],
        decision:"Standard procurement chain is fully supported OOB in ERPNext v15. Material Requests link to the Project for cost tracking. PO and PR inherit the project linkage automatically.",
        implementation:["Enable Project field on Material Request","Set approval workflow on Material Request per project role","Configure warehouse: Main Warehouse as top-level node in warehouse tree","Link Material Request → PO → PR with Project and Cost Center"],
        customization:[],openItems:["Confirm warehouse tree structure — how many Sub-Warehouses / project sites?","Is Materials Manager approval required before PO issuance?"] },
      { id:"RM-02", process:"Sub-Warehouse Withdraw from Main Warehouse", verdict:"OOB", effort:"Low",
        erpnextDocs:["Stock → Stock Entry (Material Transfer)"],
        decision:"Inter-warehouse transfers are handled natively via Stock Entry 'Material Transfer'. No customization needed. Warehouse hierarchy must be properly configured.",
        implementation:["Define warehouse hierarchy: Main Warehouse > Sub-Warehouse [per project site]","Set warehouse-level permissions per user role","Stock Entry: Material Transfer from Main WH → Sub WH"],
        customization:[],openItems:[] },
      { id:"RM-03", process:"Defect: Supplier → Main Warehouse", verdict:"OOB", effort:"Low",
        erpnextDocs:["Stock → Purchase Receipt","Stock → Quality Inspection","Stock → Purchase Return","Buying → Debit Note"],
        decision:"Quality Inspection on Purchase Receipt is OOB. When QI fails, a Purchase Return and Debit Note are created. Email Alert notifies Purchasing team to communicate with Supplier or Logistics.",
        implementation:["Enable Quality Inspection on Purchase Receipt in Stock Settings","Email Alert: QI status = Rejected → notify Purchasing team role","Purchasing team creates Purchase Return and Debit Note via OOB flow","Communication log on PO to document all supplier exchanges"],
        customization:[],openItems:["Does FG require a formal Defect Report document? Provide sample.","Is Logistics an internal department or third-party? How are they notified?"] },
      { id:"RM-04", process:"Defect: Main Warehouse → Sub-Warehouse", verdict:"WORKAROUND", effort:"Medium",
        erpnextDocs:["Stock → Stock Entry (Material Transfer)","Settings → Workflow","Settings → Notification"],
        decision:"Quality Inspection in ERPNext is designed for PO/SO, not inter-warehouse transfers. A Workflow state 'Defect Reported' is added to Stock Entry. When triggered by Sub-Warehouse, it notifies Main Warehouse supervisor and Logistics via Email Alert.",
        implementation:["Add custom field 'Defect Remarks' on Stock Entry","Workflow state: Draft → In Transit → Received → Defect Reported → Resolved","Email Alert: Stock Entry status = Defect Reported → notify Main WH supervisor + Logistics","Reverse Stock Entry for defective items return"],
        customization:["Custom Workflow state on Stock Entry","Custom field: Defect Remarks","Email Alert configuration"],
        openItems:["Does FG require a running Defect Log report per warehouse per month?","Who is the Main Warehouse supervisor to receive defect notifications?"] },
      { id:"RM-05", process:"Defect: Sub-Warehouse → Project Site (incl. Subcon Withdrawer)", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Stock → Stock Entry (Material Issue)","Project → Project"],
        decision:"Subcon personnel withdrawing materials is not natively tracked. Custom field 'Withdrawn By' added to Stock Entry. A Defect Reported workflow state notifies Sub-Warehouse or Logistics. A custom 'Material Withdrawal Slip' print format is created for audit trail.",
        implementation:["Custom field on Stock Entry: 'Withdrawn By', 'Withdrawal Date', 'Item Condition on Receipt'","Workflow state: Defect Reported → notify Sub-WH manager + Logistics","Custom Print Format: Material Withdrawal Slip","Stock Entry type: Material Issue from Sub-WH to Project"],
        customization:["Custom fields on Stock Entry: Withdrawn By, Item Condition","Custom Print Format: Material Withdrawal Slip","Workflow: Defect notification to Sub-WH and Logistics"],
        openItems:["How does FG identify subcon withdrawers? Do they have IDs or just names?","Is Logistics internal or outsourced? Confirm notification method."] },
      { id:"RM-06", process:"Disciplinary Action (For Confirmation by Erol)", verdict:"CLARIFY", effort:"TBD",
        erpnextDocs:["HR → Employee (potential link)","Accounts → Journal Entry (if financial penalty)"],
        decision:"Requires confirmation from Erol before any mapping. Scope, trigger conditions, documentation requirements, and financial implications are all unknown at this stage.",
        implementation:[],customization:[],
        openItems:["Schedule dedicated session with Erol to define full scope","Does it apply to employees, subcons, or both?","Is there a financial consequence (e.g., deduction from payroll or subcon billing)?","What documentation is required — Incident Report, Notice, Acknowledgment?"] },
    ],
  },
  {
    module: "3. Billing",
    items: [
      { id:"BL-01", process:"DAR — Daily Accomplishment Report", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Project → Project (parent link)","Stock → Stock Entry (material ref)","HR → Timesheet (labor ref)"],
        decision:"No native DAR in ERPNext. A custom DocType 'Daily Accomplishment Report' is required with child tables for Workers, Equipment, and Materials. DAR is the foundational document feeding WAR and Billing — its design must be finalized first before downstream documents are built.",
        implementation:["Custom DocType: Daily Accomplishment Report","Header: Date, Project, Supervisor/PE, Location (Street), SOP/Activity reference","Child table: Workers (Name/Count, Role, Hours)","Child table: Equipment (Name/Asset link, Hours Used)","Child table: Materials Used (Item, Qty, Unit, Stock Item link)","Workflow: Draft → Submitted (by Supervisor)","Validation: All child tables must have at least one entry before submission","DAR rolls up into WAR for the Friday–Thursday week period"],
        customization:["Custom DocType: Daily Accomplishment Report","3 child tables: Workers, Equipment, Materials","SOP/Activity Type linkage","Rollup logic to WAR"],
        openItems:["Request a sample DAR form from FG for exact field mapping","What does 'connected to SOP' mean — a reference document, or BOQ line item?","How is 'Activity' defined — BOQ line items or free text?","Does DAR require approval from a supervisor before finalization?"] },
      { id:"BL-02", process:"WAR — Weekly Accomplishment Report (Friday–Thursday)", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Custom: Daily Accomplishment Report (source)","Project → Project (parent link)"],
        decision:"No native WAR in ERPNext. A custom DocType 'Weekly Accomplishment Report' auto-aggregates submitted DARs for the Friday–Thursday period per project. WAR is the baseline for crosschecking subcon billing claims.",
        implementation:["Custom DocType: Weekly Accomplishment Report","Fields: Project, Week Start (Friday), Week End (Thursday), totals for Workers/Equipment/Materials","Auto-fetch submitted DARs within the date range on WAR creation","Read-only summary pulled from DAR child records","Workflow: Draft → Submitted (Office Engineer) → Reviewed"],
        customization:["Custom DocType: Weekly Accomplishment Report","DAR aggregation script (auto-fetch and roll up DAR data)","Date range: Friday–Thursday enforced by validation"],
        openItems:["Request a sample WAR form from FG","Does WAR require management review before subcon billing is processed?","Is the Friday–Thursday week uniform across all FG projects?"] },
      { id:"BL-03", process:"Subcon Billing Request — Encoding & Crosscheck", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Custom: WAR (reference)","Buying → Purchase Invoice (eventual payment base)"],
        decision:"Subcon billing arrives on paper and is encoded by the Office Engineer. A custom DocType 'Subcon Billing Request' linked to WAR is required. The system compares subcon-claimed quantities against WAR data to highlight discrepancies before the approval chain begins.",
        implementation:["Custom DocType: Subcon Billing Request","Fields: Subcon (Supplier link), Project, WAR reference, Billing Date","Child table: Claimed Activities (Subcon-claimed vs WAR-recorded comparison)","Validation script: Thursday submission cutoff","Exception flag: 'Holiday Override' or 'Cash Advance Request'","Status: Draft → Encoded → Crosschecked → Sent for Approval"],
        customization:["Custom DocType: Subcon Billing Request","WAR vs Subcon claim comparison view","Thursday cutoff validation script","Holiday override / Cash Advance exception flag"],
        openItems:["Clarify 'Cash Advance' — early billing or pre-payment advance to subcon?","Is the Thursday cutoff a hard block or a soft warning?"] },
      { id:"BL-04", process:"Subcon Billing Approval Workflow (6-Step Chain)", verdict:"OOB", effort:"Medium",
        erpnextDocs:["Settings → Workflow (on Subcon Billing Request)"],
        decision:"ERPNext v15 Workflow Engine supports multi-step sequential approvals. The 6-step chain (Accounting → Construction Manager → Project Engineer → Top Management ×3) is configured on the Subcon Billing Request DocType.",
        implementation:["Workflow states: Encoded → Accounting Review → Construction Manager → Project Engineer → Top Mgmt 1 → Top Mgmt 2 → Top Mgmt 3 → Approved → Rejected","Email Alert to next approver on each state transition","Rejected state returns to Office Engineer with remarks"],
        customization:[],
        openItems:["Confirm exact sequence — Accounting before or after Construction Manager?","Can 2 of 3 Top Management approve, or must all 3 sign off?","Who handles rejected billing requests?"] },
      { id:"BL-05", process:"Accounting Releases Payment to Subcon", verdict:"OOB", effort:"Low",
        erpnextDocs:["Accounts → Payment Entry","Buying → Purchase Invoice"],
        decision:"Approved Subcon Billing Request → Purchase Invoice → Payment Entry. Fully OOB. Payment linked to Project and Cost Center for project costing.",
        implementation:["Approved Subcon Billing Request → create Purchase Invoice","Accounting processes Payment Entry against the Purchase Invoice","Payment linked to Project and Cost Center"],
        customization:[],openItems:[] },
      { id:"BL-06", process:"Quezon City Holiday Enforcement (All Projects)", verdict:"OOB", effort:"Low",
        erpnextDocs:["HR → Holiday List","Company Settings → Default Holiday List"],
        decision:"ERPNext supports Holiday Lists at the Company level. QC holidays are recognized across all FG projects regardless of physical location. OOB configuration only.",
        implementation:["Create Holiday List: 'FG — Quezon City Holidays'","Assign as Default Holiday List at Company level","Governs billing cutoffs and date-sensitive workflows across all projects","Update annually or as QC holidays are proclaimed"],
        customization:[],openItems:["Confirm: QC Holiday List applies to ALL FG projects including those in other cities?"] },
    ],
  },
];

const screen2 = [
  {
    module: "4. Permitting — Excavation & Traffic Permits",
    items: [
      { id:"PM-01", process:"Permit Request Tracking per LGU (Excavation & Traffic)", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Project → Project (parent link)","Accounts → Cost Center (cost tracking)"],
        decision:"Each LGU (Pasay, MMDA, Barangay, City) has its own process, requirements, and fees — no native Permit DocType exists in ERPNext. A custom DocType 'Project Permit' is required to track permit type, LGU authority, required documents, status, assigned Project Engineer (always named under PE and Project), and fees. For Pasay: Excavation Permit must be obtained before Traffic Permit — enforced via validation rule. Permit Request Letter is generated as a print format from the system.",
        implementation:["Custom DocType: 'Project Permit'","Fields: Permit Type (Excavation / Traffic / MMDA / Barangay / City), LGU Authority, Project link, Project Engineer (mandatory), Location/Street, Date Applied, Date Issued, Expiry Date, Fee Amount, Status","Permit dependency rule: Traffic Permit cannot be submitted if Excavation Permit for same project is not yet Issued (Pasay-specific validation)","Child table: Required Attachments checklist (Request Letter, LGU-issued docs, photos)","Workflow: Draft → Request Letter Sent → Awaiting LGU Response → Fee Quoted → Payment Requested → Permit Released","Auto-link permit to Project Cost Center for fee tracking","Print Format: Permit Request Letter (named under Project Engineer and Project)"],
        customization:["Custom DocType: Project Permit","LGU-specific validation logic (Excavation-before-Traffic rule for Pasay)","Permit Request Letter print format","Workflow: 6-state permit lifecycle"],
        openItems:["Provide complete list of LGUs and their respective permit requirements","Does the MMDA permit process differ significantly from City-level? Provide sample forms.","Who is responsible for permit renewal when permits expire mid-project?","Are permits always walk-in or are some submitted online through LGU portals?"] },
      { id:"PM-02", process:"Permit Fee Payment Requisition → Finance → Release", verdict:"WORKAROUND", effort:"Medium",
        erpnextDocs:["Accounts → Payment Request","Accounts → Payment Entry","Custom: Project Permit (parent link)"],
        decision:"When the LGU quotes a permit fee, FG raises a Payment Requisition to Finance with permit documents attached. ERPNext's Payment Request DocType (OOB) serves as the Payment Requisition when linked to the custom Project Permit. Finance reviews attachments, approves, and releases payment via Payment Entry.",
        implementation:["Create Payment Request from the Project Permit DocType (custom button/link)","Mandatory attachments: LGU fee quote letter, Permit Request Letter, supporting permits","Payment Request workflow: Draft → Submitted by Project → Finance Review → Approved → Payment Released","Payment Entry created by Finance upon approval (OOB)","Project and Cost Center linked on Payment Entry","Cost Code and BOQ Code fields added to Payment Request (see PM-03)"],
        customization:["Custom action: 'Create Payment Request' button on Project Permit","Mandatory attachment validation on Payment Request","Cost Code and BOQ Code fields on Payment Request"],
        openItems:["Is the Payment Requisition a standard company form? Provide sample for print format mapping.","Who in Finance approves permit payment requisitions?","Are permit fees always cash advance or can they be check payments?"] },
      { id:"PM-03", process:"Cost Code & BOQ Code Implementation", verdict:"WORKAROUND", effort:"Medium",
        erpnextDocs:["Accounts → Cost Center (Cost Code)","Project → Project (BOQ reference)","Stock → Item (BOQ Item Code)"],
        decision:"Cost Codes map directly to ERPNext's Cost Center hierarchy (Permits, Labor, Materials, Equipment per project). BOQ Codes are implemented as custom fields on all relevant DocTypes (Project Permit, Stock Entry, Payment Request, Purchase Invoice, Sales Invoice, DAR child tables). All financial transactions reference both Cost Code and BOQ Code for accurate project cost tracking.",
        implementation:["Cost Center hierarchy: Company > Project > Cost Category (Permits, Labor, Materials, Equipment, Subcon)","All Payment Requests, Stock Entries, Purchase Invoices reference Project Cost Center","Custom field 'BOQ Code' added to: Project Permit, Payment Request, Stock Entry, Purchase Invoice, Sales Invoice, DAR child tables","BOQ line item registry (custom DocType or Budget per Project)","Custom report: Actual Cost vs BOQ by Cost Code and BOQ Code per project"],
        customization:["Custom field 'BOQ Code' on multiple DocTypes","BOQ line item registry DocType or Budget integration","Custom report: Actual Cost vs BOQ by Cost Code"],
        openItems:["Provide standard Cost Code structure FG currently uses","Provide a sample BOQ document for DocType / line item structure design","Is the BOQ Code format numeric, alphanumeric, or hierarchical (e.g., 01.02.003)?"] },
      { id:"PM-04", process:"Self-Contractor / Subcon Permit Coordination with LGU", verdict:"CLARIFY", effort:"TBD",
        erpnextDocs:["Project → Project","Buying → Supplier (Subcon)"],
        decision:"For all works, self-contractors communicate directly with LGUs and city offices to arrange permits. FG monitors and documents outcomes. The extent of FG's system involvement in this coordination (logging calls, tracking outcomes, storing LGU communications) must be defined before a mapping decision can be made.",
        implementation:[],customization:[],
        openItems:["Does FG need to log every subcon–LGU communication in ERPNext, or only the final permit document?","Who in FG monitors subcon permit status?","Is there a formal handover step when subcon submits the obtained permit to FG's Office Engineer?"] },
    ],
  },
  {
    module: "5. Job Order Management (Immediate Repair)",
    items: [
      { id:"JO-01", process:"Job Order Creation & Assignment (Immediate Repair / Test Pit)", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Project → Project (parent or standalone)","Buying → Supplier (Subcon link)"],
        decision:"ERPNext's manufacturing Job Card is not applicable for field repair work. A custom DocType 'Job Order (JO)' is required capturing location, scope, assigned subcon, materials included in JO scope, equipment, linked permit, Cost Code, and BOQ Code. Billing is per JO. Maynilad requires JOs to not cross calendar months — this is enforced via a month-end risk flag. Communication with LGU/Maynilad happens externally (via call) — outcomes are recorded on the JO.",
        implementation:["Custom DocType: 'Job Order'","Fields: JO Number (auto, Project-prefixed), Project, Type (Immediate Repair / Test Pit / CAPEX), Location/Street, Assigned Subcon, Project Engineer, Start Date, Target Completion, Status, Cost Code, BOQ Code","Child table: Scope of Work / Activities","Child table: Materials Included (Stock Item link)","Child table: Equipment Required","Link: Associated Permit (Project Permit DocType)","Workflow: Draft → Issued → In Progress → For Inspection → Completed → Billed","Month-end risk flag: auto-calculated, visible to Office Engineer","Monthly balance field: remaining JO balance at month-end"],
        customization:["Custom DocType: Job Order","Child tables: Scope, Materials, Equipment","JO auto-numbering with Project prefix","Workflow: 6-state JO lifecycle","Month-end risk flag and balance field","Monthly end-of-month balance alert"],
        openItems:["Request sample Job Order form from FG / Maynilad","Does the JO have a fixed monetary value from Maynilad or is it scope-based?","Can one JO span multiple locations or always one location?","What triggers a JO — Maynilad instruction only, or can FG initiate?","Request sample Monthly Monitoring Report format"] },
      { id:"JO-02", process:"Before & After Photo Documentation (Maynilad / GC Submission)", verdict:"WORKAROUND", effort:"Medium",
        erpnextDocs:["Custom: Job Order (parent)","Settings → File Attachment","Communication Log"],
        decision:"Photo documentation (before and after work) is captured as mandatory attachments on the Job Order. The Office Engineer uploads photos and submits to Maynilad (GC) via ERPNext Communication/Email logged on the JO record. A photo checklist section enforces both before and after uploads before the JO can advance status.",
        implementation:["Custom section on Job Order: 'Photo Documentation'","Attachment fields: Before Work Photos (mandatory before status = In Progress), After Work Photos (mandatory before status = For Inspection)","Validation: JO cannot move to 'For Inspection' without both photo sets attached","Email to Maynilad GC sent via ERPNext Communication on the JO record","Communication log tracks all Maynilad exchanges on the JO"],
        customization:["Custom attachment section with mandatory validation on Job Order","Before/after photo enforcement via workflow condition"],
        openItems:["What photo format/resolution does Maynilad require?","Does Maynilad require photos sent via a specific portal or is email accepted?"] },
      { id:"JO-03", process:"Equipment Entry Request to ATC", verdict:"CUSTOM", effort:"Low",
        erpnextDocs:["Custom: Job Order (parent)","Asset → Asset (Equipment reference)"],
        decision:"Before equipment can enter a project site, FG must request clearance from ATC. A custom child table 'Equipment Entry Requests' on the Job Order captures equipment name/type, requested entry date, and ATC clearance status. An email alert notifies the ATC coordinator. JO cannot move to 'In Progress' if any equipment clearance is still pending.",
        implementation:["Child table on Job Order: 'Equipment Entry Requests' (Equipment Name/Asset link, Type, Requested Date, ATC Clearance Status: Pending / Approved / Rejected)","Email Alert: Equipment Entry Request submitted → notify ATC Coordinator role","ATC Coordinator updates clearance status on the record","Workflow validation: block JO start if any equipment clearance is Pending"],
        customization:["Child table: Equipment Entry Requests on Job Order","Email Alert: ATC notification on new equipment request","Workflow validation: block JO start if equipment clearance pending"],
        openItems:["Is ATC an internal department or an external authority? Do they have system access?","What is the typical lead time for ATC equipment clearance?"] },
      { id:"JO-04", process:"Material Abono (Advance Material) & UCE", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Stock → Stock Entry (Material Issue)","Custom: Job Order (parent)","Accounts → Journal Entry (abono tracking)"],
        decision:"Materials are advanced (inaabunohan) to subcons — not cash. Subcon is expected to replace/return them. If not replaced, a UCE (Unit Cost Estimate / Unilateral Cost Estimate) is generated, equivalent to a detailed unit price analysis. ERPNext does not natively handle this material loan-and-return model. A custom 'Material Abono' tracking mechanism on the JO with a UCE trigger is required.",
        implementation:["Custom DocType: 'Material Abono Record' linked to Job Order and Subcon","Fields: JO reference, Subcon, Item, Qty Issued, Expected Return Date, Qty Returned, Status (Open / Partially Returned / Closed / UCE Triggered)","Stock Entry (Material Issue) marks items as 'Abono' via custom field","Automated alert: if Expected Return Date passes with open balance → notify Office Engineer + Accounting","Custom DocType: 'UCE (Unit Cost Estimate)' triggered from unresolved Abono records","UCE fields mirror the Detailed Unit Price Analysis format","UCE linked to Subcon Billing Request as a deduction line item"],
        customization:["Custom DocType: Material Abono Record","Custom field on Stock Entry: Abono flag + JO reference","UCE DocType with detailed unit price analysis structure","Alert: overdue abono → UCE trigger notification","UCE deduction logic on Subcon Billing"],
        openItems:["What is the defined return period for abono materials before UCE is triggered?","Provide sample UCE / Detailed Unit Price Analysis form for field mapping","Is the UCE amount deducted from subcon billing or invoiced separately?","Who approves a UCE — Project Engineer, Construction Manager, or Accounting?"] },
      { id:"JO-05", process:"Penalty Forecasting & Actual Penalty Handling", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Custom: Job Order (parent)","Accounts → Journal Entry (penalty posting)"],
        decision:"FG proactively forecasts if a JO will incur a penalty before it actually does. When the JO timeline shows insufficient remaining hours, an alert is raised. If a penalty is actually incurred, it is recorded and linked to the JO. ERPNext has no native penalty forecasting — custom fields and alert logic are needed on the Job Order.",
        implementation:["Custom fields on Job Order: Contractual Deadline, Forecasted Completion Date, Penalty Rate per Day, Forecasted Penalty Amount (auto-calculated)","Alert: if Forecasted Completion > Contractual Deadline → notify Project Engineer and Construction Manager","Child table: 'Penalty Records' (Date, Reason, Amount, Status: Forecasted / Actual / Disputed / Settled)","Actual Penalty posted via Journal Entry linked to JO and Project Cost Center","Penalty report per project per JO for management visibility"],
        customization:["Custom fields on Job Order: deadline, penalty rate, forecast","Auto-calculation: Forecasted Penalty = (Forecast Date - Deadline) × Penalty Rate","Email Alert: forecast breach notification","Child table: Penalty Records","Journal Entry integration for actual penalty posting"],
        openItems:["What is the Maynilad penalty rate structure — fixed per day or percentage-based?","Who determines if a penalty is disputed vs settled?","Does forecasted penalty affect subcon billing deductions?"] },
      { id:"JO-06", process:"Final Inspection Report (FIR) & Site Validation", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Custom: Job Order (parent)","Project → Project"],
        decision:"Upon JO completion, a Final Inspection Report (FIR) is generated and validated on-site with Maynilad personnel. Once signed off, the FIR is submitted and triggers billing. A custom 'Final Inspection Report' DocType linked to the Job Order is required with digital workflow, restoration photo validation, and a print format for Maynilad physical signature.",
        implementation:["Custom DocType: 'Final Inspection Report (FIR)' linked to Job Order","Fields: JO reference, Inspection Date, Inspected By (FG PE), Maynilad Representative, Restoration Status, Remarks","Mandatory attachment: Restoration Photos (before FIR can be submitted)","Workflow: Draft → Site Inspection Scheduled → Inspection Done → Maynilad Sign-Off Obtained → FIR Submitted → Billing Triggered","On FIR status = FIR Submitted: auto-update JO status to 'Completed' and unlock Billing creation","Print Format: FIR document for physical Maynilad signature"],
        customization:["Custom DocType: Final Inspection Report (FIR)","Workflow: 6-state FIR lifecycle","Restoration photo mandatory attachment validation","Trigger: FIR Submitted → JO status update → Billing unlock","FIR print format for Maynilad sign-off"],
        openItems:["Request sample FIR form from Maynilad for exact field mapping","Does Maynilad sign the FIR physically or digitally?","What is the validation process — does Maynilad return a signed copy to FG or submit independently?"] },
      { id:"JO-07", process:"Monthly JO Monitoring (Maynilad Grading — No Cross-Month JOs)", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Custom: Job Order (parent)","Reports → Script Report"],
        decision:"Maynilad requires JOs completed and billed within the same calendar month — crossing months affects FG's Maynilad grading score. The Office Engineer monitors remaining JO balance at month-end. A custom Monthly JO Monitoring report shows all active JOs, month-end deadline risk, remaining balance, and days left. An automated alert triggers near month-end for open JOs.",
        implementation:["Custom Script Report: 'Monthly JO Status' — per JO: start date, target completion, days remaining in month, balance amount, risk flag (On Track / At Risk / Critical)","Dashboard widget: open JOs per project with month-end countdown","Automated alert: 5 days before month-end → notify Office Engineer of all open JOs","Field on JO: 'Month-End Risk' (auto-calculated flag)","Report: export-ready format for Maynilad grading review"],
        customization:["Custom Script Report: Monthly JO Status with risk flagging","Dashboard widget: JO month-end tracker","Automated alert: 5-day month-end warning for open JOs"],
        openItems:["Request sample Monthly Report format from FG / Maynilad","What is FG's exact grading criteria — how many open JOs before grade is affected?","Does the Office Engineer submit monthly report to Maynilad directly or through a portal?"] },
    ],
  },
  {
    module: "6. Progress Billing",
    items: [
      { id:"PB-01", process:"Progress Billing for Completed Job Orders", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Custom: Job Order (parent)","Custom: FIR (trigger)","Buying → Supplier (Subcon)","Accounts → Sales Invoice (client billing)"],
        decision:"JO billing is triggered only after FIR is submitted and signed. Subcon must first submit: progress photos, progress billing summary, JO documents, FIR, and test results. Office Engineer double-checks, then Accounting compiles billing attachments. Billing is notarized and submitted to Maynilad for two rounds of validation. A custom 'JO Billing Request' DocType with document checklist and multi-step approval is required.",
        implementation:["Custom DocType: 'JO Billing Request' linked to Job Order and FIR","Mandatory document checklist: Progress Photos, Progress Billing Summary, JO Documents, FIR (signed), Test Results","Workflow: Draft → Document Check (OE) → Accounting Review → Notarization Flag → Submitted to Maynilad → Maynilad Validation 1 → Maynilad Validation 2 → Approved → Payment Released","Checklist validation: cannot advance without all required attachments","Sales Invoice created after Maynilad double-validation (OOB)","Payment Entry on receipt of Maynilad payment (OOB)"],
        customization:["Custom DocType: JO Billing Request","Document checklist with mandatory attachment validation","Workflow: 9-state billing lifecycle including dual Maynilad validation","Notarization flag field"],
        openItems:["Request sample Progress Billing Summary form","Request sample Billing Attachments form (the Accounting form)","What test results are required — hydrostatic, leakage? Provide complete list.","Who handles notarization — FG officer or external notary? Is it always required?"] },
      { id:"PB-02", process:"CAPEX Progress Billing / Escrow Billing (Escurb) — Maynilad", verdict:"CUSTOM", effort:"High",
        erpnextDocs:["Project → Project (accomplishment tracking)","Accounts → Sales Invoice (billing)","Custom: Escrow Billing DocType"],
        decision:"CAPEX billing is based on physical accomplishment, not time. FG monitors accomplishment per project and requests Progress Billing or Escrow Billing (Escurb) from Maynilad via email. Maynilad generates a spreadsheet of what FG can bill. If Escurb is positive, FG bills directly; if negative, a minimum required amount rule applies. The Escurb structure is FG-defined at project start. A custom 'Escrow Billing (Escurb)' DocType is required.",
        implementation:["Custom DocType: 'Escrow Billing (Escurb)' linked to Project","Fields: Billing Type (Progress / Escrow), Billing Period, Physical Accomplishment % (Actual vs Planned), Positive/Negative flag, Maynilad-generated Billable Amount, FG Requested Billable Amount","At project start: Escurb submittal record created with planned accomplishment schedule","Monthly: Office Engineer updates Actual Accomplishment %; system calculates Positive/Negative Escurb","If Positive: generate Sales Invoice for full billable amount","If Negative: system shows minimum required billing amount and flags shortfall","Email from ERPNext to Maynilad with Escurb request and attachments","Maynilad spreadsheet uploaded as attachment with billable line items","Sales Invoice created based on Maynilad-confirmed amounts (OOB)"],
        customization:["Custom DocType: Escrow Billing (Escurb)","Positive/Negative Escurb calculation logic","Minimum billing amount rule when Escurb is negative","Accomplishment schedule (planned vs actual) tracking"],
        openItems:["Request Escurb template used by FG","Request sample Progress Billing form (FG to Maynilad)","What is the minimum billing amount threshold when Escurb is negative — fixed or percentage?","How is 'physical accomplishment' measured — by activity count, linear meters, or % of scope?","Is there a client-side billing format FG issues to clients outside Maynilad?"] },
      { id:"PB-03", process:"Accomplishment Monitoring — Actual vs Planned", verdict:"WORKAROUND", effort:"Medium",
        erpnextDocs:["Project → Project (% Complete field)","Custom: DAR (actual data source)","Reports → Script Report"],
        decision:"ERPNext v15 Project module has % Completion and Expected End Date OOB. Actual accomplishment flows from DAR data. A Script Report compares Planned vs Actual % Completion per project per period, using OOB Project fields combined with DAR aggregation — a workaround using existing infrastructure.",
        implementation:["Use Project DocType % Complete field as Actual Accomplishment tracker (updated from WAR/DAR data)","Define Planned Accomplishment as project milestone schedule (Project Task with Expected Dates)","Script Report: 'Accomplishment Monitoring' — Planned % vs Actual % per project per week/month","Dashboard: Red/Yellow/Green flag per project based on accomplishment gap","Data source: DAR child table (activity completion) aggregated to Project % Complete"],
        customization:["Script Report: Accomplishment Monitoring (Actual vs Planned)","Dashboard widget: project accomplishment status with traffic light flag","DAR → Project % Complete aggregation script"],
        openItems:["How is Planned Accomplishment defined at project start — by FG, Maynilad, or client contract?","Is the accomplishment unit consistent (%) across all project types or does it vary?"] },
    ],
  },
  {
    module: "7. Budget & Operational Monitoring",
    items: [
      { id:"MON-01", process:"Man-Hour & Equipment Hour Monitoring vs Budget (DAR-based)", verdict:"CUSTOM", effort:"Medium",
        erpnextDocs:["Custom: DAR (data source)","Project → Budget","Asset → Asset (equipment)","Reports → Script Report"],
        decision:"Budget monitoring requires tracking actual man-hours and equipment hours from DAR against the planned budget. Internal equipment (FG-owned assets) are charged to the project based on day-based DAR records at a defined day rate. ERPNext's Budget module tracks monetary amounts but not hours directly — a custom aggregation layer is needed.",
        implementation:["DAR child table Workers: record hours per person (not just headcount)","DAR child table Equipment: record hours used per piece of equipment","Custom DocType or Report: 'Project Hours Budget' — Budgeted vs Actual Man-Hours and Equipment Hours per Cost Code","Internal equipment: asset usage hours billed to project via Journal Entry (Asset Hours × Day Rate)","Day Rate per equipment type configured in 'Equipment Rate Card' DocType or Item Price","Script Report: 'Man-Hour & Equipment Hour Budget vs Actual' per project, per cost code, per period","Dashboard: hours burn rate with simple monitoring view"],
        customization:["Equipment Hours billing logic: Asset Hours × Day Rate → Journal Entry to Project Cost Center","Custom DocType: Project Hours Budget (Budgeted hours per cost code)","Script Report: Man-Hour & Equipment Hour Budget vs Actual","Equipment Rate Card (custom DocType or Item Price configuration)"],
        openItems:["Is the budget defined in hours, monetary value, or both?","How is equipment rate defined — per hour, per day, per shift?","Are internal FG equipment rates fixed or vary by project type?","Provide sample budget format to design 'Project Hours Budget' structure"] },
      { id:"MON-02", process:"Customer Satisfaction Survey (Web Form)", verdict:"OOB", effort:"Low",
        erpnextDocs:["Website → Web Form","CRM → Customer (response link)"],
        decision:"ERPNext v15 includes a fully functional Web Form module that generates public-facing survey forms without custom development. A Customer Satisfaction Survey is configured as a Web Form with rating questions linked to Project and Customer. Responses are stored in ERPNext and reportable. Optionally triggered automatically when Project status = Completed.",
        implementation:["Create Web Form: 'Customer Satisfaction Survey' in ERPNext Website module","Fields: Project Name, Customer/Client, Rating questions (1–5 scale), Comments, Date","Publish Web Form with shareable URL or embed in FG website","Responses auto-create a DocType record linked to Project and Customer","Report: Customer Satisfaction Summary per project","Optional: trigger survey email to client automatically when Project status = Completed"],
        customization:[],
        openItems:["Define survey questions — what dimensions does FG want to measure (quality, timeliness, communication)?","Is the survey sent to Maynilad, end clients, or both?","Should survey responses be anonymous or linked to a named respondent?"] },
    ],
  },
];

const SCREENS = [
  { id:"s1", label:"🏗️ CRM, Materials & Billing",   subtitle:"Business Development  ·  Request Materials  ·  Billing", data: screen1 },
  { id:"s2", label:"📋 Permitting & Operations",     subtitle:"Permits  ·  Job Orders  ·  Progress Billing  ·  Monitoring", data: screen2 },
];

const computeStats = (data) => ({
  OOB:        data.flatMap(m=>m.items).filter(i=>i.verdict==="OOB").length,
  WORKAROUND: data.flatMap(m=>m.items).filter(i=>i.verdict==="WORKAROUND").length,
  CUSTOM:     data.flatMap(m=>m.items).filter(i=>i.verdict==="CUSTOM").length,
  CLARIFY:    data.flatMap(m=>m.items).filter(i=>i.verdict==="CLARIFY").length,
  OPEN:       data.flatMap(m=>m.items).flatMap(i=>i.openItems).length,
});

function Row({ children, last, sep }) {
  return (
    <div style={{ display:"flex", gap:10, padding:"5px 0", borderBottom: last ? "none" : `1px dashed ${sep}` }}>
      {children}
    </div>
  );
}
function Section({ label, children }) {
  return (
    <div style={{ marginTop:16 }}>
      <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:1.5, color:"#94a3b8", marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}

function DecisionCard({ item }) {
  const [open, setOpen] = useState(false);
  const V = VERDICT[item.verdict];
  const E = EFFORT[item.effort];
  return (
    <div style={{ background:"white", borderRadius:10, marginBottom:12, border:`1px solid ${V.border}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ cursor:"pointer", padding:"16px 20px", display:"flex", alignItems:"center", gap:14, background:`${V.bg}50` }}>
        <div style={{ flexShrink:0, width:52 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#94a3b8", letterSpacing:1, textAlign:"center" }}>{item.id}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>{item.process}</div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{item.erpnextDocs.join("  ·  ")}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          <span style={{ fontWeight:800, fontSize:12, color:V.color, background:V.bg, border:`1px solid ${V.border}`, borderRadius:20, padding:"4px 12px", whiteSpace:"nowrap" }}>
            {V.icon} {V.label}
          </span>
          <span style={{ fontWeight:700, fontSize:11, color:E.color, background:E.bg, borderRadius:20, padding:"4px 10px", whiteSpace:"nowrap" }}>
            {item.effort==="TBD" ? "Effort: TBD" : `${item.effort} Effort`}
          </span>
          <span style={{ fontSize:14, color:"#94a3b8", marginLeft:4 }}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${V.border}` }}>
          <Section label="Final Decision">
            <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.7, background:"#f8fafc", padding:"12px 16px", borderRadius:8, borderLeft:`4px solid ${V.color}` }}>
              {item.decision}
            </div>
          </Section>
          {item.implementation.length > 0 && (
            <Section label="Implementation Steps">
              <div style={{ background:"#f0fdf4", borderRadius:8, padding:"12px 16px", border:"1px solid #86efac" }}>
                {item.implementation.map((s,i) => (
                  <Row key={i} last={i===item.implementation.length-1} sep="#bbf7d0">
                    <span style={{ color:"#166534", fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:13, color:"#1e293b" }}>{s}</span>
                  </Row>
                ))}
              </div>
            </Section>
          )}
          {item.customization.length > 0 && (
            <Section label="Custom Development Required">
              <div style={{ background:"#fff7ed", borderRadius:8, padding:"12px 16px", border:"1px solid #fdba74" }}>
                {item.customization.map((c,i) => (
                  <Row key={i} last={i===item.customization.length-1} sep="#fed7aa">
                    <span style={{ color:"#c2410c", fontWeight:700, flexShrink:0 }}>🔧</span>
                    <span style={{ fontSize:13, color:"#1e293b" }}>{c}</span>
                  </Row>
                ))}
              </div>
            </Section>
          )}
          {item.openItems.length > 0 && (
            <Section label="Open Items — Pending Client Confirmation">
              <div style={{ background:"#fefce8", borderRadius:8, padding:"12px 16px", border:"1px solid #fde68a" }}>
                {item.openItems.map((oi,i) => (
                  <Row key={i} last={i===item.openItems.length-1} sep="#fef08a">
                    <span style={{ color:"#a16207", fontWeight:700, flexShrink:0 }}>❓</span>
                    <span style={{ fontSize:13, color:"#1e293b" }}>{oi}</span>
                  </Row>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screenId, setScreenId] = useState("s1");
  const [subView, setSubView]   = useState("decisions");
  const [filter, setFilter]     = useState("ALL");

  const screenMeta = SCREENS.find(s=>s.id===screenId);
  const data       = screenMeta.data;
  const stats      = computeStats(data);

  const allOpenItems = data.flatMap(mod =>
    mod.items.flatMap(item => item.openItems.map(oi => ({ id:item.id, process:item.process, oi })))
  );

  const filteredData = data.map(mod => ({
    ...mod, items: mod.items.filter(i => filter==="ALL" || i.verdict===filter)
  })).filter(mod => mod.items.length > 0);

  return (
    <div style={{ fontFamily:"Arial, sans-serif", background:"#f1f5f9", minHeight:"100vh" }}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)", color:"white", padding:"20px 32px 0" }}>
        <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:3, opacity:0.6, marginBottom:4 }}>FG Construction Engineering — ERPNext v15</div>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Process Mapping — Final Decisions</div>
        <div style={{ fontSize:12, opacity:0.65, marginTop:2, marginBottom:16 }}>Cross-functional verdict: OOB / Workaround / Custom Dev / Needs Clarification</div>
        <div style={{ display:"flex", gap:4 }}>
          {SCREENS.map(s => (
            <button key={s.id} onClick={() => { setScreenId(s.id); setSubView("decisions"); setFilter("ALL"); }}
              style={{ padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer",
                background: screenId===s.id ? "white" : "rgba(255,255,255,0.12)",
                color: screenId===s.id ? "#1d4ed8" : "rgba(255,255,255,0.85)",
                border:"none", borderRadius:"8px 8px 0 0" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background:"#1e293b", padding:"12px 32px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginRight:6 }}>{screenMeta.subtitle}</div>
        {[["OOB","✅"],["WORKAROUND","⚙️"],["CUSTOM","🔧"],["CLARIFY","❓"]].map(([k,ic]) => (
          <div key={k} style={{ background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"4px 14px" }}>
            <span style={{ fontSize:16, fontWeight:800, color:"white" }}>{stats[k]} </span>
            <span style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{ic} {VERDICT[k].label}</span>
          </div>
        ))}
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"4px 14px" }}>
          <span style={{ fontSize:16, fontWeight:800, color:"#fbbf24" }}>{stats.OPEN} </span>
          <span style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>📌 Open Items</span>
        </div>
      </div>

      {/* NAV */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"0 32px", display:"flex" }}>
        {[["decisions","📋 Final Decisions"],["openitems",`📌 Open Items (${allOpenItems.length})`]].map(([v,l]) => (
          <button key={v} onClick={() => setSubView(v)}
            style={{ padding:"13px 20px", fontSize:13, fontWeight:700, cursor:"pointer", background:"transparent",
              border:"none", borderBottom: subView===v ? "3px solid #1d4ed8" : "3px solid transparent",
              color: subView===v ? "#1d4ed8" : "#64748b" }}>
            {l}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding:"24px 32px", maxWidth:980, margin:"0 auto" }}>

        {subView === "decisions" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
              {["ALL","OOB","WORKAROUND","CUSTOM","CLARIFY"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:"6px 16px", fontSize:12, fontWeight:700, cursor:"pointer", borderRadius:20,
                    border: filter===f ? "2px solid #1d4ed8" : "2px solid #e2e8f0",
                    background: filter===f ? "#1d4ed8" : "white",
                    color: filter===f ? "white" : "#374151" }}>
                  {f==="ALL" ? "All Processes" : `${VERDICT[f].icon} ${VERDICT[f].label}`}
                </button>
              ))}
            </div>
            {filteredData.map(mod => (
              <div key={mod.module} style={{ marginBottom:32 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#0f172a", textTransform:"uppercase",
                  letterSpacing:0.8, padding:"8px 0", borderBottom:"2px solid #0f172a", marginBottom:16 }}>
                  {mod.module}
                </div>
                {mod.items.map(item => <DecisionCard key={item.id} item={item} />)}
              </div>
            ))}
          </>
        )}

        {subView === "openitems" && (
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
              All {allOpenItems.length} open items for this module group requiring client confirmation before development proceeds.
            </div>
            {allOpenItems.map((item,i) => (
              <div key={i} style={{ display:"flex", gap:14, padding:"14px 18px", background:"white",
                border:"1px solid #fde68a", borderRadius:8, marginBottom:8, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ flexShrink:0 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"#fef9c3",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>❓</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", marginBottom:3 }}>{item.id} — {item.process}</div>
                  <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.6 }}>{item.oi}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
