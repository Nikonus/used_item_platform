# Used Items Hub 🛍️

A modern marketplace platform for buying, selling, and renting used items. Built with React, TypeScript, Vite, and Supabase.

## ✨ Features

- **User Authentication** - Email/password and Google OAuth
- **KYC Verification** - Document upload and verification system
- **Item Listings** - Create, edit, and manage item listings with multiple images
- **Search & Filters** - Find items by category, price, and type (rent/sell)
- **Shopping Cart** - Add items to cart and checkout
- **Order Tracking** - Real-time order status with timeline UI
- **OTP Verification** - Secure pickup and delivery verification
- **Delivery Integration** - Google Maps integration for address and distance calculation
- **Payment Mockup** - Transaction recording system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Maps API key (optional, for delivery features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd used-items-hub/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run `supabase-schema.sql` in SQL Editor
   - Create storage buckets: `kyc_documents` (private) and `item_images` (public)

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📦 Project Structure

```
app/
├── src/
│   ├── components/      # Reusable components
│   ├── context/         # React contexts (Auth, Cart)
│   ├── lib/             # Utilities and helpers
│   ├── pages/           # Page components
│   └── routes/          # Route guards
├── public/              # Static assets
├── supabase-schema.sql  # Database schema
└── vercel.json          # Vercel deployment config
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - Backend (Auth, Database, Storage)
- **React Router** - Client-side routing
- **Google Maps API** - Address and distance calculation

## 📱 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 🎨 Design System

The app uses a clean, modern design with:
- Neutral color palette (#E2E5E6 background, #0F1110 text)
- Glassmorphic navbar
- Card-based layouts
- Smooth animations and transitions
- Mobile-first responsive design

## 📋 Phase Checklist

- [x] Phase 1: Authentication & Profile (KYC)
- [x] Phase 2: Core Marketplace (Listing & Discovery)
- [x] Phase 3: Transaction & Delivery Integration
- [x] Phase 4: Polish & Refinement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

Built with ❤️ using React + TypeScript + Vite

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
