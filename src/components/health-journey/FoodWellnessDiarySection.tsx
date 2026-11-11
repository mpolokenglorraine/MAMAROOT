import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  Plus, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Activity, 
  Sparkles, 
  X, 
  Coffee, 
  Sun, 
  Moon, 
  Apple, 
  Droplet,
  Info,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  FoodDiaryEntry, 
  MealType, 
  BloatingLevel, 
  StressLevel, 
  healthJourneyService 
} from '../../lib/healthJourneyService';

interface FoodWellnessDiaryProps {
  userId: string;
  entries: FoodDiaryEntry[];
  onRefresh: () => void;
}

export function FoodWellnessDiarySection({
  userId,
  entries,
  onRefresh
}: FoodWellnessDiaryProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'all'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [mealTime, setMealTime] = useState('08:30');
  const [description, setDescription] = useState('');
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painSeverity, setPainSeverity] = useState<number | undefined>(undefined);
  const [bloatingLevel, setBloatingLevel] = useState<BloatingLevel>('none');
  const [bowelChanges, setBowelChanges] = useState('');
  const [sleepQuality, setSleepQuality] = useState('Good (7-8 hours)');
  const [physicalActivity, setPhysicalActivity] = useState('');
  const [stressLevel, setStressLevel] = useState<StressLevel>('medium');
  const [mood, setMood] = useState('Balanced');
  const [suspectedTriggerInput, setSuspectedTriggerInput] = useState('');
  const [suspectedTriggers, setSuspectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const COMMON_MEAL_SYMPTOMS = [
    'Bloating / Fullness',
    'Pelvic Cramping',
    'Abdominal Sharp Pain',
    'Nausea / Queasiness',
    'Acid Reflux / Heartburn',
    'Bowel Urgency / Diarrhea',
    'Constipation / Sluggishness',
    'Post-Meal Fatigue / Slump',
    'Headache / Migraine'
  ];

  const COMMON_TRIGGERS = [
    'Dairy / Cow Milk',
    'Gluten / Wheat',
    'Refined Sugar',
    'Coffee / High Caffeine',
    'Spicy Food',
    'Soy Products',
    'Cruciferous Vegetables',
    'Artificial Sweeteners',
    'Fried / Greasy Foods',
    'Alcohol'
  ];

  const handleAddIngredient = () => {
    if (!ingredientsInput.trim()) return;
    const items = ingredientsInput.split(',').map(s => s.trim()).filter(Boolean);
    setIngredients(prev => [...new Set([...prev, ...items])]);
    setIngredientsInput('');
  };

  const handleToggleTrigger = (trig: string) => {
    if (suspectedTriggers.includes(trig)) {
      setSuspectedTriggers(suspectedTriggers.filter(t => t !== trig));
    } else {
      setSuspectedTriggers([...suspectedTriggers, trig]);
    }
  };

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      await healthJourneyService.addFoodDiaryEntry({
        user_id: userId,
        date,
        meal_type: mealType,
        meal_time: mealTime,
        description: description.trim(),
        ingredients,
        symptoms_experienced: selectedSymptoms,
        pain_severity: painSeverity,
        bloating_level: bloatingLevel,
        bowel_changes: bowelChanges.trim() || undefined,
        sleep_quality: sleepQuality,
        physical_activity: physicalActivity.trim() || undefined,
        stress_level: stressLevel,
        mood,
        suspected_triggers: suspectedTriggers,
        notes: notes.trim() || undefined
      });

      setShowAddModal(false);
      // Reset
      setDescription('');
      setIngredients([]);
      setSelectedSymptoms([]);
      setPainSeverity(undefined);
      setBloatingLevel('none');
      setSuspectedTriggers([]);
      setNotes('');
      onRefresh();
    } catch (err) {
      console.error('Failed to save food log:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this food diary entry?')) return;
    await healthJourneyService.deleteFoodDiaryEntry(id, userId);
    onRefresh();
  };

  // Filter entries based on viewMode
  const filteredEntries = useMemo(() => {
    if (viewMode === 'daily') {
      return entries.filter(e => e.date === selectedDate);
    }
    if (viewMode === 'weekly') {
      const selected = new Date(selectedDate);
      const startOfWeek = new Date(selected);
      startOfWeek.setDate(selected.getDate() - selected.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];

      return entries.filter(e => e.date >= startStr && e.date <= endStr);
    }
    return entries;
  }, [entries, viewMode, selectedDate]);

  // Exploratory pattern summary (safe associations)
  const patternSummary = useMemo(() => {
    if (entries.length < 3) return null;

    const triggerCounts: Record<string, { totalMeals: number; withBloatingOrPain: number }> = {};

    entries.forEach(entry => {
      const hasDiscomfort = (entry.bloating_level && entry.bloating_level !== 'none') || 
                            (entry.pain_severity && entry.pain_severity >= 3) ||
                            (entry.symptoms_experienced && entry.symptoms_experienced.length > 0);

      const allItems = [...entry.suspected_triggers, ...entry.ingredients];
      allItems.forEach(item => {
        const key = item.toLowerCase().trim();
        if (!key) return;
        if (!triggerCounts[key]) {
          triggerCounts[key] = { totalMeals: 0, withBloatingOrPain: 0 };
        }
        triggerCounts[key].totalMeals += 1;
        if (hasDiscomfort) {
          triggerCounts[key].withBloatingOrPain += 1;
        }
      });
    });

    const notable = Object.entries(triggerCounts)
      .filter(([_, stats]) => stats.totalMeals >= 2 && stats.withBloatingOrPain >= 2)
      .sort((a, b) => b[1].withBloatingOrPain - a[1].withBloatingOrPain)
      .slice(0, 3);

    return notable;
  }, [entries]);

  const getMealIcon = (m: MealType) => {
    switch (m) {
      case 'breakfast': return <Sun className="w-4 h-4 text-amber-600" />;
      case 'lunch': return <Sun className="w-4 h-4 text-orange-500" />;
      case 'dinner': return <Moon className="w-4 h-4 text-[#572D43]" />;
      case 'drink': return <Droplet className="w-4 h-4 text-cyan-600" />;
      case 'snack':
      default: return <Apple className="w-4 h-4 text-[#914E61]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4E8E0] text-[#572D43] flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#914E61]" />
              Food & Lifestyle Rhythms
            </span>
            <span className="text-xs text-[#777078]">
              {entries.length} meals logged
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            Food, Meal & Wellness Diary
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            Record what you eat alongside digestion, bloating, and energy levels. Specially valuable for managing chronic inflammatory conditions like endometriosis.
          </p>
        </div>

        <button
          onClick={() => {
            setDate(new Date().toISOString().split('T')[0]);
            setShowAddModal(true);
          }}
          className="btn-berry py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Meal & Wellness</span>
        </button>
      </div>

      {/* Exploratory Pattern Summary Card (with Medical Safety Boundary) */}
      {patternSummary && patternSummary.length > 0 && (
        <div className="bg-[#FFF9F3] rounded-3xl p-6 border border-[#D9A7A4]/60 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#572D43] text-[#FFF9F3] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#D9A7A4]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#572D43]">
                Observed Symptom Co-Occurrences in Your Logs
              </h4>
              <p className="text-xs text-[#777078] leading-relaxed">
                The diary has noted mild to moderate discomfort on days containing these recorded items:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {patternSummary.map(([item, stats]) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#D9A7A4] text-xs font-semibold text-[#572D43] shadow-2xs"
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}: reported with symptoms in {stats.withBloatingOrPain} of {stats.totalMeals} logs
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-[#D9A7A4]/40 flex items-start gap-2 text-[11px] text-[#777078] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-[#914E61] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#572D43]">Important Medical Notice:</strong> Observed associations do not establish medical causation. Every person's digestive and hormonal biology is individual. Do not eliminate nutrient groups or stop prescribed medications without professional medical supervision.
            </span>
          </div>
        </div>
      )}

      {/* Date Navigation & View Mode Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl bg-white border border-[#572D43]/15 text-[#572D43] hover:bg-[#F4E8E0] cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 rounded-xl bg-white border border-[#572D43]/15 text-xs font-semibold text-[#572D43]"
          />

          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl bg-white border border-[#572D43]/15 text-[#572D43] hover:bg-[#F4E8E0] cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 rounded-xl bg-[#F4E8E0] text-[11px] font-bold text-[#572D43] hover:bg-[#D9A7A4]/50 cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['daily', 'weekly', 'all'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                viewMode === mode
                  ? 'bg-[#572D43] text-white'
                  : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#572D43]/10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4E8E0] text-[#572D43] flex items-center justify-center mx-auto">
            <Utensils className="w-7 h-7 text-[#914E61]" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#572D43]">No meals logged for this view</h3>
            <p className="text-xs text-[#777078] mt-1 leading-relaxed">
              Tracking meals, snacks, water, and post-meal sensations helps you discover how your body feels after different foods.
            </p>
          </div>
          <button
            onClick={() => {
              setDate(selectedDate);
              setShowAddModal(true);
            }}
            className="btn-berry py-2.5 px-4 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal for {selectedDate}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF9F3] border border-[#F4E8E0] flex items-center justify-center">
                      {getMealIcon(entry.meal_type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#572D43] capitalize">
                        {entry.meal_type}
                      </h4>
                      <p className="text-[11px] text-[#777078]">
                        {entry.date} {entry.meal_time ? `• ${entry.meal_time}` : ''}
                      </p>
                    </div>
                  </div>

                  {entry.bloating_level && entry.bloating_level !== 'none' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#914E61]/15 text-[#914E61]">
                      Bloating: {entry.bloating_level}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#302B2D] mt-2 mb-1">
                  {entry.description}
                </p>

                {entry.ingredients && entry.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.ingredients.map(ing => (
                      <span
                        key={ing}
                        className="px-2 py-0.5 rounded-md bg-[#FFF9F3] border border-[#F4E8E0] text-[10px] text-[#777078]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                )}

                {/* Symptoms Experienced */}
                {entry.symptoms_experienced && entry.symptoms_experienced.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 mb-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                      Symptom Response:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {entry.symptoms_experienced.map(sym => (
                        <span key={sym} className="px-1.5 py-0.5 rounded bg-white text-[10px] font-medium text-rose-700 border border-rose-200">
                          {sym}
                        </span>
                      ))}
                      {entry.pain_severity !== undefined && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-[10px] font-bold text-rose-800">
                          Pain: {entry.pain_severity}/10
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Suspected triggers */}
                {entry.suspected_triggers && entry.suspected_triggers.length > 0 && (
                  <p className="text-[11px] text-[#777078] mb-1">
                    <strong className="text-[#572D43]">Suspected trigger:</strong> {entry.suspected_triggers.join(', ')}
                  </p>
                )}

                {/* Lifestyle context */}
                {(entry.sleep_quality || entry.stress_level) && (
                  <div className="text-[11px] text-[#777078] flex items-center gap-3 pt-1">
                    {entry.sleep_quality && <span>Sleep: {entry.sleep_quality}</span>}
                    {entry.stress_level && <span>Stress: {entry.stress_level}</span>}
                  </div>
                )}

                {entry.notes && (
                  <p className="text-xs text-[#777078] italic mt-2">
                    "{entry.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-end">
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Meal / Wellness Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#914E61]" />
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  Log Meal & Wellness
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full text-[#777078] hover:bg-[#F4E8E0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Meal Type *</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs font-semibold"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="drink">Beverage / Drink</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Meal Time</label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Food & Drink Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warm rooibos tea, oat porridge with chia seeds and almond milk"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  required
                />
              </div>

              {/* Key Ingredients */}
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Key Ingredients / Foods
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Oats, Almond milk, Chia seeds (comma-separated)"
                    value={ingredientsInput}
                    onChange={(e) => setIngredientsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIngredient();
                      }
                    }}
                    className="flex-1 p-2 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3 py-2 rounded-xl bg-[#F4E8E0] text-[#572D43] font-bold text-xs hover:bg-[#D9A7A4]/50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map(ing => (
                      <span
                        key={ing}
                        className="px-2 py-0.5 rounded-md bg-[#572D43] text-white text-xs flex items-center gap-1"
                      >
                        {ing}
                        <button
                          type="button"
                          onClick={() => setIngredients(ingredients.filter(i => i !== ing))}
                          className="hover:text-[#D9A7A4] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Symptoms Response */}
              <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 space-y-3">
                <span className="font-bold text-[#572D43] block">
                  Post-Meal Symptoms & Sensations (Next 1–4 Hours)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#777078] mb-1">Bloating Level</label>
                    <select
                      value={bloatingLevel}
                      onChange={(e) => setBloatingLevel(e.target.value as BloatingLevel)}
                      className="w-full p-2 rounded-lg bg-white border border-[#572D43]/15 text-xs"
                    >
                      <option value="none">None / Comfortable</option>
                      <option value="mild">Mild (Slight fullness)</option>
                      <option value="moderate">Moderate (Visible distention)</option>
                      <option value="severe">Severe ("Endo belly" / Painful tension)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#777078] mb-1">Pain Severity (Optional 0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="e.g. 0 to 10"
                      value={painSeverity ?? ''}
                      onChange={(e) => setPainSeverity(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full p-2 rounded-lg bg-white border border-[#572D43]/15 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_MEAL_SYMPTOMS.map(sym => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => handleToggleSymptom(sym)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[#914E61] text-white' 
                            : 'bg-white border border-[#D9A7A4] text-[#572D43] hover:bg-[#F4E8E0]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suspected Triggers */}
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Suspected Food Trigger (Observation Only)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TRIGGERS.map(trig => {
                    const isSelected = suspectedTriggers.includes(trig);
                    return (
                      <button
                        type="button"
                        key={trig}
                        onClick={() => handleToggleTrigger(trig)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[#572D43] text-white' 
                            : 'bg-white border border-[#D9A7A4]/60 text-[#572D43] hover:bg-[#F4E8E0]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{trig}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lifestyle Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Stress Level
                  </label>
                  <select
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value as StressLevel)}
                    className="w-full p-2 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  >
                    <option value="low">Low / Relaxed</option>
                    <option value="medium">Medium / Typical Day</option>
                    <option value="high">High / Overwhelmed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Sleep Last Night
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Restless 6 hrs, Deep 8 hrs"
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Personal Observations / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Energy levels, emotional context, water intake..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#572D43]/20 text-[#777078] hover:text-[#572D43] font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-berry py-2.5 px-5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Meal & Wellness Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default FoodWellnessDiarySection;
