
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, History, Edit } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome! Here you can find your assigned quizzes and track your progress.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" />
              Assigned Quizzes
            </CardTitle>
            <CardDescription>View and take quizzes assigned by your teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              (Placeholder: List of assigned quizzes would appear here.)
            </p>
            {/* Example:
            <ul className="space-y-2 mt-2">
              <li className="p-2 border rounded hover:bg-muted">Quiz on Chapter 1</li>
              <li className="p-2 border rounded hover:bg-muted">Midterm Review Quiz</li>
            </ul>
            */}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-6 w-6 text-accent" />
              My Results
            </CardTitle>
            <CardDescription>Review your performance on past quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              (Placeholder: Summary of past quiz results would appear here.)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
