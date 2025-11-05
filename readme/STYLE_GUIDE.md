# Style Guide - Thesis Configurator

This document defines the style conventions for code, components, and the user interface to ensure the project's consistency and maintainability.

## 1. General Principles

-   **Component-Based**: The application is structured into React components. Each step is a component, and reusable UI elements (like `ToggleSwitch`) are separate components.
-   **Functional Components & Hooks**: Exclusively use functional components with React hooks (`useState`, `useEffect`, `useMemo`, etc.).
-   **DRY (Don't Repeat Yourself)**: Avoid code duplication. Create reusable components or helper functions when logic or a UI is used multiple times.
-   **Language**: All user-facing text (UI, messages, alerts) must be in **Italian**. Code comments and documentation can be in Italian or English, but must be consistent.

## 2. TypeScript

-   **Strict Typing**: Make full use of TypeScript's type system. Define interfaces (`interface`) or types (`type`) for component props and complex data structures.
-   **Avoid `any`**: The use of `any` is discouraged. If necessary, prefer `unknown` and perform type checks.
-   **Type Naming**: Interface and type names should follow the `PascalCase` convention (e.g., `interface Step1UploadProps`).

## 3. React Components

-   **Naming**: Component files should be named in `PascalCase.tsx` (e.g., `Step1Upload.tsx`).
-   **File Structure**: Follow this structure for better readability:
    1.  `import` React and other libraries.
    2.  `import` child components and other local modules.
    3.  Define `interface` for props.
    4.  Define constants or data specific to the component.
    5.  Define the functional component.
    6.  `export default` the component.
-   **Props**: Props must always be typed. Use destructuring to access props within the component.

```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  // ... component logic
  return (
    <div>{title}</div>
  );
};

export default MyComponent;
```

## 4. Styling with TailwindCSS

-   **Utility-First**: Prioritize the use of Tailwind's utility classes directly in the HTML/JSX.
-   **Configuration in `index.html`**: The Tailwind configuration (colors, fonts, etc.) is defined in the script tag in `index.html`. Any new theme customizations must be added there.
-   **Theme Colors**: Always use the colors defined in the theme to ensure consistency and facilitate theming (light/dark mode).
    -   **Incorrect**: `class="bg-blue-500"`
    -   **Correct**: `class="bg-primary"`
-   **Custom CSS**: Custom CSS is allowed only for complex styles that are not easily achievable with Tailwind utilities (e.g., the gradient border in `Step3PageColors` or the flipbook animations in `Step6Review`). This CSS should be placed in the `<style>` tag in `index.html` to keep everything centralized.
-   **Responsive Design**: Use Tailwind's prefixes (`sm:`, `md:`, `lg:`) to create responsive layouts.

## 5. Icons

-   **Library**: Exclusively use [Material Symbols Outlined](https://fonts.google.com/icons) by Google.
-   **Implementation**: Icons are included via the `<link>` tag in `index.html` and used with a `<span>` element:

```html
<span class="material-symbols-outlined">settings</span>
```

-   **Style**: The base style (weight, fill) is defined in the custom CSS in `index.html`.

## 6. Naming and Conventions

-   **Variables and Functions**: Use `camelCase` (e.g., `handleFileSelect`).
-   **Components and Types**: Use `PascalCase` (e.g., `Step1Upload`, `Step1UploadProps`).
-   **HTML IDs**: Use `kebab-case` (e.g., `id="chk-privacy"`).
-   **Custom CSS Classes**: Use `kebab-case` (e.g., `.page-card`).
