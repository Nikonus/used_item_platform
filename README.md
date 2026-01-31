<div align="center">
🛍️ USED-ITEMS-HUB
🚚 Community Marketplace with Smart Delivery & OTP Tracking

Full-Stack • Real-World Workflow • Maps Integration • Secure Transactions






</div>
✨ Overview

USED-ITEMS-HUB is a real-world full-stack marketplace where users can Rent, Buy, or Sell used items within their community.

Ye koi basic CRUD project nahi hai — yahan Authentication, Image Storage, Distance-based Delivery Pricing, OTP Handover System, aur Order Tracking jaisi production-level cheezein implement ki gayi hain.

This project simulates how modern marketplaces like OLX + Dunzo + Amazon Local might work under the hood.

🧩 Core Features
🔐 Authentication & User System

✔ Email/Password Login
✔ Google OAuth Login
✔ Private Routes Protection
✔ Auto Profile Creation on Signup
✔ KYC Document Upload & Status Tracking

🛒 Marketplace Engine

✔ Add item for Rent or Sell
✔ Upload multiple item images
✔ Browse active listings
✔ Category & condition filters
✔ Detailed item pages with seller info
✔ Manage your own listings

🚚 Smart Delivery System

✔ Address Autocomplete using Google Maps
✔ Distance calculation (Seller → Buyer)
✔ Delivery Fee based on distance
✔ Standard vs Express delivery options

📦 Order Workflow

✔ Add to Cart & Checkout
✔ Order creation in database
✔ Transaction logging (mock payment)
✔ Order status progression:
Paid → Picked Up → Delivered

🔐 OTP-Based Handover Security

✔ Pickup OTP (Seller verifies courier handover)
✔ Delivery OTP (Buyer verifies delivery)
✔ Prevents fake deliveries & fraud

📍 Live Order Tracking

✔ Visual timeline UI
✔ Pickup & delivery timestamps
✔ Role-based OTP verification (Seller vs Buyer)

🧠 Tech Stack
Layer	Technology
Frontend	React + Vite + TypeScript
Backend	Supabase (Postgres, Auth, Storage)
Maps	Google Maps API (Places + Distance Matrix)
State	React Context API
Routing	React Router
Deployment	Vercel (planned)
📂 Project Structure
src/
 ├── components/        # Reusable UI components
 ├── context/           # Auth & Cart state management
 ├── lib/               # Maps, Delivery logic, OTP, Storage helpers
 ├── pages/             # Main pages (Feed, Item, Checkout, Orders)
 ├── routes/            # Private route protection
 └── main.tsx           # App entry & routing

🗄️ Database Design (Supabase)
Core Tables
Table	Purpose
profiles	User profile & KYC status
items	Marketplace listings
item_images	Multiple photos per item
orders	Delivery, OTP & tracking data
transactions	Payment logs
🔑 Environment Variables

Create a .env file:

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key


⚠ Never commit .env to GitHub.

🧪 Run Locally
npm install
npm run dev


App runs at:
👉 http://localhost:5173

🤝 Collaboration Ready

✔ GitHub repo with feature-based commits
✔ Supabase shared project access
✔ Modular code structure for team scaling

Recommended workflow:

git checkout -b feat/feature-name
git commit -m "feat: description"
git push

🎯 Learning Outcomes

This project demonstrates:

Real-world marketplace architecture

Secure auth & user separation

Cloud storage integration

Geo-based delivery logic

OTP verification workflows

Production-style database schema evolution

🚀 Future Enhancements

🔹 User ratings & reviews
🔹 In-app chat between buyer & seller
🔹 Live delivery tracking map
🔹 Razorpay/Stripe payment integration
🔹 Admin dashboard

👨‍💻 Developer

Nikhil Dubey
Full-Stack Developer • Systems Thinking • Real-World Architecture Focus

<div align="center">
⭐ If this project helped you learn, consider giving it a star!
</div>
