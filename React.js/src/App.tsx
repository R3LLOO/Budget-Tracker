import React, { useState, useEffect } from "react";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Wallet,
  Sparkles,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  PieChart,
  Grid,
  TrendingUp as TrendUpIcon,
  HelpCircle,
  FileText,
  BookmarkCheck,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  cat: string;
  date: string;
}

interface BudgetLimit {
  [catId: string]: number;
}

const CATEGORIES = [
  { id: "housing", label: "Housing & Rent", icon: "🏠", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  { id: "food", label: "Food & Groceries", icon: "🍽️", color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" },
  { id: "transport", label: "Transport & Fuel", icon: "🚗", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)" },
  { id: "utilities", label: "Utilities & Bills", icon: "⚡", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" },
  { id: "health", label: "Medical & Health", icon: "💊", color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)" },
  { id: "entertainment", label: "Leisure & Fun", icon: "🎬", color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)" },
  { id: "shopping", label: "Lifestyle & Retail", icon: "🛍️", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  { id: "savings", label: "Investments & Savings", icon: "💰", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.1)" },
  { id: "other", label: "Sundry/Other", icon: "📦", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function App() {
  const today = new Date();

  // Selected Month and Year for budgeting view
  const [month, setMonth] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());

  // Income level - tracked globally or set per month
  const [income, setIncome] = useState<number>(() => {
    const saved = localStorage.getItem("zar_web_income");
    return saved ? parseFloat(saved) : 32000;
  });
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  // Category specific budgets limits
  const [budgets, setBudgets] = useState<BudgetLimit>(() => {
    const saved = localStorage.getItem("zar_web_budgets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      housing: 9500, food: 5000, transport: 30500, utilities: 2000,
      health: 1500, entertainment: 2500, shopping: 3000, savings: 6000, other: 1500,
    };
  });

  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [budgetInputVal, setBudgetInputVal] = useState("");

  // Ledger transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("zar_web_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Seed initial demo data centered on the current month & year
    const monthStr = String(today.getMonth() + 1).padStart(2, "0");
    return [
      { id: "init-1", desc: "ZAR Standard Bank Salary", amount: -32000, cat: "savings", date: `${today.getFullYear()}-${monthStr}-25` },
      { id: "init-2", desc: "Sandton Apartments Rent", amount: 9200, cat: "housing", date: `${today.getFullYear()}-${monthStr}-01` },
      { id: "init-3", desc: "Woolworths Weekly Groceries", amount: 1850, cat: "food", date: `${today.getFullYear()}-${monthStr}-03` },
      { id: "init-4", desc: "Sasol Petrol Refill", amount: 950, cat: "transport", date: `${today.getFullYear()}-${monthStr}-05` },
      { id: "init-5", desc: "Eskom Prepaid Token Office", amount: 1200, cat: "utilities", date: `${today.getFullYear()}-${monthStr}-07` },
      { id: "init-6", desc: "Netflix & Spotify Subscriptions", amount: 280, cat: "entertainment", date: `${today.getFullYear()}-${monthStr}-11` },
      { id: "init-7", desc: "Dis-Chem Prescriptions", amount: 640, cat: "health", date: `${today.getFullYear()}-${monthStr}-12` },
      { id: "init-8", desc: "EasyEquities EFT Portfolio Transfer", amount: 4500, cat: "savings", date: `${today.getFullYear()}-${monthStr}-15` },
    ];
  });

  // Adding transaction state
  const [newTx, setNewTx] = useState({
    desc: "",
    amount: "",
    cat: "food",
    date: today.toISOString().slice(0, 10),
    isExpense: true
  });

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Notifications
  const [notif, setNotif] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem("zar_web_income", String(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem("zar_web_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("zar_web_transactions", JSON.stringify(transactions));
  }, [transactions]);

  const triggerNotif = (text: string, type: "success" | "info" | "error" = "success") => {
    setNotif({ text, type });
    setTimeout(() => setNotif(null), 3500);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.desc.trim()) {
      triggerNotif("Please enter a valid description", "error");
      return;
    }
    const rawAmt = parseFloat(newTx.amount);
    if (isNaN(rawAmt) || rawAmt <= 0) {
      triggerNotif("Please enter a valid positive ZAR amount", "error");
      return;
    }

    // Expenses are stored as positive values inside ledger, incomes are saved as negative values style
    // But to make it very intuitive, let's treat expenses as positive outflow, salaries as negative (offsets spending)
    const amountVal = newTx.isExpense ? rawAmt : -rawAmt;

    const added: Transaction = {
      id: "tx-" + Date.now() + Math.random().toString(36).substr(2, 4),
      desc: newTx.desc,
      amount: amountVal,
      cat: newTx.cat,
      date: newTx.date
    };

    setTransactions(prev => [added, ...prev]);
    triggerNotif(newTx.isExpense ? "Expense added successfully!" : "Income stream registered!");
    setNewTx({
      desc: "",
      amount: "",
      cat: "food",
      date: today.toISOString().slice(0, 10),
      isExpense: true
    });
  };

  const handleDeleteTransaction = (id: string, label: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    triggerNotif(`Removed transaction: "${label}"`, "info");
  };

  // Helper selectors
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const saveIncomeSetting = () => {
    const parsed = parseFloat(incomeInput);
    if (!isNaN(parsed) && parsed > 0) {
      setIncome(parsed);
      triggerNotif(`Primary monthly income set to R ${parsed.toLocaleString("en-ZA")}`, "success");
    }
    setEditingIncome(false);
  };

  const saveBudgetLimit = (catId: string) => {
    const val = parseFloat(budgetInputVal);
    if (!isNaN(val) && val >= 0) {
      setBudgets(prev => ({ ...prev, [catId]: val }));
      triggerNotif(`Budget limit for ${CATEGORIES.find(c => c.id === catId)?.label} bound to R ${val}`, "success");
    }
    setEditingBudgetCategory(null);
  };

  // Filtered lists for the active Month & Year
  const activeMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === month && tDate.getFullYear() === year;
  });

  // Calculate actual spends and incomes
  // Expenses = items with t.amount > 0 or t.cat !== "salary" etc. Let's look at t.amount > 0 as outflow, t.amount < 0 as salaries
  const totalOutflow = activeMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInflow = Math.abs(
    activeMonthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  // If no manual inward streams entered in active month, fallback display to the general Income slider / state
  const monthlyEffectiveIncome = totalInflow > 0 ? totalInflow : income;

  const parityBalance = monthlyEffectiveIncome - totalOutflow;
  const savingsRate = monthlyEffectiveIncome > 0 ? Math.max(0, parseFloat(((parityBalance / monthlyEffectiveIncome) * 100).toFixed(1))) : 0;

  // Expenditures split by category
  const categorySpentMap: Record<string, number> = {};
  CATEGORIES.forEach(c => {
    categorySpentMap[c.id] = 0;
  });
  activeMonthTransactions
    .filter(t => t.amount > 0)
    .forEach(t => {
      const catId = t.cat;
      if (categorySpentMap[catId] !== undefined) {
        categorySpentMap[catId] += t.amount;
      } else {
        categorySpentMap[catId] = t.amount;
      }
    });

  // Total spent calculation for SVG Ring
  const hasExpenses = totalOutflow > 0;

  // Search, filter, and sort ledger
  const searchedTransactions = activeMonthTransactions.filter(t => {
    const matchesSearch = t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          CATEGORIES.find(c => c.id === t.cat)?.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = catFilter === "all" || t.cat === catFilter;
    return matchesSearch && matchesCat;
  });

  const sortedTransactions = [...searchedTransactions].sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "amount-desc") return Math.abs(b.amount) - Math.abs(a.amount);
    if (sortBy === "amount-asc") return Math.abs(a.amount) - Math.abs(b.amount);
    return 0;
  });

  // Financial Insights Coach Logic (Completely Client Side & Real-time)
  const calculateFinancialCoachTips = () => {
    const tips = [];
    
    // Tip 1: Housing Ratio
    const housingSpent = categorySpentMap["housing"] || 0;
    const housingRatio = monthlyEffectiveIncome > 0 ? (housingSpent / monthlyEffectiveIncome) : 0;
    if (housingRatio > 0.4) {
      tips.push({
        id: "tip-housing",
        level: "warning",
        title: "High Shelter Leverage",
        desc: `Housing accounts for ${(housingRatio * 100).toFixed(0)}% of your income. Standard advisory suggests keeping rent under 30% of income limits to prevent financial strain.`
      });
    } else if (housingSpent > 0) {
      tips.push({
        id: "tip-housing-ok",
        level: "good",
        title: "Shelter Safezone",
        desc: `Your housing costs represent a highly disciplined ${(housingRatio * 100).toFixed(0)}% of your monthly available income.`
      });
    }

    // Tip 2: Over budget checks
    const violatedCategories: string[] = [];
    CATEGORIES.forEach(c => {
      const spent = categorySpentMap[c.id] || 0;
      const limit = budgets[c.id] || 0;
      if (limit > 0 && spent > limit) {
        violatedCategories.push(c.label);
      }
    });
    if (violatedCategories.length > 0) {
      tips.push({
        id: "tip-over-budget",
        level: "alarm",
        title: "Exceeded Budget Limits",
        desc: `You have breached monthly target limits on: ${violatedCategories.join(", ")}. Tap 'set' to recalibrate your boundaries.`
      });
    }

    // Tip 3: Savings metrics
    if (savingsRate >= 20) {
      tips.push({
        id: "tip-saving-pro",
        level: "excellent",
        title: "Wealth Builder Tier",
        desc: `Superb! You saved ${savingsRate}% of this month's net wallet cash. You are comfortably exceeding the standard 50/30/20 guideline.`
      });
    } else if (savingsRate > 0 && savingsRate < 10) {
      tips.push({
        id: "tip-saving-tight",
        level: "warning",
        title: "Tight Savings Buffer",
        desc: `Your savings rate sits at ${savingsRate}%. Try restricting luxury expenditures (Leisure & Retail) to secure a comfortable 15%+ buffer.`
      });
    } else if (savingsRate <= 0 && monthlyEffectiveIncome > 0) {
      tips.push({
        id: "tip-saving-negative",
        level: "alarm",
        title: "Deficit Spending Hazard",
        desc: "Crucial! Outflows exceed net income streams for this budget cycle. You are carrying a negative margin. Reduce auxiliary categories immediately."
      });
    }

    // Tip 4: Top category highlights
    const sortedSpent = Object.entries(categorySpentMap)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    if (sortedSpent.length > 0) {
      const [topCatId, maxSpent] = sortedSpent[0];
      const topCat = CATEGORIES.find(c => c.id === topCatId);
      if (topCat && topCatId !== "housing") {
        tips.push({
          id: "tip-top-spend",
          level: "info",
          title: `Primary Cost Node: ${topCat.label}`,
          desc: `Excluding rent, your highest monthly variable outflow was R ${maxSpent.toLocaleString("en-ZA")} spent under ${topCat.icon} ${topCat.label}.`
        });
      }
    }

    // Fallback if zero items logged
    if (tips.length === 0) {
      tips.push({
        id: "tip-fallback",
        level: "info",
        title: "Awaiting Financial Ledger Activity",
        desc: "Supply transactions or adjust category limits above. The coach dynamic scoring model will evaluate your leverage ratios automatically."
      });
    }

    return tips;
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (activeMonthTransactions.length === 0) {
      triggerNotif("No transaction entries to export for this month", "error");
      return;
    }
    const headers = "ID,Description,Amount (ZAR),Category,Date\n";
    const rows = activeMonthTransactions.map(t => {
      const catLabel = CATEGORIES.find(c => c.id === t.cat)?.label || t.cat;
      // Inflow items display as standard positive in general calculations, let's export literal values
      return `"${t.id}","${t.desc.replace(/"/g, '""')}",${t.amount},"${catLabel}","${t.date}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ZAR_Ledger_${MONTHS[month]}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotif("CSV Ledger Downloaded!");
  };

  const resetAllAppConfig = () => {
    if (window.confirm("Are you sure you want to clear the entire database? This clears all personal configurations, transactions, limits, and restores factory defaults.")) {
      localStorage.removeItem("zar_web_income");
      localStorage.removeItem("zar_web_budgets");
      localStorage.removeItem("zar_web_transactions");
      window.location.reload();
    }
  };

  // Category Colors generator for SVG donut
  const totalWeightExps = Object.values(categorySpentMap).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/10 selection:text-indigo-600">
      
      {/* GLOBAL BANNER */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ZAR Wallet <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 rounded-full px-2.5 py-0.5">Interactive Web Ledger</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Personal Finance Analytics & Ledger Engine</p>
            </div>
          </div>

          {/* Month Navigator Widget */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-205">
            <button 
              id="prev-month-nav"
              onClick={handlePrevMonth}
              className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg shadow-xs transition-all font-semibold font-mono active:scale-95 cursor-pointer"
            >
              ←
            </button>
            <span className="text-xs font-semibold text-slate-800 min-w-[130px] text-center select-none font-sans">
              {MONTHS[month]} {year}
            </span>
            <button 
              id="next-month-nav"
              onClick={handleNextMonth}
              className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg shadow-xs transition-all font-semibold font-mono active:scale-95 cursor-pointer"
            >
              →
            </button>
          </div>

          {/* Global Reset */}
          <div className="flex items-center gap-2.5">
            <button
              id="global-reset-btn"
              onClick={resetAllAppConfig}
              className="text-xs font-mono font-medium text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50/20 transition-all flex items-center gap-1 cursor-pointer"
              title="Factory Restore All Settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset App Data
            </button>
          </div>

        </div>
      </header>

      {/* NOTIFICATION FEEDBACK TOAST */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-20 right-6 px-4 py-3 rounded-xl shadow-xl z-50 text-xs font-semibold flex items-center gap-2.5 border ${
              notif.type === "success" 
                ? "bg-slate-900 text-emerald-400 border-slate-850" 
                : notif.type === "info"
                ? "bg-slate-900 text-cyan-400 border-slate-850"
                : "bg-slate-900 text-rose-450 border-slate-855 text-rose-400"
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-indigo-400" />
            <span>{notif.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* TOP STATUS BENTO GRID METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: INFLOW LEVEL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Monthly Inflow Cash (Income)</span>
                {editingIncome ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-slate-400 text-xs font-mono">R</span>
                    <input
                      id="net-income-input"
                      type="number"
                      className="bg-slate-50 border border-slate-300 text-slate-950 font-mono text-sm rounded-lg px-2 py-1 outline-none w-28 focus:border-indigo-500"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveIncomeSetting(); }}
                      autoFocus
                    />
                    <button
                      id="save-income-check"
                      onClick={saveIncomeSetting}
                      className="bg-emerald-600 text-white p-1 px-2 rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingIncome(false)}
                      className="text-slate-400 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      R {monthlyEffectiveIncome.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
                    </span>
                    <button
                      id="edit-income-trigger"
                      onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }}
                      className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Adjust standard monthly budget salary"
                    >
                      调整 Change
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-3 flex items-center gap-1">
              <span>Standard standard baseline:</span>
              <span className="font-mono text-slate-650">R {income.toLocaleString("en-ZA")}</span>
            </p>
          </div>

          {/* Card 2: BURNT RATE (OUTFLOW) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Total Expenses (Outflow)</span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    R {totalOutflow.toLocaleString("en-ZA")}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-3">
              Representing <span className="font-semibold text-slate-800 font-mono">{monthlyEffectiveIncome > 0 ? ((totalOutflow / monthlyEffectiveIncome) * 100).toFixed(0) : 0}%</span> of monthly inflows spent.
            </p>
          </div>

          {/* Card 3: REMAINING BALANCE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${parityBalance >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`} />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Parity Balance (Disposable)</span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className={`text-2xl font-bold font-mono ${parityBalance >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                    R {parityBalance.toLocaleString("en-ZA")}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${parityBalance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-3">
              {parityBalance >= 0 ? "Surplus capital margin" : "Deficit spend status alert"}
            </p>
          </div>

          {/* Card 4: SAVINGS CAP RATE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Savings Rate Score</span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-2xl font-bold font-mono text-cyan-600">
                    {savingsRate}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-3">
              Standard safe target: <span className="font-semibold text-slate-800 font-mono">20% or higher</span>
            </p>
          </div>

        </div>

        {/* WORKSPACE CONTENT SHELL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT 5 COLUMNS: ANALYTICS, CATEGORIES & INSIGHTS COACH     */}
          {/* ========================================================= */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
            
            {/* Visual breakdown (Donut SVG Chart Centerpiece) */}
            <div className="bg-white rounded-2xl border border-slate-201 border-slate-200 p-6 shadow-xs flex flex-col gap-5">
              <div>
                <span className="text-[10.5px] text-indigo-600 font-mono tracking-wide uppercase font-bold block mb-1">Visual Weight Allocation</span>
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Monthly Category Expenditures</h3>
              </div>

              {!hasExpenses ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-slate-200/60 rounded-full flex items-center justify-center text-slate-400 mb-2 font-bold text-lg">📊</div>
                  <p className="text-xs font-mono font-semibold text-slate-500">No active spending logged in {MONTHS[month]}</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 pr-1 pl-1">Insert outflow transactions via the ledger log to construct dynamic graphs.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  
                  {/* Custom Polished SVG Donut Chart */}
                  <div className="relative w-40 h-40 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Gray track back */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="11" />
                      
                      {(() => {
                        let accumulatedPercent = 0;
                        return CATEGORIES.map((c, i) => {
                          const spentVal = categorySpentMap[c.id] || 0;
                          if (spentVal <= 0) return null;
                          const percent = spentVal / totalWeightExps;
                          const strokeDashArray = `${percent * 251.2} 251.2`;
                          const strokeDashOffset = `-${accumulatedPercent * 251.2}`;
                          accumulatedPercent += percent;
                          
                          return (
                            <circle
                              key={c.id}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={c.color}
                              strokeWidth="11"
                              strokeDasharray={strokeDashArray}
                              strokeDashoffset={strokeDashOffset}
                              className="transition-all duration-500 hover:stroke-[13px] cursor-pointer"
                            >
                              <title>{`${c.label}: R ${spentVal.toLocaleString()}`}</title>
                            </circle>
                          );
                        });
                      })()}
                    </svg>
                    {/* Inner Content Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 select-none">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Spent</span>
                      <span className="text-base font-extrabold font-mono text-slate-950">R {totalOutflow.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[9px] text-slate-500 font-mono font-medium">Outflow sum</span>
                    </div>
                  </div>

                  {/* Dynamic Indicators right labels Grid */}
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest pl-1">Exps Proportions</span>
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {CATEGORIES.map(c => {
                        const amt = categorySpentMap[c.id] || 0;
                        if (amt <= 0) return null;
                        const pct = (amt / totalWeightExps) * 100;
                        return (
                          <div key={c.id} className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              <span className="truncate max-w-[100px]">{c.label}</span>
                            </div>
                            <span className="font-mono text-slate-905 font-bold">{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Category Budgets Boundary Controllers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
              <div>
                <span className="text-[10.5px] text-indigo-600 font-mono tracking-wide uppercase font-bold block mb-1">Outflow Thresholds</span>
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Monthly Category Budgets set</h3>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed font-sans">
                💡 Establish custom monthly spend ceilings. When your category outgoings exceed target ceilings, the analyzer registers a <span className="text-rose-600 font-bold uppercase font-mono">Breached Alert</span>.
              </div>

              <div className="flex flex-col gap-3.5 max-h-[340px] overflow-y-auto pr-1">
                {CATEGORIES.map(c => {
                  const spent = categorySpentMap[c.id] || 0;
                  const limit = budgets[c.id] || 0;
                  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                  const isExceeded = limit > 0 && spent > limit;

                  return (
                    <div key={c.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 border-slate-200">
                      
                      {/* Name - inputs */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none">{c.icon}</span>
                          <span className="text-xs font-semibold text-slate-800">{c.label}</span>
                        </div>

                        {/* Edit Limits widget */}
                        <div className="flex items-center gap-1.5">
                          {editingBudgetCategory === c.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[10px] font-mono">R</span>
                              <input
                                id={`edit-limit-input-${c.id}`}
                                type="number"
                                className="bg-white border border-slate-300 font-mono rounded px-1.5 py-0.5 text-[10px] w-14 outline-none focus:border-indigo-500"
                                value={budgetInputVal}
                                onChange={(e) => setBudgetInputVal(e.target.value)}
                                placeholder="Limit..."
                                onKeyDown={(e) => { if (e.key === "Enter") saveBudgetLimit(c.id); }}
                                autoFocus
                              />
                              <button
                                id={`save-limit-btn-${c.id}`}
                                onClick={() => saveBudgetLimit(c.id)}
                                className="text-[10px] px-1 py-0.5 text-indigo-650 bg-indigo-50 border border-indigo-200 font-bold rounded"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[10.5px] font-mono text-slate-400">Limit: R {limit.toLocaleString("en-ZA")}</span>
                              <button
                                id={`trigger-edit-limit-${c.id}`}
                                onClick={() => { setBudgetInputVal(String(limit)); setEditingBudgetCategory(c.id); }}
                                className="text-[9.5px] bg-slate-200 hover:bg-slate-300/80 text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded transition-all font-mono"
                              >
                                Set
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Spend / Breach alert line */}
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          Spent: R {spent.toLocaleString("en-ZA")}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {isExceeded ? (
                            <span className="text-[9px] bg-rose-50 text-rose-600 font-bold font-mono border border-rose-100 rounded px-1.5 py-0.5 uppercase flex items-center gap-0.5 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Limit Breached (+R {Math.abs(spent - limit)})
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {limit > 0 ? `${percent.toFixed(0)}% used` : "No limit set"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Progress bar */}
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500`}
                          style={{
                            width: `${limit > 0 ? percent : 0}%`,
                            backgroundColor: isExceeded ? "#ef4444" : percent > 80 ? "#f59e0b" : c.color
                          }}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart financial advisor insights block */}
            <div className="bg-slate-900 rounded-2xl border border-slate-850 p-6 text-white font-mono relative overflow-hidden shadow-lg shadow-slate-950/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Dynamic Financial Advisor Coach</span>
                </div>
                <span className="text-[8.5px] text-slate-500 tracking-widest font-mono uppercase bg-slate-800 p-1 px-2 rounded-full border border-slate-700/50">Active Analyzer</span>
              </div>

              <div className="flex flex-col gap-4 text-xs font-sans">
                {calculateFinancialCoachTips().map((tip) => (
                  <div key={tip.id} className="flex gap-3 text-slate-300 border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                    <div className="shrink-0 mt-0.5">
                      {tip.level === "excellent" && <span className="text-emerald-400">✅</span>}
                      {tip.level === "good" && <span className="text-cyan-400">✨</span>}
                      {tip.level === "warning" && <span className="text-amber-400">⚠️</span>}
                      {tip.level === "alarm" && <span className="text-rose-400">🚨</span>}
                      {tip.level === "info" && <span className="text-slate-400">ℹ️</span>}
                    </div>
                    <div>
                      <strong className="text-slate-100 block font-mono text-[11px] mb-0.5">{tip.title}</strong>
                      <p className="text-[11px] leading-relaxed text-slate-400">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT 7 COLUMNS: TRANSACTION LEDGER, LOGS & UTILITIES     */}
          {/* ========================================================= */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
            
            {/* Record New Ledger Row form block */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
              <div>
                <span className="text-[10.5px] text-indigo-600 font-mono tracking-wide uppercase font-bold block mb-1">Outflow Log Ledger Entry</span>
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Log New Entry Stream</h3>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                
                {/* Outflow vs Inflow Toggle Indicator button selector */}
                <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setNewTx(p => ({ ...p, isExpense: true }))}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      newTx.isExpense 
                        ? "bg-rose-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white block" />
                    Expense Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTx(p => ({ ...p, isExpense: false, cat: "savings" }))}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !newTx.isExpense 
                        ? "bg-emerald-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white block" />
                    Salary / Inflow Stream
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Ledger description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 font-mono uppercase">Billing Description</label>
                    <input
                      id="tx-desc-input-field"
                      type="text"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                      placeholder={newTx.isExpense ? "Woolworths, rent, Uber..." : "Standard Bank, Dividends, Cash..."}
                      value={newTx.desc}
                      onChange={(e) => setNewTx(p => ({ ...p, desc: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Cash allocation ZAR */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 font-mono uppercase">Amount in Rands (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">R</span>
                      <input
                        id="tx-amount-input-field"
                        type="number"
                        step="0.01"
                        className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-900 font-mono outline-none w-full focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505 focus:ring-1 focus:ring-indigo-500/20"
                        placeholder="Quantity"
                        value={newTx.amount}
                        onChange={(e) => setNewTx(p => ({ ...p, amount: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Flow selection criteria */}
                  {newTx.isExpense ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 font-mono uppercase">Allocation Category</label>
                      <select
                        id="tx-category-select-field"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none w-full focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                        value={newTx.cat}
                        onChange={(e) => setNewTx(p => ({ ...p, cat: e.target.value }))}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 font-mono uppercase text-emerald-600">Inflow Anchor Category</label>
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-850 font-medium">
                        💼 Logged directly as standard wallet Inward resource
                      </div>
                    </div>
                  )}

                  {/* Date selection criteria */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 font-mono uppercase">Transaction Billing Date</label>
                    <input
                      id="tx-date-input-field"
                      type="date"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono outline-none w-full focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                      value={newTx.date}
                      onChange={(e) => setNewTx(p => ({ ...p, date: e.target.value }))}
                      required
                    />
                  </div>

                </div>

                <button
                  id="submit-tx-btn"
                  type="submit"
                  className={`py-3 px-4 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                    newTx.isExpense 
                      ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-500/10 active:scale-[0.99]" 
                      : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/10 active:scale-[0.99]"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert ledger item into monthly history</span>
                </button>

              </form>
            </div>

            {/* Comprehensive transaction records with live search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              
              {/* Filter controls header bar */}
              <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/50">
                
                <div>
                  <span className="text-[10.5px] text-indigo-600 font-mono tracking-wide uppercase font-bold block mb-1">Ledger Catalog Registry</span>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 tracking-tight text-sm">Monthly Transactions Sheet</h3>
                    <span className="bg-slate-200/80 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      {activeMonthTransactions.length} items logged
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 items-center self-stretch md:self-auto">
                  
                  {/* Export Trigger */}
                  <button
                    id="export-csv-btn"
                    onClick={handleExportCSV}
                    className="bg-white hover:bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-5xs"
                    title="Export Ledger as spreadsheet spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Spreadsheet Export</span>
                  </button>

                </div>

              </div>

              {/* Real-time search & criteria filter row tabs */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                
                {/* Search Text field */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    id="search-input-box"
                    type="text"
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 outline-none w-full focus:bg-white focus:border-indigo-500"
                    placeholder="Search standard entries description, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Sort-by order */}
                <div className="flex gap-2 min-w-max">
                  <select
                    id="category-filter-dropdown"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer hover:bg-white focus:border-indigo-500"
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                  >
                    <option value="all">📁 All categories</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    <option value="savings">💰 Salary Inflows (unallocated)</option>
                  </select>

                  <select
                    id="sort-by-order-dropdown"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer hover:bg-white focus:border-indigo-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date-desc">🗓️ Newest First</option>
                    <option value="date-asc">🗓️ Oldest First</option>
                    <option value="amount-desc">💸 Highest Amount</option>
                    <option value="amount-asc">🪙 Lowest Amount</option>
                  </select>
                </div>

              </div>

              {/* Ledger history List Scroll box */}
              <div className="p-6 max-h-[500px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {sortedTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3 font-mono font-extrabold text-base">?</div>
                      <p className="text-xs font-mono font-semibold text-slate-500">No matching transactions registered</p>
                      <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed">Adjust filters or register new entries to populate the ledger list sheet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {sortedTransactions.map((tx) => {
                        const isOutflow = tx.amount > 0;
                        const c = CATEGORIES.find(cat => cat.id === tx.cat);
                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              
                              {/* Category Icon indicator */}
                              <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm shadow-2xs">
                                {isOutflow ? c?.icon : "💼"}
                              </div>

                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 leading-tight">
                                  {tx.desc}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 font-medium">
                                  <span>{tx.date}</span>
                                  <span>·</span>
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                                    {isOutflow ? c?.label || tx.cat : "Salary stream"}
                                  </span>
                                </span>
                              </div>

                            </div>

                            <div className="flex items-center gap-3">
                              
                              {/* Value indicator */}
                              <span className={`text-xs font-mono font-extrabold tracking-tight ${
                                isOutflow ? "text-slate-900" : "text-emerald-600"
                              }`}>
                                {isOutflow ? "- R " : "+ R "}
                                {Math.abs(tx.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>

                              {/* Row delete trigger action button */}
                              <button
                                id={`del-transaction-btn-${tx.id}`}
                                onClick={() => handleDeleteTransaction(tx.id, tx.desc)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50/50 transition-all cursor-pointer opacity-40 group-hover:opacity-100"
                                title="Delete this entry log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>

                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Aggregate summary ledger footer values */}
              {sortedTransactions.length > 0 && (
                <div className="bg-slate-50/50 p-4 px-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-mono">
                  <span>Filtered set sum value:</span>
                  <span className="font-extrabold text-slate-800">
                    R {searchedTransactions.reduce((acc, t) => acc + (t.amount), 0).toLocaleString("en-ZA")}
                  </span>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-400 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono">© 2026 ZAR Wallet Interactive Web Ledger. Built on client-only secure storage.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-650">Local Caching Offline-Persistent</span>
            <span>·</span>
            <span className="hover:text-slate-650">Production ready build</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
