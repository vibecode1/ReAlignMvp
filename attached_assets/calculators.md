We need to implement the 'Financial Calculators' module (Task 1.4) for our ReAlignMvp application. This involves creating a series of backend functions, likely within a new service, to perform calculations critical for loss mitigation processes.

**Primary Reference Document:**

* `Fannie Mae Guidelines.txt` (This is the source of truth for rules and formulas).

**Core Requirements:**

1. **New Service:** Create a new backend service, for example, `server/services/FinancialCalculatorService.ts`.  
2. **Individual Calculator Functions:** Implement distinct functions within this service for each calculator listed below.  
3. **Inputs & Outputs:** Each function should accept clearly defined input parameters (which would typically be derived from the Borrower Response Package (BRP)/Form 710 data, stored in our `uba_form_data` table or related document extractions) and return well-structured output(s).  
4. **Accuracy & Guideline Adherence:** All calculations must precisely follow the logic, formulas, and thresholds specified in the `Fannie Mae Guidelines.txt`. Cite the relevant source number from the guidelines in your code comments for each piece of logic.  
5. **Data Sourcing (Conceptual):** While implementing, consider that input data like Gross Monthly Income (GMI), PITI, debts, assets, hardship details, etc., will ultimately be sourced from the user's UBA form data (see `shared/schema.ts` for `uba_form_data` structure and `server/storage.ts` for access methods).  
6. **Integration Points (Conceptual):** Think about how these calculator functions might be called by other backend services or controllers (e.g., `UbaFormController.ts` or a new controller for financial evaluations) and how their outputs could eventually be used/displayed in the frontend (`client/src/pages/UBAFormMakerEnhanced.tsx`).

**List of Calculators to Implement:**

Please implement functions for the following, referencing `Fannie Mae Guidelines.txt` (FNMA\_GUIDELINES) for logic:

1. **Housing Expense-to-Income Ratio (Front-End DTI) Calculator:**

   * **Purpose:** Calculates total housing expenses (PITI) as a percentage of gross monthly income.  
   * **Inputs:** Monthly PITI, Gross Monthly Income (GMI).  
   * **Output:** Ratio (e.g., 0.35 for 35%).  
   * **Guideline Logic:** See FNMA\_GUIDELINES regarding the 40% threshold for short sale cash contribution.  
2. **Total Debt-to-Income (Back-End DTI) Calculator:**

   * **Purpose:** Calculates total monthly debt payments (including PITI and other recurring debts) as a percentage of GMI.  
   * **Inputs:** Monthly PITI, sum of other monthly debt payments, GMI.  
   * **Output:** Ratio (e.g., 0.45 for 45%).  
   * **Guideline Logic:** General affordability assessment standard.  
3. **Non-Taxable Income Gross-Up Calculator:**

   * **Purpose:** Adjusts non-taxable income for qualification, developing an "adjusted gross income."  
   * **Inputs:** Amount of specific non-taxable income, gross-up percentage (default to 25% as per guidelines, but allow override if actual tax rate determinable).  
   * **Output:** Grossed-up income amount for that specific income source.  
   * **Guideline Logic:** FNMA\_GUIDELINES ("adding an amount equivalent to 25% of the non-taxable income"). Also consider for income documented by bank statements.  
4. **Non-Retirement Cash Reserves Calculator:**

   * **Purpose:** Sums borrower's liquid assets, excluding retirement funds.  
   * **Inputs:** Checking account balances, savings/money market balances, non-retirement stocks/bonds values, other liquid assets (as per Form 710).  
   * **Output:** Total non-retirement cash reserves.  
   * **Guideline Logic:** Used for $10,000 and $25,000 thresholds affecting short sales, DILs, and imminent default.  
5. **Cash Contribution Calculator (Short Sales/Deed-in-Lieu):**

   * **Purpose:** Determines potential cash contribution required from the borrower.  
   * **Inputs:** Total non-retirement cash reserves, contractual monthly PITI, estimated deficiency amount.  
   * **Output:** Calculated cash contribution amount.  
   * **Guideline Logic:** "greater of 20% of non-retirement cash reserves or four times the contractual monthly PITI, not to exceed the deficiency". Consider conditions for waiver/mandatory contribution.  
6. **Escrow Shortage Repayment Calculator:**

   * **Purpose:** Calculates the monthly payment needed to cure an escrow shortage over a defined period.  
   * **Inputs:** Total escrow shortage amount, repayment term in months (e.g., default to 60).  
   * **Output:** Monthly escrow shortage repayment amount.  
   * **Guideline Logic:** FNMA\_GUIDELINES (repayment over 60 months for payment deferrals).  
7. **Trial Period Payment Calculator (Loan Modifications):**

   * **Purpose:** Estimates the PITI payment for a trial modification period.  
   * **Inputs:** Anticipated modified principal & interest, estimated monthly property taxes, estimated monthly homeowners insurance, any other required monthly escrow amounts (e.g., HOA).  
   * **Output:** Total trial period payment.  
   * **Guideline Logic:** Implied by the requirement for a Trial Period Plan for Flex Modifications.  
8. **Forbearance/Repayment Plan Parameter Calculator:**

   * **Purpose:** Helps determine allowable payment amounts and durations for repayment plans.  
   * **Inputs:** Full monthly contractual PITI, total delinquency amount, borrower's assessed financial capacity.  
   * **Outputs:** Maximum allowable repayment plan monthly payment, maximum allowable repayment plan duration (considering combined forbearance/repayment limits).  
   * **Guideline Logic:** Repayment plan payment \<= 150% of contractual PITI. Combined forbearance and repayment plan period \<= 36 months.  
9. **Payment Deferral Eligibility Metrics Calculator:**

   * **Purpose:** Calculates various date-based and history-based metrics for payment deferral eligibility.  
   * **Inputs:** Loan origination date, evaluation date, loan maturity date, payment history (to determine delinquency months and prior deferrals), history of prior non-disaster deferrals (dates and amounts).  
   * **Outputs:** Boolean flags or values for:  
     * Loan originated \>= 12 months prior?  
     * Current delinquency status (e.g., 2-6 months for non-disaster, 1-12 months for disaster).  
     * Cumulative non-disaster P\&I deferred \<= 12 months?  
     * No non-disaster deferral within last 12 months?  
     * Loan not within 36 months of maturity?  
   * **Note:** This might be a set of related functions or one function returning an object with multiple metrics.  
10. **Property LTV & Required Paydown Calculator (Property-Related Requests):**

    * **Purpose:** Calculates LTV before and after a property action (e.g., partial release) and any required paydown to meet target LTV.  
    * **Inputs:** Current loan balance, property value before action, property value after action, target LTV (e.g., 60%).  
    * **Outputs:** LTV before, LTV after, required paydown amount.  
    * **Guideline Logic:** Many property-related requests target LTV \< 60% or require borrower paydown to maintain prior LTV or reach 60% LTV.  
11. **Relocation Assistance Eligibility Calculator:**

    * **Purpose:** Determines if a borrower is eligible for relocation assistance.  
    * **Inputs:** Is property the borrower's principal residence? Is a cash contribution required (even if not made)? Is the borrower a servicemember with PCS orders receiving DLA/other government aid?  
    * **Output:** Object { eligible: boolean, amount: number (e.g., 7500 or 0\) }.  
    * **Guideline Logic:** FNMA\_GUIDELINES.  
12. **Short Sale Net Proceeds & Deficiency Estimator:**

    * **Purpose:** Estimates the net proceeds to the lender from a short sale and the resulting deficiency.  
    * **Inputs:** Estimated property sale price, estimated total selling costs (e.g., commissions, closing costs, repairs, subordinate lien payoffs), Unpaid Principal Balance (UPB), accrued interest, other advances/costs owed.  
    * **Outputs:** Estimated net proceeds, estimated deficiency amount.  
    * **Guideline Logic:** Implicit for short sale evaluations; deficiency waiver also relevant.  
13. **(Conceptual) Affordability Calculator for Loan Modifications:**

    * **Purpose:** A more holistic calculator to assess if a proposed modified PITI is affordable, often by targeting a percentage of GMI. This synthesizes outputs from other calculators (like income, trial PITI).  
    * **Inputs:** GMI (potentially including grossed-up non-taxable income), proposed modified PITI, other monthly debts (optional, for total DTI).  
    * **Output:** Housing DTI with new payment, potentially Total DTI with new payment.  
    * **Guideline Logic:** While not a single formula here, it's the goal of modifications like the Flex Mod.

**Implementation Guidelines for Replit AI:**

* Place all calculator functions in the new `FinancialCalculatorService.ts`.  
* Export these functions.  
* For each function, include JSDoc-style comments explaining its purpose, parameters, return value, and citing the specific source(s) from `Fannie Mae Guidelines.txt` that govern its logic.  
* Ensure calculations involving currency are handled carefully (e.g., work with cents or use a decimal library if precision is critical, though standard number types should be fine for now if managed well).  
* Write unit tests for each calculator if possible (you can outline where these would go or provide example test cases).

Please proceed with generating the `FinancialCalculatorService.ts` with these functions. We can then create controller endpoints and frontend integrations in subsequent steps."

**Important Consideration for Future Extensibility:** While the primary focus of this task is to implement calculators based on the provided 'Fannie Mae Guidelines.txt', please design the `FinancialCalculatorService.ts` and its functions with future extensibility for other loan types (e.g., FHA, VA) in mind.

* Consider how a `loanType` parameter could eventually be incorporated into the function signatures or internal logic.  
* If specific Fannie Mae thresholds or rules are hardcoded, add comments indicating that these might need to become variable based on `loanType` in a future iteration.  
* Also, please advise on the best place to add a `loan_type` field (e.g., Enum: 'Conventional', 'FHA', 'VA', 'USDA', 'Other') in our existing database schema (`shared/schema.ts`), likely within the `transactions` or `uba_form_data` tables, so we can start capturing this information. ..."

