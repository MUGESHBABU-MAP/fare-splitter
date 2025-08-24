# Trip Expense Splitter 🧳💰

A comprehensive web application for managing and splitting trip expenses among group members. Built with React, TypeScript, and modern web technologies.

## 🌟 Features

### Core Functionality
- **Configurable Members**: Support for 2-100 members per trip
- **Smart Expense Splitting**: Equal splits, custom beneficiaries, and gift handling
- **Joint Treat Support**: Multiple sponsors with custom share amounts
- **Settlement Optimization**: Minimized transactions using greedy algorithm
- **Data Persistence**: Local storage with IndexedDB + cloud sync with Supabase

### Advanced Features
- **Excel Export/Import**: Full trip data export with settlements
- **Multiple Trip Management**: Save and manage multiple trips
- **Real-time Calculations**: Instant balance and settlement updates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **GitHub Pages Deployment**: Auto-deploy with custom domain support

## 🚀 Live Demo

**Production URL**: [https://mugeshbabu.com](https://mugeshbabu.com)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: React Context + React Query
- **Local Storage**: Dexie.js (IndexedDB)
- **Cloud Storage**: Supabase
- **Export/Import**: xlsx library
- **Build Tool**: Vite
- **Deployment**: GitHub Pages + GitHub Actions

## 📱 Usage Guide

### 1. Create a Trip
1. Click "Create New Trip"
2. Enter trip name (e.g., "Goa Beach Trip 2024")
3. Set number of members (2-100)
4. Add member names
5. Click "Create Trip"

### 2. Add Expenses
1. Open your trip
2. Click "Add Expense"
3. Fill in details:
   - **Date**: When the expense occurred
   - **Amount**: Total amount spent
   - **Paid By**: Who paid the expense
   - **Beneficiaries**: Who should split the cost
   - **Gift Toggle**: Mark as gift if applicable
   - **Joint Treat**: Multiple sponsors with custom shares
   - **Notes**: Additional details

### 3. View Summary
- **Member Balances**: See who owes what
- **Settlement Plan**: Optimized payment instructions
- **Export Data**: Download Excel with all details

### 4. Settlement Examples

**Example 1: Simple Split**
- Alice pays ₹10,000 for hotel
- Split among 4 people
- Each person owes ₹2,500
- Alice gets back ₹7,500

**Example 2: Joint Treat**
- Total bill: ₹2,600
- Alice contributes: ₹1,600
- Bob contributes: ₹1,000
- Split among Alice and Bob
- Alice owes Bob: ₹300

**Example 3: Gift**
- Charlie pays ₹500 as gift to Diana
- No splitting required
- Tracked for transparency

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/mugeshbabu/fare-splitter.git
cd fare-splitter

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

### Build for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Deploy to GitHub Pages
```bash
# Deploy manually
npm run deploy

# Or push to main branch for auto-deployment
git push origin main
```

## 🧪 Testing

The app includes built-in calculation tests:
1. Visit the home page
2. Click "Test Calculations" button
3. Check browser console for test results

Tests validate:
- Balance calculations
- Settlement optimization
- Data integrity
- Edge cases

## 📊 Data Structure

### Trip Object
```typescript
interface Trip {
  id: string;
  name: string;
  members: string[];
  member_count: number;
  created_at: string;
  updated_at: string;
}
```

### Expense Object
```typescript
interface Expense {
  id: string;
  trip_id: string;
  expense_date: string;
  paid_by: string;
  amount: number;
  beneficiaries: string[];
  is_gift: boolean;
  gift_to: string[];
  joint_treat_shares?: Record<string, number>;
  notes: string;
}
```

## 🚀 Deployment

### Automatic Deployment
- Push to `main` branch triggers GitHub Actions
- Builds and deploys to GitHub Pages
- Custom domain: `mugeshbabu.com`

### Manual Deployment
```bash
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) for rapid prototyping
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Deployment via [GitHub Pages](https://pages.github.com/)

---

**Made with ❤️ for hassle-free trip expense management**
