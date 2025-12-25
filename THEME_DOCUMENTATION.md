# Frontend Theme Documentation

This document contains all the theme details from the lawyer-app frontend that you can use to replicate the same design in your PC application.

## Design System Overview

**UI Framework:** shadcn/ui (built on Radix UI + Tailwind CSS)
**Base Color Scheme:** Neutral
**Theme Provider:** next-themes (supports light/dark mode)
**Icon Library:** Lucide React

---

## 1. Typography

### Font Families

- **Body Font:** Inter (`--font-inter`)
  - Used for: Body text, paragraphs, general content
  - CSS Variable: `var(--font-inter)`
  - Fallback: `sans-serif`

- **Heading Font:** Lato (`--font-lato`)
  - Used for: All headings (h1, h2, h3, h4, h5, h6)
  - CSS Variable: `var(--font-lato)`
  - Fallback: `sans-serif`

### Font Loading
```css
:root {
  --font-inter: "Inter", sans-serif;
  --font-lato: "Lato", sans-serif;
}
```

---

## 2. Color Palette

### Light Mode Colors (HSL Format)

All colors use HSL (Hue, Saturation, Lightness) format for easy theme switching.

#### Base Colors
```css
--background: 0 0% 100%;              /* White */
--foreground: 222.2 84% 4.9%;         /* Dark blue-gray text */
--card: 0 0% 100%;                     /* White cards */
--card-foreground: 222.2 84% 4.9%;     /* Dark text on cards */
--popover: 0 0% 100%;                  /* White popovers */
--popover-foreground: 222.2 84% 4.9%;  /* Dark text in popovers */
```

#### Primary Colors
```css
--primary: 222.2 47.4% 11.2%;          /* Dark blue-gray primary */
--primary-foreground: 210 40% 98%;     /* Light text on primary */
```

#### Secondary Colors
```css
--secondary: 210 40% 96%;              /* Light gray-blue */
--secondary-foreground: 222.2 84% 4.9%; /* Dark text on secondary */
```

#### Muted Colors
```css
--muted: 210 40% 96%;                  /* Light gray-blue muted */
--muted-foreground: 215.4 16.3% 46.9%; /* Medium gray text */
```

#### Accent Colors
```css
--accent: 210 40% 96%;                 /* Light gray-blue accent */
--accent-foreground: 222.2 84% 4.9%;   /* Dark text on accent */
```

#### Destructive/Error Colors
```css
--destructive: 0 84.2% 60.2%;          /* Red for errors/destructive actions */
--destructive-foreground: 210 40% 98%; /* Light text on destructive */
```

#### Border & Input Colors
```css
--border: 214.3 31.8% 91.4%;           /* Light gray borders */
--input: 214.3 31.8% 91.4%;            /* Light gray input borders */
--ring: 222.2 84% 4.9%;                /* Dark focus ring */
```

#### Sidebar Colors
```css
--sidebar-background: 0 0% 98%;        /* Very light gray sidebar */
--sidebar-foreground: 240 5.3% 26.1%;  /* Dark gray sidebar text */
--sidebar-primary: 240 5.9% 10%;       /* Very dark sidebar primary */
--sidebar-primary-foreground: 0 0% 98%; /* Light text on sidebar primary */
--sidebar-accent: 240 4.8% 95.9%;      /* Light gray sidebar accent */
--sidebar-accent-foreground: 240 5.9% 10%; /* Dark text on sidebar accent */
--sidebar-border: 220 13% 91%;         /* Light gray sidebar border */
--sidebar-ring: 217.2 91.2% 59.8%;     /* Blue sidebar ring */
```

#### Chart Colors
```css
--chart-1: 12 76% 61%;    /* Orange */
--chart-2: 173 58% 39%;   /* Teal */
--chart-3: 197 37% 24%;   /* Dark blue */
--chart-4: 43 74% 66%;    /* Yellow */
--chart-5: 27 87% 67%;    /* Orange-red */
```

### Dark Mode Colors

```css
.dark {
  --background: 222.2 84% 4.9%;        /* Dark blue-gray background */
  --foreground: 210 40% 98%;           /* Light text */
  --card: 222.2 84% 4.9%;              /* Dark cards */
  --card-foreground: 210 40% 98%;       /* Light text on cards */
  --popover: 222.2 84% 4.9%;            /* Dark popovers */
  --popover-foreground: 210 40% 98%;    /* Light text in popovers */
  --primary: 210 40% 98%;               /* Light primary */
  --primary-foreground: 222.2 47.4% 11.2%; /* Dark text on primary */
  --secondary: 217.2 32.6% 17.5%;      /* Dark gray-blue */
  --secondary-foreground: 210 40% 98%; /* Light text on secondary */
  --muted: 217.2 32.6% 17.5%;          /* Dark gray-blue muted */
  --muted-foreground: 215 20.2% 65.1%; /* Medium gray text */
  --accent: 217.2 32.6% 17.5%;         /* Dark gray-blue accent */
  --accent-foreground: 210 40% 98%;    /* Light text on accent */
  --destructive: 0 62.8% 30.6%;         /* Darker red */
  --destructive-foreground: 210 40% 98%; /* Light text on destructive */
  --border: 217.2 32.6% 17.5%;         /* Dark borders */
  --input: 217.2 32.6% 17.5%;          /* Dark input borders */
  --ring: 212.7 26.8% 83.9%;           /* Light focus ring */
  
  /* Chart colors remain the same */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
  
  /* Sidebar colors */
  --sidebar-background: 240 5.9% 10%;  /* Very dark sidebar */
  --sidebar-foreground: 240 4.8% 95.9%; /* Light sidebar text */
  --sidebar-primary: 224.3 76.3% 48%;   /* Blue sidebar primary */
  --sidebar-primary-foreground: 0 0% 100%; /* White text */
  --sidebar-accent: 240 3.7% 15.9%;    /* Dark sidebar accent */
  --sidebar-accent-foreground: 240 4.8% 95.9%; /* Light text */
  --sidebar-border: 240 3.7% 15.9%;    /* Dark sidebar border */
  --sidebar-ring: 217.2 91.2% 59.8%;   /* Blue sidebar ring */
}
```

### Custom Status Colors (Hex Format)

```css
/* Pending Status */
--statusPendingBg: #FFFBEB;      /* Light yellow background */
--statusPendingText: #F59E0B;    /* Amber text */
--statusPendingBorder: #FDE68A;  /* Light yellow border */

/* Neutral Status */
--statusNeutralBg: #F3F4F6;      /* Gray-100 background */
--statusNeutralText: #374151;    /* Gray-800 text */
--statusNeutralBorder: #E5E7EB;  /* Gray-200 border */
```

---

## 3. Border Radius

```css
--radius: 0.5rem;  /* 8px base radius */
```

**Border Radius Scale:**
- `lg`: `var(--radius)` = 0.5rem (8px)
- `md`: `calc(var(--radius) - 2px)` = 6px
- `sm`: `calc(var(--radius) - 4px)` = 4px

---

## 4. Spacing & Layout

### Container Settings
```typescript
container: {
  center: true,
  padding: "2rem",  /* 32px */
  screens: {
    "2xl": "1400px",
  },
}
```

---

## 5. Animations

### Accordion Animations
```css
@keyframes accordion-down {
  from: { height: 0 }
  to: { height: var(--radix-accordion-content-height) }
}

@keyframes accordion-up {
  from: { height: var(--radix-accordion-content-height) }
  to: { height: 0 }
}

animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
}
```

---

## 6. Tailwind CSS Configuration

### Key Dependencies
- **Tailwind CSS:** ^3.4.17
- **tailwindcss-animate:** ^1.0.7
- **class-variance-authority:** ^0.7.1
- **clsx:** ^2.1.1
- **tailwind-merge:** ^2.5.5

### Dark Mode
- **Mode:** Class-based (`darkMode: ["class"]`)
- Toggle by adding/removing `dark` class on root element

### Content Paths
```typescript
content: [
  "./pages/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./app/**/*.{ts,tsx}",
  "./src/**/*.{ts,tsx}",
  "*.{js,ts,jsx,tsx,mdx}",
]
```

---

## 7. Component Library Details

### shadcn/ui Configuration
```json
{
  "style": "default",
  "baseColor": "neutral",
  "cssVariables": true,
  "iconLibrary": "lucide"
}
```

### Radix UI Components Used
- Accordion
- Alert Dialog
- Avatar
- Checkbox
- Dialog
- Dropdown Menu
- Label
- Popover
- Progress
- Radio Group
- Select
- Separator
- Slider
- Switch
- Tabs
- Toast
- Tooltip
- And more...

---

## 8. Implementation Guide for PC Application

### Step 1: Install Dependencies

```bash
# Core styling
npm install tailwindcss postcss autoprefixer
npm install tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge

# Icons
npm install lucide-react

# Theme management (if needed)
npm install next-themes
```

### Step 2: Setup Tailwind Config

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Lato", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        statusPendingBg: "#FFFBEB",
        statusPendingText: "#F59E0B",
        statusPendingBorder: "#FDE68A",
        statusNeutralBg: "#F3F4F6",
        statusNeutralText: "#374151",
        statusNeutralBorder: "#E5E7EB",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Step 3: Create Global CSS

Create `globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: "Inter", sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: "Lato", sans-serif;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Step 4: Load Fonts

For web applications, add to your HTML head:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
```

For desktop applications, download and include the font files.

---

## 9. Color Conversion Reference

### HSL to RGB/Hex Conversion

To convert HSL values to RGB or Hex for frameworks that don't support HSL:

**Example:** `--primary: 222.2 47.4% 11.2%`
- H: 222.2°
- S: 47.4%
- L: 11.2%
- RGB: rgb(15, 23, 42)
- Hex: #0F172A

**Online Converter:** Use tools like:
- https://hslpicker.com/
- https://www.w3schools.com/colors/colors_hsl.asp

---

## 10. Key Design Principles

1. **Neutral Base:** Uses neutral gray tones as the foundation
2. **High Contrast:** Text maintains good contrast ratios for accessibility
3. **Subtle Accents:** Accent colors are muted and professional
4. **Consistent Spacing:** Uses Tailwind's spacing scale (0.5rem base radius)
5. **Professional Palette:** Blue-gray tones for a professional legal app feel
6. **Dark Mode Support:** Full dark mode with inverted color scheme

---

## 11. Component Usage Examples

### Button Colors
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Destructive: `bg-destructive text-destructive-foreground`
- Outline: `border border-input bg-background`

### Card Styling
- Background: `bg-card text-card-foreground`
- Border: `border border-border`
- Radius: `rounded-lg` (uses `--radius`)

### Status Badges
- Pending: `bg-statusPendingBg text-statusPendingText border-statusPendingBorder`
- Neutral: `bg-statusNeutralBg text-statusNeutralText border-statusNeutralBorder`

---

## Summary

This theme uses:
- **Design System:** shadcn/ui (Radix UI + Tailwind CSS)
- **Base Color:** Neutral
- **Typography:** Inter (body) + Lato (headings)
- **Theme Mode:** Light/Dark (class-based)
- **Border Radius:** 0.5rem (8px)
- **Color Format:** HSL with CSS variables
- **Icons:** Lucide React

You can replicate this exact theme in your PC application by following the implementation guide above.

