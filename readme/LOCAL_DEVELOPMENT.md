# Local Development Guide

This document provides instructions for setting up and running the "Thesis Configurator" project on your local machine for development purposes.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js**: Version 18.x or later. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm** (Node Package Manager) or **yarn**: They are automatically installed with Node.js.

## 2. Installation

1.  **Clone the repository** (or download the project files) to a folder of your choice.

2.  **Open a terminal** or command prompt and navigate to the project's root folder.

3.  **Install the project dependencies**. This project has no `npm` production dependencies as it relies on CDNs, but there may be development dependencies in the future. Run:

    ```bash
    npm install
    ```
    *(Even if there are no dependencies at the moment, this is good practice).*

## 3. Starting the Development Server

The project is configured to be served statically, but for a smooth development experience, using a simple local server is recommended.

You can use `Vite`, which is a fast and modern frontend development tool.

1.  **Install Vite** (if you haven't already, either globally or as a dev dependency):
    ```bash
    npm install -g vite
    ```

2.  **Start the development server** from the project's root folder:
    ```bash
    vite
    ```

3.  The terminal will show an output similar to this:

    ```
      VITE v5.x.x  ready in xxx ms

      ➜  Local:   http://localhost:5173/
      ➜  Network: use --host to expose
    ```

4.  **Open your browser** and navigate to `http://localhost:5173` (or the address shown in your terminal).

You should now see the "Thesis Configurator" application running. The Vite development server includes Hot Module Replacement (HMR), so any changes you save in the source files (`.tsx`, `.html`, etc.) will be instantly reflected in the browser without needing to reload the page.

## 4. Relevant File Structure

-   **`index.html`**: The main HTML file. It contains links to the CDNs for React, TailwindCSS, `pdf.js`, and initial configurations.
-   **`src/`**: The folder containing all the React/TypeScript source code.
    -   **`index.tsx`**: The entry point of the React application.
    -   **`App.tsx`**: The main component that manages the step logic.
    -   **`components/`**: Contains all reusable components and the components specific to each step.
-   **`public/`**: Contains static assets, such as the texture images for the covers.
