
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Eye, Users, FileSignature } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
      <p className="text-muted-foreground">
        Manage your quizzes, assignments, and student progress.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusCircle className="mr-2 h-6 w-6 text-primary" />
              Create New Quiz
            </CardTitle>
            <CardDescription>Use the StudySmarts tool to generate a new quiz from a document.</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/" passHref>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Quiz Creator
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">
              (This will take you to the main StudySmarts page for quiz generation.)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSignature className="mr-2 h-6 w-6 text-accent" />
              Manage Quizzes
            </CardTitle>
            <CardDescription>View, edit, or assign your created quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              (Placeholder: List of created quizzes and assignment options would appear here.)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6" style={{ color: 'hsl(var(--chart-2))' }} />
              Student Progress
            </CardTitle>
            <CardDescription>Track submissions and results for your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              (Placeholder: Overview of student performance and submissions would appear here.)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
