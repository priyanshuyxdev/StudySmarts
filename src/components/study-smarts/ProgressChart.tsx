
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"; // Ensure ChartConfig is exported or defined
import { TrendingUp } from "lucide-react";

// Dummy data for recent quiz performance
const chartData = [
  { quizName: "Ancient History", score: 7, total: 10, fill: "hsl(var(--chart-1))" },
  { quizName: "Biology Basics", score: 9, total: 10, fill: "hsl(var(--chart-1))"  },
  { quizName: "Chemistry 101", score: 6, total: 10, fill: "hsl(var(--chart-1))"  },
  { quizName: "Literature Review", score: 8, total: 10, fill: "hsl(var(--chart-1))"  },
  { quizName: "Math Puzzles", score: 5, total: 10, fill: "hsl(var(--chart-1))"  },
];

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function ProgressChart() {
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-6 w-6 text-primary" />
          Recent Quiz Performance (Example)
        </CardTitle>
        <CardDescription>
          This chart shows example scores from hypothetical past quizzes.
          Actual progress tracking would require user accounts and history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="quizName"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                stroke="hsl(var(--foreground))"
                className="text-xs"
              />
              <YAxis 
                domain={[0, 10]} 
                allowDecimals={false} 
                stroke="hsl(var(--foreground))"
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                            formatter={(value, name, props) => {
                                const item = chartData.find(d => d.quizName === props.payload.quizName);
                                return `${value} / ${item?.total || 10}`;
                            }}
                            labelFormatter={(label) => `Quiz: ${label}`}
                        />}
              />
              <Bar dataKey="score" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
