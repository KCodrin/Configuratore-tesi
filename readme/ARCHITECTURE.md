# Thesis Configurator - Project Architecture (v1.3 - Full Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THESIS CONFIGURATOR (REACT PROTOTYPE)                    │
│                              Version 1.3                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER (Full Flow)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ STEP 1   │→ │ STEP 2   │→ │ STEP 3   │→ │ STEP 4   │→ │ STEP 5   │     │
│  │          │  │          │  │          │  │          │  │          │     │
│  │ Upload   │  │ Paper &  │  │ Page     │  │ Binding  │  │ Extra    │     │
│  │ PDF      │  │ Printing │  │ Colors   │  │ Preview  │  │ Options  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                    ↓         │
│                                                             ┌──────────┐     │
│                                                             │ STEP 6   │     │
│                                                             │          │     │
│                                                             │ Review & │     │
│                                                             │ Preview  │     │
│                                                             └──────────┘     │
│                                                                    ↓         │
│                                                             ┌──────────┐     │
│                                                             │ STEP 7   │     │
│                                                             │          │     │
│                                                             │ Checkout │     │
│                                                             └──────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA MANAGEMENT LAYER (React State & localStorage)    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     Main Component State `App.tsx`                 │    │
│  │  • `useState` for `currentStep`.                                   │    │
│  │  • `thesisFile`, `frontispieceFile`: Contain the uploaded PDF files. │    │
│  │  • `totalPages`: Number of pages in the thesis PDF.                │    │
│  │  • `thesisPreviewUrl`: Preview URL for Step 1 and 2.               │    │
│  │  • `isStepValid`: Manages the navigation button states.            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   Local State & Persistence (`localStorage`)       │    │
│  │  • Step components manage their own state with `useState`.         │    │
│  │  • **All configuration data** (paper, quantity, page colors,       │    │
│  │    binding, extra options, checkout data) are saved in             │    │
│  │    `localStorage` for persistence across sessions and steps.       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         Static & External Resources                │    │
│  │  • Cover textures: `/public/textures/`.                            │    │
│  │  • `pdf.js` library via CDN for rendering PDF previews.            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              FILE MAPPING
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ AREA                           │ FILES                                      │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Entrypoint & HTML Shell        │ index.html, index.tsx                      │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Main Container/Router          │ App.tsx                                    │
├────────────────────────────────┼────────────────────────────────────────────┤
│                                │ components/steps/Step1Upload.tsx           │
│                                │ components/steps/Step2Paper.tsx            │
│ Step Components                │ components/steps/Step3PageColors.tsx       │
│                                │ components/steps/Step4Binding.tsx          │
│                                │ components/steps/Step5ExtraOptions.tsx     │
│                                │ components/steps/Step6Review.tsx           │
│                                │ components/steps/Step7Checkout.tsx         │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Static Assets                  │ public/textures/* (.webp, .jpg images)     │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Documentation                  │ GUIDE.md, ARCHITECTURE.md                  │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Metadata                       │ metadata.json                              │
└────────────────────────────────┴────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                        DATA FLOW DIAGRAMS (PER STEP)
═══════════════════════════════════════════════════════════════════════════════

---
### DATA FLOW DIAGRAM (Step 1 - Upload)

**USER INPUT (`Step1Upload`)**           **PROCESSING (`Step1Upload` via `pdf.js`)**   **STATE (`App.tsx`) & UI OUTPUT**
    │                                     │                                  │
    │ Selects/Drops Thesis.pdf            │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                    `handleFileSelect(file)`                            │
    │───────────────────────────────────→ │ `generatePdfPreview(file)`       │
    │                                     │ • Displays `isLoading = true`    │
    │                                     │ • Reads the PDF with `pdf.js`    │
    │                                     ├──────────────────────────────────┤
    │                                     │ • Extracts `numPages`            → `setTotalPages(numPages)`
    │                                     │ • Renders page 1 to canvas       │
    │                                     │ • Converts canvas to data:URL    → `setThesisPreviewUrl(url)`
    │                                     ├──────────────────────────────────┤
    │                                     │ • `setIsLoading(false)`          │
    │                                     │                                  ↓
    │                                     │                                `setThesisFile(file)`
    │                                     │                                  │
    │ Selects/Drops CoverPage.pdf         │                                  │
    ├──────────────────┐                  │ (Same `generatePdfPreview` process but without `setTotalPages`)
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  ↓
    │                `handleFrontispieceFileSelect(file)`──────────────────→ `setFrontispieceFile(file)`
    ↓                                     ↓                                  ↓
**User Interface**                     **Component Logic**                  **Global State & UI**
(Displays previews and filenames.      (Manages loading state               (Holds files and data,
Enables "Next" button when             and calls to `pdf.js`)               enables navigation)
both files are loaded)

---
### DATA FLOW DIAGRAM (Step 2 - Paper & Printing)

**USER INPUT (`Step2Paper`)**           **STATE & PROCESSING (`Step2Paper`)**      **DATA SINK (`localStorage`) & UI OUTPUT**
    │                                     │                                  │
    │ Toggles Double-Sided                │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                     `setIsFrontAndBack(bool)`                          │
    │───────────────────────────────────→ │ `useMemo` recalculates           │
    │                                     │ `effectiveTotalPages` and        │
    │ Selects paper type                  │ `frontAndBackSheets`.            │
    ├──────────────────┐                  ├──────────────────────────────────┤
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  ↓
    │                    `setSelectedPaper(value)`─────────────┐             `useEffect` writes to `localStorage`:
    │                                     │                    ├───────────→ • `copieFronteRetro` (doubleSided)
    │ Changes quantity                    │                    │             • `frontespizioInterno` (internalCover)
    ├──────────────────┐                  │                    │             • `cartaInterna` (paperType)
    │                  └──────────┐       │                    │             • `quantita` (quantity)
    │                             ↓       │                    │             • `bnPrice` / `colorPrice`
    │                    `setQuantity(num)`────────────────────┘             │
    │                                     │                                  │
    │                                     │ (On Mount) `useEffect` reads     │
    │                                     │ initial values from `localStorage`│
    │                                     │ to populate the state.           │
    ↓                                     ↓                                  ↓
**User Interface**                     **Local State & Logic**              **Data Persistence & UI**
(Updates toggles, radios, input.       (Calculates totals and manages       (Data is saved for subsequent
Displays the updated summary)          selection state)                     steps)

---
### DATA FLOW DIAGRAM (Step 3 - Page Colors)

**USER INPUT (`Step3PageColors`)**      **PROCESSING (`Step3PageColors` via `pdf.js`)** **STATE (`Step3PageColors`) & `localStorage`**
    │                                     │                                  │
    │ Clicks "B/W" or "Color"             │ (On Mount / Click "Automatic")   │
    ├──────────────────┐                  │ `runAutoDetection()`             │
    │                  └──────────┐       │ • Displays `isLoading...`        │
    │                             ↓       │ • Iterates through PDF pages     │
    │                 `handlePageColorChange(idx, val)` │ • Renders on canvas         → `setPagePreviews([...])`
    │───────────────────────────────────→ │ • Analyzes pixels for color      │
    │ Clicks "All B/W" / "All Color"      │                                  ↓
    ├──────────────────┐                  │                                `setPageColors([...])`
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  ↓
    │                    `handleSetAll(val)`│ `useEffect` triggered by `pageColors`
    │                                     │ • Checks for double-sided conflicts → `setConflict(...)`
    │                                     │ • Calls `onValidationChange`   → Updates `App.tsx`
    │                                     ├──────────────────────────────────┤
    │                                     │                                  ↓
    │                                     │ `useMemo` calculates costs       `useEffect` writes to `localStorage`:
    │                                     ├──────────────────────────────────→ • `pageColors`
    │                                     │                                  • `bnPages` / `colorPages`
    ↓                                     ↓                                  ↓
**User Interface**                     **Logic & Image Analysis**           **State, Persistence & UI**
(Updates grid, shows conflict         (Performs automatic analysis,        (Summary and Price Estimate
banner, disables "Next" button        calculates costs, and validates state) update in real-time)
if invalid)

---
### DATA FLOW DIAGRAM (Step 4 - Binding & Preview)

**USER INPUT (`Step4Binding`)**         **STATE & PROCESSING (`Step4Binding`)**      **DATA SINK (`localStorage`) & UI OUTPUT**
    │                                     │                                  │
    │ Selects Package                     │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                   `handlePacchettoChange(val)`                         │
    │───────────────────────────────────→ │ `useMemo` calculates available   │
    │                                     │ `finituraGroups` and `varianti`. │
    │ Selects Material/Color              │ `useMemo` recalculates `pricing` │
    ├──────────────────┐                  │ (cover cost, discounts, total)   │
    │                  └──────────┐       ├──────────────────────────────────┤
    │                             ↓       │                                  ↓
    │             `setSelected...(val)`───┐                                  `useEffect` writes to `localStorage`:
    │                                     │ `useEffect` (on Mount) reads     ├─→ • `pacchetto`, `rivestimentoGruppo`,
    │                                     │ values from `localStorage`.      │   `coloreCopertina`, `laminazione`
    │                                     │                                  │ • `totalCost` (calculated)
    │                                     │ `useEffect` generates transparent│
    │                                     │ preview of the cover page.       │
    ↓                                     ↓                                  ↓
**User Interface**                     **Local State & Calculations**       **Persistence & Dynamic Preview**
(Updates available options,            (Manages cascading selections        (Preview updates with texture
summary, and price estimate)           and calculates costs in real-time)   and lamination; data is saved)

---
### DATA FLOW DIAGRAM (Step 5 - Extra Options)

**USER INPUT (`Step5ExtraOptions`)**   **STATE & PROCESSING (`Step5ExtraOptions`)** **DATA SINK (`localStorage`) & UI OUTPUT**
    │                                     │                                  │
    │ Toggles "Metal corners"             │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                      `setHasAngoli(bool)`                              │
    │───────────────────────────────────→ │ `useMemo` recalculates           │
    │                                     │ • `extraOptionsTotal`            │
    │ Selects Custom Application          │ • `finalTotal` (from Step 4's    │
    ├──────────────────┐                  │   `totalCost` + extras)          │
    │                  └──────────┐       ├──────────────────────────────────┤
    │                             ↓       │                                  ↓
    │              `handleApplicationChange(id)` ──────────────┐             `useEffect` writes to `localStorage`:
    │                                     │                    ├───────────→ • `optAngoli`, `opt[AppName]`
    │                                     │ `useEffect` (on Mount) reads     │ • `finalTotal` (updated)
    │                                     │ values from `localStorage`.      │
    ↓                                     ↓                                  ↓
**User Interface**                     **Local State & Calculations**       **Data Persistence & UI**
(Updates toggle and selection cards.   (Adds extra costs to the previous   (Summary and Price Estimate
Displays updated price estimate)       total)                               are updated)

---
### DATA FLOW DIAGRAM (Step 6 - Review & Flipbook)

**USER INPUT (`Step6Review`)**         **STATE & PROCESSING (`Step6Review` via `pdf.js`)** **UI OUTPUT (Modal)**
    │                                     │                                  │
    │ Clicks "Open preview"               │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                       `openModal()` │ `useEffect` (on modal open)      │
    │───────────────────────────────────→ │ • Displays `isLoadingPages=true` │
    │                                     │ • Reads all config data from `localStorage`│
    │                                     │ • `generatePagePreviews()`       │
    │                                     │   (iterates PDF, renders, creates URL) → `setPageImageUrls([...])`
    │                                     ├──────────────────────────────────┤
    │                                     │ • `generateCoverFrontispiece()`  → `setFrontispieceForCoverUrl(url)`
    │                                     │ • `setIsLoadingPages(false)`     │
    │                                     │                                  ↓
    │ Navigates with arrows/clicks        │ `useMemo` recalculates `flipbookSheets` │
    ├──────────────────┐                  │ based on `currentPage`.          │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                 `nextPage()` / `prevPage()`                            │
    │───────────────────────────────────→ │ `setCurrentPage(..)` state updated │
    ↓                                     ↓                                  ↓
**User Interface**                     **Component Logic & `pdf.js`**       **Interactive Flipbook**
(Opens modal, displays the book        (Generates all page and cover        (Shows cover and pages
and rendered pages)                    previews)                            with correct color filters)

---
### DATA FLOW DIAGRAM (Step 7 - Checkout)

**USER INPUT (`Step7Checkout`)**       **STATE (`Step7Checkout`)**          **DATA SINK (`localStorage`) & `App.tsx`**
    │                                     │                                  │
    │ Fills out form fields               │                                  │
    ├──────────────────┐                  │                                  │
    │                  └──────────┐       │                                  │
    │                             ↓       │                                  │
    │                       `handleChange(e)`                                │
    │───────────────────────────────────→ │ `setFormData({...})`             │
    │                                     ├──────────────────────────────────┤
    │                                     │                                  ↓
    │ Checks "Accept Privacy"             │ `useEffect` (on Mount)           `useEffect` (on `formData` change)
    ├──────────────────┐                  │ • Reads all config data from     ├─→ `localStorage.setItem('checkoutForm', ...)`
    │                  └──────────┐       │   `localStorage` → `setSummary`  │
    │                             ↓       │ • Reads `checkoutForm` from `localStorage` → `setFormData`
    │                   `setPrivacyAccepted(bool)`                           │
    │───────────────────────────────────→ │ `onValidationChange(bool)`───────→ Enables/Disables the "Proceed to
    │                                     │                                  Payment" button in `App.tsx`
    ↓                                     ↓                                  ↓
**User Interface**                     **Local State**                      **Persistence & Global State**
(Populates forms, displays the        (Maintains form data and              (Saves form data to prevent loss,
complete order summary)                validation state)                    controls final navigation)

═══════════════════════════════════════════════════════════════════════════════
                         SECURITY LAYERS (Frontend)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Frontend (Browser)                                                           │
│  ✓ File type validation (only `application/pdf`).                            │
│  ✓ Required field checks (`disabled` logic on navigation buttons).           │
│  ✓ Validation of double-sided conflicts in Step 3.                           │
│  ✓ Payment blocked without privacy acceptance in Step 7.                     │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
               Legend: → Data Flow  |  ↓ Next Step
═══════════════════════════════════════════════════════════════════════════════
