# Technical Implementation Summary

This document provides a technical overview of the logic and technologies used in the "Thesis Configurator" project.

## 1. Technology Stack

-   **Frontend Framework**: React 19
-   **Language**: TypeScript
-   **Styling**: TailwindCSS (configured via CDN with JIT compiler)
-   **PDF Manipulation**: `pdf.js` (loaded via CDN)

## 2. Project Structure

The application is a Single Page Application (SPA) whose main state is managed by the `App.tsx` component.

-   **`App.tsx` (Main Component)**:
    -   Acts as a simple state-based "router", rendering the current step's component (`currentStep`).
    -   Manages the "global" state that needs to be passed between steps, such as the `File` objects for the thesis and cover page (`thesisFile`, `frontispieceFile`) and the total number of pages (`totalPages`).
    -   Controls the navigation logic (next/previous) and the enabling of footer buttons.

-   **`components/steps/`**:
    -   Each file in this folder represents a step in the configurator.
    -   Each step component is largely autonomous: it manages its own internal state (`useState`) and reads the necessary data from previous steps directly from `localStorage`.
    -   Upon completing its operations, each step saves its choices to `localStorage` to make them available for subsequent steps.

## 3. State Management and Persistence

Data management is based on a two-tier strategy:

1.  **Local React State**: Used for UI reactivity within each individual component (e.g., `useState` to manage the opening of an accordion or the selection of an option).
2.  **`localStorage`**: This is the primary persistence mechanism. It is used as a client-side "database" to:
    -   **Maintain state between sessions**: The user can close and reopen the browser without losing their configuration.
    -   **Pass data between steps**: Each step reads the configurations from the previous steps and writes its own, creating a sequential data flow.

For a complete map of the keys used, refer to the **[DATA_PERSISTENCE.md](./DATA_PERSISTENCE.md)** file.

## 4. Key Implemented Logic

### PDF Rendering and Analysis (`pdf.js`)

-   **Preview Generation**: Used in `Step1Upload`, `Step3PageColors` (for the grid), `Step4Binding` (for the cover), and `Step6Review` (for the flipbook). PDF pages are rendered onto a `<canvas>` element and then converted to a `data:URL` (PNG or JPEG format).
-   **Color Detection (Step 3)**: Each page is rendered on a canvas, and its pixels are analyzed via `context.getImageData()` to determine if the page is in color or black and white, automating the choice for the user.
-   **Cover Page Transparency (Step 4 & 6)**: For the cover preview, the cover page is rendered, and its background color (usually white) is programmatically made transparent, allowing the underlying texture to be visible.

### Real-time Price Calculation

-   The cost is calculated progressively.
-   Each step that introduces a cost (2, 3, 4, 5) reads the partial total from the previous step, adds its own costs, and saves the new total to `localStorage` (`totalCost`, then `finalTotal`).
-   The `useMemo` hook is extensively used to efficiently recalculate costs only when dependencies (e.g., quantity, paper type, number of color pages) change.

### Validation Logic

-   **Navigation**: The "Next Step" button in `App.tsx` is disabled based on an `isStepValid` state.
-   **Step 1**: Validation requires both PDF files to be uploaded.
-   **Step 3**: This is the most complex validation. The button is disabled if a "double-sided conflict" exists (pages on the same sheet with different color settings). The `Step3PageColors` component communicates its validity status to `App.tsx` via the `onValidationChange` prop.
-   **Step 7**: The "Proceed to Payment" button is disabled until the privacy policy checkbox is accepted. Here too, communication occurs via `onValidationChange`.

### Interactive Preview (Flipbook - Step 6)

-   Simulates a 3D book using CSS (`perspective`, `transform: rotateY(-180deg)`).
-   Pages are generated "on-demand" when the modal is opened to avoid impacting the performance of other steps.
-   The `currentPage` state tracks the displayed page and applies the correct CSS classes to "turn" the pages.
-   The cover and internal pages dynamically apply all the styles and color filters configured by the user in the previous steps.
