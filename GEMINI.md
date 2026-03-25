# Sortly-Clone: Inventory Manager (v1.0.0)

## 🎯 Goal
A high-performance inventory management app with QR/Barcode scanning, image uploads, and stock transaction tracking.

## 🗺️ Project Status: DELIVERED ✅
- [x] **Stage 1: The Brain** (Supabase Setup)
  - [x] Database Schema (Items, Categories, Transactions)
  - [x] Auth & RLS Policies (Public access configured)
  - [x] Supabase Client Integration
- [x] **Stage 2: The Skeleton** (App Structure)
  - [x] Modular Screen Architecture (Dashboard, Inventory, Scan, History)
  - [x] Dynamic Navigation & Real-time Sync
- [x] **Stage 3: The Eyes** (Scanning & Camera)
  - [x] Barcode/QR Scanner with Supabase Lookup
  - [x] Permission Handling & Scan Result Cards
- [x] **Stage 4: The Math** (Logic)
  - [x] In/Out Stock Adjustment Logic
  - [x] Automated Transaction History Logging
  - [x] Dynamic Dashboard Stats (Total Items & Low Stock)
- [x] **Stage 5: The Delivery** (Build)
  - [x] Web Deployment Ready
  - [x] EAS Build Configuration Ready for .apk

## 🚀 Ready for Meetings
This version is fully functional for demonstration. You can:
1. **Show Live Data**: Add an item on your laptop and see it appear on the phone instantly.
2. **Demonstrate Scanning**: Scan any barcode to show the "New Item" or "Item Found" logic.
3. **Prove Audit Trails**: Adjust stock and immediately show the record in the "History" tab.

## 🛠️ Build Instruction (for .apk)
To generate the android build, run:
`eas build -p android --profile preview`
