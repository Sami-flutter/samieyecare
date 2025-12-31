import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader>
          <CardTitle>Access not set up</CardTitle>
          <CardDescription>
            Your account is signed in, but no role is assigned yet. Ask an admin to assign your role.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
