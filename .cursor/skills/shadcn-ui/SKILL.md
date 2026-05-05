---
name: shadcn-ui
description: Expert guidance for shadcn/ui on Next.js (App Router). Discover, install, customize, and optimize components; paths follow `components/ui` and `lib/utils` at project root unless the repo uses `src/`.
trigger:
  - when user mentions "shadcn"
  - when user asks to "add component"
  - when implementing forms/modals/ui kit
priority: medium
requires:
  - project-architecture
---

# shadcn/ui Component Integration

You are a frontend engineer specialized in building applications with shadcn/ui—a collection of beautifully designed, accessible, and customizable components built with Radix UI or Base UI and Tailwind CSS. You help developers discover, integrate, and customize components following best practices.

## Core Principles

shadcn/ui is **not a component library**—it's a collection of reusable components that you copy into your project. This gives you:
- **Full ownership**: Components live in your codebase, not node_modules
- **Complete customization**: Modify styling, behavior, and structure freely
- **No version lock-in**: Update components selectively at your own pace
- **Zero runtime overhead**: No library bundle, just the code you need

## Component Discovery and Installation

### 1. Browse Available Components
Prefer official docs + project-local conventions:
- Check whether the repo already uses shadcn/ui (look for `components.json`, `components/ui/`, `lib/utils.ts`, or the `src/` equivalents).
- If shadcn is not initialized yet, initialize it first (see setup below).

### 2. Component Installation
There are two approaches to adding components:

**A. Direct Installation (Recommended)**
```bash
npx shadcn@latest add [component-name]
```

This command:
- Downloads the component source code
- Installs required dependencies
- Places files in `components/ui/` (Next.js default) or `src/components/ui/` if the project uses a `src/` root
- Updates your `components.json` config

#### Auto-install policy (PROJECT-SPECIFIC OVERRIDE)
If the user asks to use a shadcn/ui component and it is **not present** in `components/ui/` (or `src/components/ui/`),
the agent MUST **ask the user to approve installation** before running the CLI command below (do not run it automatically):

```bash
npx shadcn@latest add <component-name>
```

Rules:
- **Do not** manually recreate/hand-write a "shadcn-like" component as a substitute if shadcn/ui provides it.
- If the user does not approve installing the component, stop and ask what alternative they want (custom component vs different UI approach).
- If `shadcn add` does not provide that component, stop and report that it is unavailable via CLI,
  then propose alternatives only after the user decides.

**B. Manual Integration**
1. Use `get_component` to retrieve the source code
2. Create the file in `components/ui/[component-name].tsx`
3. Install peer dependencies manually
4. Adjust imports if needed

### 3. Registry and Custom Registries
If working with a custom registry:
- Use `get_project_registries` to list available registries
- Use `list_items_in_registries` to see registry-specific components
- Use `view_items_in_registries` for detailed component information
- Use `search_items_in_registries` to find specific components

## Project Setup

### Initial Configuration
For **new projects**, use the `create` command:

```bash
npx shadcn@latest create
```

For **existing projects**, initialize configuration:

```bash
npx shadcn@latest init
```

This creates `components.json` with your configuration:
- **style**: default, new-york, Vega, Nova, Maia, Lyra, Mira
- **baseColor**: slate, gray, zinc, neutral, stone
- **cssVariables**: true/false for CSS variable usage
- **tailwind config**: paths to Tailwind files
- **aliases**: import path shortcuts
- **rsc**: Use `true` for **Next.js App Router** (Server Components supported). Use `false` only for pure client SPAs.

### Required Dependencies
shadcn/ui components require:
- **React** (18+)
- **Tailwind CSS** (3.0+)
- **Primitives**: Radix UI OR Base UI
- **class-variance-authority** (for variant styling)
- **clsx** and **tailwind-merge** (for class composition)

## Component Architecture

### File Structure (Next.js, root layout)
```
components/
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── form.tsx
```

If the repo uses `src/`, mirror under `src/components/ui/`.

### The `cn()` Utility
Always use the `cn()` utility for class merging:

```tsx
import { cn } from "@/lib/utils"

function MyComponent({ className, ...props }) {
  return (
    <div className={cn("base-classes", className)} {...props} />
  )
}
```

## Customization Best Practices

### 1. Theme Customization
Customize your theme in the global stylesheet (commonly `app/globals.css` in Next.js, or `src/index.css` if using a `src/` app) using CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --radius: 0.5rem;
}
```

### 2. Component Variants
Use `class-variance-authority` for variant management:

```tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### 3. Extending Components
Extend existing components without modifying source:

```tsx
import { Button } from "@/components/ui/button"

function LoadingButton({ isLoading, children, ...props }) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  )
}
```

## Common Patterns

### Form Building
```tsx
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function LoginForm() {
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="email@example.com" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit">Submit</Button>
    </Form>
  )
}
```

### Dialog/Modal Patterns
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p>This action cannot be undone.</p>
      </DialogContent>
    </Dialog>
  )
}
```

## Accessibility
shadcn/ui components are built on Radix UI primitives which provide:
- **Keyboard navigation**: Full keyboard support out of the box
- **Screen reader support**: Proper ARIA attributes
- **Focus management**: Correct focus trapping in modals
- **Color contrast**: Meets WCAG 2.1 AA standards

## Troubleshooting

### Import Errors
```
Module not found: Can't resolve '@/components/ui/button'
```
**Solution**: Ensure `tsconfig.json` path aliases match the shadcn installer. Typical **Next.js (no src/)**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```
With `src/`, use `"@/*": ["./src/*"]`.

### Style Conflicts
If Tailwind classes aren't applying correctly:
1. Ensure Tailwind **content** includes `./app/**/*`, `./components/**/*`, and `./lib/**/*` (and `./src/**/*` if applicable)—follow the project's Tailwind v3/v4 setup.
2. Ensure the global CSS file is imported from `app/layout.tsx` (Next.js).
3. Verify `tailwind-merge` is installed

### Version Compatibility
Always check version compatibility:
- **shadcn**: `npx shadcn@latest info`
- **Radix UI packages**: Use consistent versions
- **Tailwind CSS**: Must be 3.0+
