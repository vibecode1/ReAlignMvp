import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calculator, 
  Phone, 
  CheckCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'documents',
    name: 'Documentation',
    icon: FileText,
    progress: 0.85,
    completed: 17,
    total: 20,
    color: 'text-calm-sky',
  },
  {
    id: 'financial',
    name: 'Financial Analysis',
    icon: Calculator,
    progress: 0.92,
    completed: 11,
    total: 12,
    color: 'text-sage-green',
  },
  {
    id: 'communication',
    name: 'Servicer Communication',
    icon: Phone,
    progress: 0.67,
    completed: 4,
    total: 6,
    color: 'text-warm-amber',
  },
  {
    id: 'compliance',
    name: 'Compliance Check',
    icon: CheckCircle,
    progress: 1.0,
    completed: 8,
    total: 8,
    color: 'text-lavender-mist',
  },
];

export function ProgressDashboard() {
  const overallProgress = 0.73;
  
  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock size={12} />
              Est. 5 days remaining
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Circular Progress */}
            <div className="relative">
              <CircularProgress 
                value={overallProgress} 
                size={140}
                strokeWidth={12}
                className="text-sage-green"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.round(overallProgress * 100)}%</span>
                  <span className="text-sm text-muted-foreground">Complete</span>
                </div>
              </CircularProgress>
              
              {/* Celebration Particles */}
              {overallProgress > 0.7 && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="celebration-particle bg-sage-green"
                      style={{
                        '--particle-x': `${Math.random() * 100 - 50}px`,
                        left: '50%',
                        top: '50%',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Achievement Badge */}
            {overallProgress > 0.7 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-warm-amber to-soft-sunset rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Great Progress!</p>
                  <p className="text-xs text-muted-foreground">You're ahead of schedule</p>
                </div>
              </motion.div>
            )}
            
            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-semibold">40 of 46</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-semibold flex items-center gap-1">
                  12 days
                  <TrendingUp className="w-4 h-4 text-sage-green" />
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        'bg-muted',
                        category.color
                      )}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {category.completed} of {category.total} completed
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">
                      {Math.round(category.progress * 100)}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={category.progress * 100} 
                    className="h-2"
                  />
                  
                  {category.progress === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 mt-2 text-xs text-sage-green"
                    >
                      <CheckCircle size={12} />
                      <span>All tasks completed!</span>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function CircularProgress({
  value,
  size = 100,
  strokeWidth = 8,
  className,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-500 ease-out', className)}
          strokeLinecap="round"
        />
      </svg>
      
      {children}
    </div>
  );
}