/**
 * Calculation History and Comparison Component
 * 
 * Provides functionality to save, view, and compare financial calculation results.
 * Enables tracking of calculation changes over time and scenario comparison.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  History, 
  Save,
  Trash2,
  Calendar,
  Calculator,
  TrendingUp,
  Download,
  Eye,
  GitCompare
} from 'lucide-react';
import { CalculationResult } from '@/lib/financialCalculatorApi';

interface SavedCalculation {
  id: string;
  name: string;
  description?: string;
  calculations: Record<string, CalculationResult<any>>;
  metadata: {
    borrowerName?: string;
    propertyAddress?: string;
    loanNumber?: string;
    evaluationType?: string;
  };
  timestamp: string;
  tags: string[];
}

interface CalculationHistoryProps {
  currentCalculations?: Record<string, CalculationResult<any>>;
  onSaveCalculation?: (calculation: SavedCalculation) => void;
  onLoadCalculation?: (calculation: SavedCalculation) => void;
}

export const CalculationHistory: React.FC<CalculationHistoryProps> = ({
  currentCalculations = {},
  onSaveCalculation,
  onLoadCalculation
}) => {
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    borrowerName: '',
    propertyAddress: '',
    loanNumber: '',
    evaluationType: '',
    tags: ''
  });

  // Load saved calculations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('realign_saved_calculations');
    if (saved) {
      try {
        setSavedCalculations(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved calculations:', error);
      }
    }
  }, []);

  // Save calculations to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('realign_saved_calculations', JSON.stringify(savedCalculations));
  }, [savedCalculations]);

  const handleSaveCalculation = () => {
    if (!saveForm.name.trim()) {
      alert('Please provide a name for this calculation set.');
      return;
    }

    if (Object.keys(currentCalculations).length === 0) {
      alert('No calculations to save. Please run some calculations first.');
      return;
    }

    const newCalculation: SavedCalculation = {
      id: Date.now().toString(),
      name: saveForm.name.trim(),
      description: saveForm.description.trim(),
      calculations: currentCalculations,
      metadata: {
        borrowerName: saveForm.borrowerName.trim() || undefined,
        propertyAddress: saveForm.propertyAddress.trim() || undefined,
        loanNumber: saveForm.loanNumber.trim() || undefined,
        evaluationType: saveForm.evaluationType.trim() || undefined
      },
      timestamp: new Date().toISOString(),
      tags: saveForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    setSavedCalculations(prev => [newCalculation, ...prev]);
    
    // Clear form
    setSaveForm({
      name: '',
      description: '',
      borrowerName: '',
      propertyAddress: '',
      loanNumber: '',
      evaluationType: '',
      tags: ''
    });
    
    setShowSaveDialog(false);
    
    if (onSaveCalculation) {
      onSaveCalculation(newCalculation);
    }
  };

  const handleDeleteCalculation = (id: string) => {
    if (confirm('Are you sure you want to delete this calculation set?')) {
      setSavedCalculations(prev => prev.filter(calc => calc.id !== id));
    }
  };

  const handleLoadCalculation = (calculation: SavedCalculation) => {
    if (onLoadCalculation) {
      onLoadCalculation(calculation);
    }
  };

  const toggleComparisonSelection = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else if (prev.length < 3) { // Limit to 3 comparisons
        return [...prev, id];
      } else {
        alert('You can compare up to 3 calculation sets at a time.');
        return prev;
      }
    });
  };

  const getComparisonData = () => {
    return selectedForComparison.map(id => 
      savedCalculations.find(calc => calc.id === id)
    ).filter(Boolean) as SavedCalculation[];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (ratio: number) => {
    return `${(ratio * 100).toFixed(2)}%`;
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value < 1 && value > 0) {
        return formatPercentage(value);
      } else if (value > 100) {
        return formatCurrency(value);
      } else {
        return value.toFixed(2);
      }
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Calculation History
          </CardTitle>
          <CardDescription>
            Save and manage your financial calculation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button disabled={Object.keys(currentCalculations).length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Current Calculations
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Save Calculation Set</DialogTitle>
                  <DialogDescription>
                    Save your current calculations for future reference and comparison
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calc-name">Name *</Label>
                    <Input
                      id="calc-name"
                      value={saveForm.name}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Initial Analysis - Smith Property"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calc-description">Description</Label>
                    <Input
                      id="calc-description"
                      value={saveForm.description}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this analysis"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="calc-borrower">Borrower Name</Label>
                      <Input
                        id="calc-borrower"
                        value={saveForm.borrowerName}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, borrowerName: e.target.value }))}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calc-loan">Loan Number</Label>
                      <Input
                        id="calc-loan"
                        value={saveForm.loanNumber}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, loanNumber: e.target.value }))}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="calc-property">Property Address</Label>
                    <Input
                      id="calc-property"
                      value={saveForm.propertyAddress}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calc-tags">Tags (comma-separated)</Label>
                    <Input
                      id="calc-tags"
                      value={saveForm.tags}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="modification, short-sale, urgent"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveCalculation} className="flex-1">
                      Save Calculation Set
                    </Button>
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={selectedForComparison.length < 2}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Selected ({selectedForComparison.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Calculation Comparison</DialogTitle>
                  <DialogDescription>
                    Compare {selectedForComparison.length} saved calculation sets
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {getComparisonData().length > 0 && (
                    <ComparisonTable calculations={getComparisonData()} />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            {savedCalculations.length} saved calculation set(s)
            {selectedForComparison.length > 0 && ` • ${selectedForComparison.length} selected for comparison`}
          </div>

          <div className="grid gap-4">
            {savedCalculations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved calculations yet</p>
                <p className="text-sm">Run some calculations and save them to see them here</p>
              </div>
            ) : (
              savedCalculations.map((calculation) => (
                <Card key={calculation.id} className={`transition-colors ${
                  selectedForComparison.includes(calculation.id) ? 'border-primary bg-primary/5' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{calculation.name}</h4>
                          {calculation.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {calculation.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {calculation.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <div>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(calculation.timestamp).toLocaleDateString()}
                          </div>
                          <div>
                            <Calculator className="h-3 w-3 inline mr-1" />
                            {Object.keys(calculation.calculations).length} calculation(s)
                          </div>
                          {calculation.metadata.borrowerName && (
                            <div>Borrower: {calculation.metadata.borrowerName}</div>
                          )}
                          {calculation.metadata.evaluationType && (
                            <div>Type: {calculation.metadata.evaluationType}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleComparisonSelection(calculation.id)}
                        >
                          <GitCompare className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadCalculation(calculation)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCalculation(calculation.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ComparisonTable: React.FC<{ calculations: SavedCalculation[] }> = ({ calculations }) => {
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value < 1 && value > 0) {
        return `${(value * 100).toFixed(2)}%`;
      } else if (value > 100) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(value);
      } else {
        return value.toFixed(2);
      }
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (typeof value === 'object' && value !== null) {
      // For complex objects, show key metrics
      if ('contributionAmount' in value) return `$${value.contributionAmount}`;
      if ('housingDTI' in value) return `${value.housingDTI}%`;
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    return String(value);
  };

  // Get all unique calculation types across all saved calculations
  const allCalculationTypes = new Set<string>();
  calculations.forEach(calc => {
    Object.keys(calc.calculations).forEach(type => {
      allCalculationTypes.add(type);
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-2 text-left">Calculation Type</th>
            {calculations.map((calc, index) => (
              <th key={calc.id} className="border border-border p-2 text-left">
                <div className="text-sm font-medium">{calc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(calc.timestamp).toLocaleDateString()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(allCalculationTypes).map(calcType => (
            <tr key={calcType}>
              <td className="border border-border p-2 font-medium">
                {calcType.replace(/([A-Z])/g, ' $1').trim()}
              </td>
              {calculations.map(calc => (
                <td key={calc.id} className="border border-border p-2">
                  {calc.calculations[calcType] ? (
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatValue(calc.calculations[calcType].result)}
                      </div>
                      {calc.calculations[calcType].warnings && 
                       calc.calculations[calcType].warnings!.length > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          ⚠ {calc.calculations[calcType].warnings!.length} warning(s)
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalculationHistory;